import api from './api'

export const getDashboardData = async () => {
  const res = await api.get('/dashboard/activities')
  return res.data
}

export const getAdminSummary = async () => {
  const res = await api.get('/admin/summary')
  return res.data
}

export const getRecentClaims = async () => {
  const res = await api.get('/admin/claims/recent')
  return res.data
}
