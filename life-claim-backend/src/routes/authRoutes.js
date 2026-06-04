const express = require('express');
const https = require('https');
const authService = require('../services/authService');
const axios = require('axios');
const qs = require('qs');
const db = require('../config/dbConfig');
const { recordLogin, recordLogout } = require('../services/auditLogService');
const { authTokenLimiter } = require('../middleware/rateLimiters');
const userDao = require('../dataAccess/userDao');
const keycloakLoginLockout = require('../services/keycloakLoginLockout');
const { validateKeycloakTokenBody, validateAuthenticateBody } = require('../middleware/requestValidation');

const router = express.Router();
const SINGLE_SESSION_ENFORCED = process.env.SINGLE_SESSION_ENFORCED !== 'false';

const cookieOptsForClear = () => {
  const useHttps = process.env.USE_HTTPS === 'true';
  return {
    httpOnly: true,
    // Ensure Secure is set automatically on HTTPS, without breaking local HTTP workflows.
    secure: process.env.NODE_ENV === 'production' ? true : (useHttps ? true : 'auto'),
    sameSite: 'lax',
    path: '/api',
  };
};

/** Clears legacy httpOnly JWT cookie (VAPT: session / forceful browsing hygiene). No auth required. */
router.post('/clear-token-cookie', (req, res) => {
  res.clearCookie('token', cookieOptsForClear());
  res.status(204).send();
});

const decodeJwtPayload = (token) => {
  try {
    const payloadPart = token.split('.')[1];
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
};

function keycloakAxiosOptions() {
  const opts = {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: Number(process.env.KEYCLOAK_REQUEST_TIMEOUT_MS || 20000),
  };
  // Keep insecure TLS for non-production troubleshooting only.
  const insecureTlsRequested = process.env.KEYCLOAK_TLS_INSECURE === 'true';
  const allowInsecureTls = insecureTlsRequested && process.env.NODE_ENV !== 'production';
  if (allowInsecureTls) {
    opts.httpsAgent = new https.Agent({ rejectUnauthorized: false });
  } else if (insecureTlsRequested && process.env.NODE_ENV === 'production') {
    console.error('[security] KEYCLOAK_TLS_INSECURE=true is ignored in production.');
  }
  return opts;
}

// Proxy route for Keycloak token endpoint to avoid CORS issues
router.post('/keycloak/token', authTokenLimiter, validateKeycloakTokenBody, async (req, res, next) => {
  const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
  const tokenEndpoint = `${keycloakUrl.replace(/\/$/, '')}/realms/life-claims/protocol/openid-connect/token`;
  const loginUsername = req.body?.username;

  if (loginUsername && keycloakLoginLockout.enabled()) {
    const blocked = keycloakLoginLockout.isBlocked(loginUsername);
    if (blocked.blocked) {
      const mins = Math.max(1, Math.ceil(blocked.remainingMs / 60000));
      return res.status(403).json({
        error: 'account_temporarily_locked',
        error_description: `Too many failed sign-in attempts. Try again in about ${mins} minute(s).`,
        lockout: true,
        remainingMs: blocked.remainingMs,
      });
    }
  }

  try {
    // Convert parsed req.body back to URL-encoded format for Keycloak
    const response = await axios.post(
      tokenEndpoint,
      qs.stringify(req.body),
      keycloakAxiosOptions()
    );

    // Mirror login-audit behavior for Keycloak-based login flow.
    const payload = decodeJwtPayload(response.data?.access_token || '');
    const username = payload?.preferred_username || req.body?.username;
    const roles = payload?.realm_access?.roles || [];
    const sessionId = payload?.sid || payload?.jti || null;

    if (SINGLE_SESSION_ENFORCED && username && sessionId) {
      const user = await userDao.getUserByUsername(username);
      const existing = user?.current_session_id || null;
      if (existing && existing !== sessionId) {
        return res.status(403).json({
          message: 'Concurrent login is not allowed. Please logout from your active session first.',
        });
      }
      if (user?.id) {
        await userDao.setCurrentSessionIdByUserId(user.id, sessionId);
      }
    }

    if (username) {
      keycloakLoginLockout.clearFailures(loginUsername || username);
      await recordLogin({
        username,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        roles,
      });
    }

    // Return the response from Keycloak
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      const data = error.response.data || {};
      // Only count end-user credential failures, not invalid_client / misconfiguration.
      const grantFailed =
        loginUsername &&
        keycloakLoginLockout.enabled() &&
        data.error === 'invalid_grant';

      if (grantFailed) {
        const r = keycloakLoginLockout.recordFailure(loginUsername);
        if (r.justLocked) {
          const mins = Math.max(1, Math.ceil(keycloakLoginLockout.lockDurationMs() / 60000));
          return res.status(403).json({
            error: 'account_temporarily_locked',
            error_description: `Too many failed sign-in attempts. This account is temporarily locked for about ${mins} minute(s).`,
            lockout: true,
            remainingMs: r.remainingMs,
          });
        }
        // Normalize invalid login error to avoid reflecting IdP-specific wording.
        return res.status(401).json({
          error: 'invalid_credentials',
          error_description: 'Invalid username or password.',
        });
      }

      // Keycloak returned an error
      res.status(error.response.status).json(error.response.data);
      return;
    }
    // Network: ECONNREFUSED, socket hang up, ETIMEDOUT, wrong http/https, Keycloak down, TLS mismatch
    const code = error.code || '';
    const msg = error.message || 'Unknown error';
    console.error(
      `[auth] Keycloak token request failed → ${tokenEndpoint} | ${code} ${msg}`
    );
    res.status(503).json({
      error: 'keycloak_unreachable',
      message:
        'Login service could not reach Keycloak. Check that Keycloak is running and KEYCLOAK_URL in the backend .env matches its real URL (http vs https, host, port).',
      detail: msg,
      code: code || undefined,
      attemptedUrl: tokenEndpoint,
    });
  }
});

router.post('/logout-audit', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const payload = token ? decodeJwtPayload(token) : null;
  const username = payload?.preferred_username || req.body?.username;
  const sessionId = payload?.sid || payload?.jti || null;
  const rawReason = req.body?.logoutReason ?? req.body?.reason;
  const logoutReason =
    typeof rawReason === 'string' && rawReason.trim() ? rawReason.trim().slice(0, 128) : '';

  if (username) {
    await recordLogout({ username, logoutReason: logoutReason || undefined });
    const user = await userDao.getUserByUsername(username);
    if (user?.id) {
      const existing = user.current_session_id || null;
      if (!sessionId || !existing || existing === sessionId) {
        await userDao.setCurrentSessionIdByUserId(user.id, null);
      }
    }
  }

  res.status(204).send();
});

router.post('/authenticate', validateAuthenticateBody, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const token = bearer || (req.cookies && req.cookies.token) || req.body.token;
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    try {
      const user = await authService.authenticateUser(token);
      res.json({ message: 'Authentication successful', user: { username: user.username, roles: user.roles } });
    } catch (authError) {
      const payload = decodeJwtPayload(token || '');
      if (payload?.preferred_username) {
        const logoutReason = authError.message.includes('Session expired')
          ? 'concurrent_login'
          : 'auth_failed';
        await recordLogout({ username: payload.preferred_username, logoutReason });
      }
      if (authError.message.includes('Session expired')) {
        res.clearCookie('token', cookieOptsForClear()); // Clear the cookie if session expired elsewhere
        return res.status(401).json({ 
          message: 'Your session has expired because you logged in from another device.',
          concurrentLogout: true 
        });
      }
      throw authError; // Rethrow other errors
    }
  } catch (error) {
    next(error);
  }
});

// Public endpoint: return the latest successful login across the whole audit table.
router.get('/last-login', async (req, res, next) => {
  try {
    const query = `
      SELECT USERNAME, LOGIN_AT
      FROM claims_poc.user_login_audit
      ORDER BY LOGIN_AT DESC
      LIMIT 1
    `;
    const [rows] = await db.execute(query);
    return res.json({
      lastLoginAt: rows?.[0]?.LOGIN_AT || null,
      username: rows?.[0]?.USERNAME || null,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
