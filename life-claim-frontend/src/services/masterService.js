import api from './api'

export const getStates = async () => {
  const res = await api.get('/states')
  return res.data
}

export const getCountries = async () => {
  const res = await api.get('/countries')
  return res.data
}

export const getCauseEvents = async () => {
  const res = await api.get('/cause-event')
  return res.data
}

export const getAssessmentQuestions = async () => {
  const res = await api.get('/assessment-questions')
  return res.data
}

export const getSystemDecision = async (policyData) => {
  const res = await api.post('/systemDec/system', { policyData })
  return res.data
}

export const getTrapScore = async (params) => {
  const res = await api.post('/trap-score', params)
  return res.data
}

export const getRoles = async () => {
  const res = await api.get('/role/roles')
  return res.data
}
