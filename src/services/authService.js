const KEYCLOAK_TOKEN_URL = 'http://localhost:8080/realms/life-claims/protocol/openid-connect/token';
const CLIENT_ID = 'life-claims-frontend';

export const login = async (username, password) => {
  const params = new URLSearchParams();
  params.append('client_id', CLIENT_ID);
  params.append('username', username);
  params.append('password', password);
  params.append('grant_type', 'password');

  const response = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || 'Login failed');
  }

  const data = await response.json();
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('refreshToken', data.refresh_token);
  sessionStorage.setItem('loggedUser', username);
  return data;
};

export const authenticate = () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');

  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');

  const payload = JSON.parse(atob(parts[1]));
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    throw new Error('Token expired');
  }

  const roles = payload.realm_access?.roles || [];
  return { preferred_username: payload.preferred_username, roles };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('loggedUser');
};

const authService = { login, authenticate, logout };
export default authService;
