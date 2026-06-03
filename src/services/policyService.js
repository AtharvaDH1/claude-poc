import api from './api'

export const fetchPolicyDetails = async (policyId) => {
  const res = await api.get(`/policy/${policyId}`)
  return res.data
}

export const getAgentRepudiation = async (agentCode) => {
  const res = await api.get(`/agentRepudiation/${agentCode}`)
  return res.data
}
