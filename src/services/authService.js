import api from './api'

export const loginUser = async (username, password) => {
  const res = await api.post('/auth/keycloak/token', { username, password })
  return res.data // { access_token, user: { id, username, name, role, roles, avatar, email } }
}

export const logoutUser = async () => {
  try { await api.post('/auth/logout-audit') } catch {}
}

export const getLastLogin = async () => {
  const res = await api.get('/auth/last-login')
  return res.data.lastLogin
}

export const validateToken = async (token) => {
  const res = await api.post('/auth/authenticate', { token })
  return res.data
}
