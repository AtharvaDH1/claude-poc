import claimsServices from './claimsServices'
import { claimSearch } from './claimSearchService'
import registerPolicyService from './registerPolicyService'
import wrapper from '../util/ApiWrapper'

export const getClaimsByUser = (username) => claimsServices.getClaimByUsername(username)

export const searchClaims = async ({ q, claimNumber } = {}) => {
  const num = claimNumber || q
  if (!num) return { claims: [] }
  const data = await claimSearch.claimSearchNumber(num)
  if (!data) return { claims: [] }
  return { claims: Array.isArray(data) ? data : [data] }
}

export const getClaimByNumber = async (claimNumber) => {
  const response = await wrapper.fetchWithToken(`/claims/${encodeURIComponent(claimNumber)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  return response.json()
}

export const registerClaim = async (policyData) => registerPolicyService({ policyData })

export const changeClaimStatus = async (claimNumber, status, remarks, decision) => {
  const response = await wrapper.fetchWithToken('/claims/changeStatus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimNumber, status, remarks, decision }),
  })
  return response.json()
}

export const assignClaim = (claimNumber, assignTo, role) =>
  claimsServices.assignClaim({ claimNumber, assignTo, role })

export default {
  getClaimsByUser,
  searchClaims,
  getClaimByNumber,
  registerClaim,
  changeClaimStatus,
  assignClaim,
}
