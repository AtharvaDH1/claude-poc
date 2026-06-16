import { API_URL } from '../util/config';
import { notifyOtherTabsLogout } from '../util/authBroadcast';
import { encryptPasswordForLogin } from '../util/loginCrypto';

const REFRESH_BUFFER_SEC = 90;

const writeLogoutAudit = async (token, meta = {}) => {
  if (!token) return;
  const logoutReason =
    typeof meta.logoutReason === 'string' && meta.logoutReason.trim()
      ? meta.logoutReason.trim().slice(0, 120)
      : '';
  const body = logoutReason ? JSON.stringify({ logoutReason }) : '{}';
  try {
    await fetch(`${API_URL}/api/auth/logout-audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      keepalive: true,
      body,
    });
  } catch {
    // Best-effort only.
  }
};

function decodeJwtPayload(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

const authService = {
  login: async (username, password, captchaToken) => {
    let passwordPayload = password;
    let passwordEncrypted = false;
    try {
      passwordPayload = await encryptPasswordForLogin(password);
      passwordEncrypted = true;
    } catch {
      passwordPayload = password;
      passwordEncrypted = false;
    }

    const params = new URLSearchParams();
    params.append('client_id', 'life-claims-frontend');
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', passwordPayload);
    if (passwordEncrypted) params.append('password_encrypted', 'true');
    if (captchaToken) params.append('captchaToken', captchaToken);

    const res = await fetch(`${API_URL}/api/auth/keycloak/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      credentials: 'include',
      body: params,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        data.error_description ||
        data.message ||
        data.error ||
        'Login failed';
      const err = new Error(msg);
      err.lockout = Boolean(data.lockout);
      err.remainingMs = Number(data.remainingMs) || 0;
      throw err;
    }

    const data = await res.json();
    sessionStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      sessionStorage.setItem('refreshToken', data.refresh_token);
    }
    sessionStorage.setItem('loggedUser', username);
    return data;
  },

  refreshAccessToken: async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    const res = await fetch(`${API_URL}/api/auth/keycloak/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    if (!data?.access_token) return false;

    sessionStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      sessionStorage.setItem('refreshToken', data.refresh_token);
    }
    return true;
  },

  verifyServerSession: async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      const err = new Error('No token found');
      err.code = 'no_token';
      throw err;
    }

    const res = await fetch(`${API_URL}/api/auth/session-check`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });

    if (res.ok) return { ok: true };

    const data = await res.json().catch(() => ({}));
    const err = new Error(data.message || 'Session invalid');
    err.concurrentLogout = Boolean(data.concurrentLogout);
    err.status = res.status;
    throw err;
  },

  authenticate: async () => {
    let token = sessionStorage.getItem('token');
    if (!token) throw new Error('No token found');

    let payload;
    try {
      payload = decodeJwtPayload(token);
    } catch {
      throw new Error('Invalid token format');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const exp = payload.exp || 0;

    if (exp && exp <= currentTime) {
      const refreshed = await authService.refreshAccessToken();
      if (refreshed) {
        token = sessionStorage.getItem('token');
        payload = decodeJwtPayload(token);
      } else {
        await writeLogoutAudit(token, { logoutReason: 'token_expired' });
        throw new Error('Token expired');
      }
    } else if (exp && exp - currentTime < REFRESH_BUFFER_SEC) {
      await authService.refreshAccessToken().catch(() => {});
      const next = sessionStorage.getItem('token');
      if (next) payload = decodeJwtPayload(next);
    }

    try {
      await authService.verifyServerSession();
    } catch (e) {
      if (e.concurrentLogout) throw e;
    }

    return {
      preferred_username: payload.preferred_username || payload.sub,
      roles: [...(payload.realm_access?.roles || []), ...(payload.roles || [])].filter(Boolean),
    };
  },

  logout: async (opts = {}) => {
    const hadToken = Boolean(sessionStorage.getItem('token'));
    const broadcastReason = opts.logoutReason || opts.reason || 'session';
    if (hadToken) notifyOtherTabsLogout(broadcastReason);
    try {
      const token = sessionStorage.getItem('token');
      await writeLogoutAudit(token, { logoutReason: opts.logoutReason || opts.reason });
      await fetch(`${API_URL}/api/auth/clear-token-cookie`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Keep logout resilient even if audit endpoint fails.
    }
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('loggedUser');
    return { success: true };
  },
};

export default authService;
