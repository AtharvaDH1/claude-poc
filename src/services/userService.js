import api from './api'

export const getUsers = async () => {
  const res = await api.get('/user')
  return res.data
}

export const getUserById = async (id) => {
  const res = await api.get(`/user/${id}`)
  return res.data
}

export const createUser = async (userData) => {
  const res = await api.post('/user', userData)
  return res.data
}

export const updateUser = async (id, updates) => {
  const res = await api.put(`/user/${id}`, updates)
  return res.data
}

export const deleteUser = async (id) => {
  await api.delete(`/user/${id}`)
}

export const getAuditLogs = async (params = {}) => {
  const res = await api.get('/admin/audit', { params })
  return res.data
}
