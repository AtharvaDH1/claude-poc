import api from './api'

export const getClaimsByUser = async (username) => {
  const res = await api.post('/claims/claimByUsername', username ? { username } : {})
  return res.data
}

export const searchClaims = async (params = {}) => {
  const res = await api.get('/claim-search', { params })
  return res.data
}

export const getClaimByNumber = async (claimNumber) => {
  const res = await api.get(`/claims/${claimNumber}`)
  return res.data
}

export const registerClaim = async (policyData) => {
  const res = await api.post('/register-claim', { policyData })
  return res.data
}

export const changeClaimStatus = async (claimNumber, status, remarks, decision) => {
  const res = await api.post('/claims/changeStatus', { claimNumber, status, remarks, decision })
  return res.data
}

export const assignClaim = async (claimNumber, assignTo, role) => {
  const res = await api.post('/claims/assignClaim', { claimNumber, assignTo, role })
  return res.data
}
