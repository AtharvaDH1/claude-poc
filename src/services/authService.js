// ── BYPASS MODE — Keycloak disabled for local preview ─────────────────────
const BYPASS_USER = 'demo';
const BYPASS_ROLES = ['Pre Assessor', 'Assessor', 'Verifier', 'admin'];

const makeMockToken = (username) => {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    preferred_username: username,
    realm_access: { roles: BYPASS_ROLES },
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 h
  }));
  return `${header}.${payload}.bypass`;
};

export const login = async (username) => {
  // Skip Keycloak — accept any credentials
  const token = makeMockToken(username || BYPASS_USER);
  localStorage.setItem('token', token);
  sessionStorage.setItem('loggedUser', username || BYPASS_USER);
};

export const authenticate = () => {
  // Always authenticate — seed a token if none exists
  let token = localStorage.getItem('token');
  if (!token) {
    token = makeMockToken(BYPASS_USER);
    localStorage.setItem('token', token);
    sessionStorage.setItem('loggedUser', BYPASS_USER);
  }
  const payload = JSON.parse(atob(token.split('.')[1]));
  return {
    preferred_username: payload.preferred_username || BYPASS_USER,
    roles: payload.realm_access?.roles || BYPASS_ROLES,
  };
};
// ── END BYPASS ─────────────────────────────────────────────────────────────

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('loggedUser');
};

const authService = { login, authenticate, logout };
export default authService;
