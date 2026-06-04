import { API_URL } from '../util/config';
import { notifyOtherTabsLogout } from '../util/authBroadcast';

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

const authService = {
  login: async (username, password) => {
    const params = new URLSearchParams();
    params.append('client_id', 'life-claims-frontend');
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);

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
    sessionStorage.setItem('refreshToken', data.refresh_token);
    sessionStorage.setItem('loggedUser', username);
    return data;
  },

  authenticate: async () => {
    const token = sessionStorage.getItem('token');
    if (!token) throw new Error("No token found");

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const payload = JSON.parse(jsonPayload);
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        await writeLogoutAudit(token, { logoutReason: 'token_expired' });
        throw new Error("Token expired");
      }

      return {
        preferred_username: payload.preferred_username || payload.sub,
        roles: payload.realm_access?.roles || []
      };
    } catch (error) {
      console.error("Token validation error:", error);
      throw new Error("Invalid token format");
    }
  },

  getLastLogin: async () => {
    const res = await fetch(`${API_URL}/api/auth/last-login`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.lastLoginAt || null;
  },

  logout: async (opts = {}) => {
    notifyOtherTabsLogout();
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
