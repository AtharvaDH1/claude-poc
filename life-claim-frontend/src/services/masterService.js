import causeEventService from './causeEventService'
import trapScoreService from './trapScoreService'
import assessmentQuestionsService from './assessmentQuestionsService'
import systemDecisionAndReasonService from './systemDecisionAndReasonService'
import statesService from './statesService'
import countriesService from './countriesService'
import wrapper from '../util/ApiWrapper'

export const getStates = () => statesService.getAllStates()

export const getCountries = () => countriesService.getAllCountries()

export const getCauseEvents = () => causeEventService.causeEvent()

export const getAssessmentQuestions = async (policyData = {}) => {
  const result = await assessmentQuestionsService(policyData)
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.questions)) return result.questions
  if (Array.isArray(result?.data)) return result.data
  return []
}

export const getSystemDecision = async (policyData) => {
  const result = await systemDecisionAndReasonService(policyData)
  return {
    recommendation: result?.recommendation || result?.systemRecommendation,
    payableAmount: result?.payableAmount || result?.systemPayableAmount,
    reason: result?.reason || result?.systemReason,
    riskScore: result?.riskScore || result?.trapScore,
    processedOn: result?.processedOn || new Date().toISOString().split('T')[0],
  }
}

export const getTrapScore = async (params) => trapScoreService(params)

export const getRoles = async () => {
  const response = await wrapper.fetchWithToken('/role/getroles')
  const payload = await response.json().catch(() => null)
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.roles)) return payload.roles
  return []
}
