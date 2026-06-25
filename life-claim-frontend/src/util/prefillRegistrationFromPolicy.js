/**
 * Map Life Asia policy + client data into registration wizard fields
 * (Contract Details, Eagle Screen, and related demographics).
 */

function pickClient(policy, roles = []) {
  const clients = Array.isArray(policy?.clients) ? policy.clients : []
  if (!clients.length) return null
  const match = clients.find((c) => {
    const role = String(c.role || '').toLowerCase()
    return roles.some((r) => role.includes(r))
  })
  return match || clients[0]
}

function isEmpty(value) {
  return value == null || String(value).trim() === ''
}

function setIfEmpty(patch, key, value, existing = {}) {
  if (!isEmpty(value) && isEmpty(existing[key])) {
    patch[key] = value
  }
}

/**
 * Returns partial policyData fields to merge after policy load.
 * Does not overwrite user-entered values.
 */
export function buildPolicyRegistrationPrefill(policy, existingData = {}) {
  if (!policy) return {}

  const patch = {}
  const la = pickClient(policy, ['life assured', 'la', 'self']) || policy.clients?.[0]
  const nominee = pickClient(policy, ['nominee', 'claimant', 'payee'])

  // ── Contract details (Life Asia ContractDetails) ──
  setIfEmpty(patch, 'appNo', policy.applicationNo, existingData)
  setIfEmpty(patch, 'cdfDate', policy.cdfDate, existingData)
  setIfEmpty(patch, 'issueDate', policy.issueDate, existingData)
  setIfEmpty(patch, 'riskCommencementDate', policy.riskCommencementDate, existingData)
  setIfEmpty(patch, 'paidToDate', policy.paidToDate, existingData)
  setIfEmpty(patch, 'premiumFrequency', policy.premiumFrequency, existingData)
  setIfEmpty(patch, 'premiumStatus', policy.premiumStatus, existingData)
  setIfEmpty(patch, 'term', policy.term, existingData)
  setIfEmpty(patch, 'premPaidYrs', policy.premPaidYrs, existingData)
  setIfEmpty(patch, 'totalPremiumPaid', policy.totalPremiumPaid, existingData)
  setIfEmpty(patch, 'originalSA', policy.originalSA ?? policy.sumAssured, existingData)
  setIfEmpty(patch, 'currentSA', policy.currentSA ?? policy.sumAssured, existingData)
  setIfEmpty(patch, 'cashValue', policy.cashValue, existingData)
  setIfEmpty(patch, 'maturityValue', policy.maturityValue, existingData)
  setIfEmpty(patch, 'outstandingLoan', policy.outstandingLoan, existingData)
  setIfEmpty(patch, 'excessPremium', policy.excessPremium, existingData)
  setIfEmpty(patch, 'uwDecision', policy.uwDecision, existingData)
  setIfEmpty(patch, 'uwDecisionDate', policy.uwDecisionDate, existingData)
  setIfEmpty(patch, 'advisorCode', policy.advisorCode, existingData)
  setIfEmpty(patch, 'advisorStatus', policy.advisorStatus, existingData)
  setIfEmpty(patch, 'assignment', policy.assignment, existingData)
  setIfEmpty(patch, 'salesChannel', policy.salesChannel, existingData)
  setIfEmpty(patch, 'ekitPrinted', policy.ekitPrinted, existingData)
  setIfEmpty(patch, 'productName', policy.productName, existingData)
  setIfEmpty(patch, 'productCode', policy.productCode, existingData)
  setIfEmpty(patch, 'sumAssured', policy.sumAssured, existingData)

  // ── Life assured from LA client ──
  if (la) {
    setIfEmpty(patch, 'laClientId', la.clientId, existingData)
    setIfEmpty(patch, 'laName', [la.name, la.lastName].filter(Boolean).join(' '), existingData)
    setIfEmpty(patch, 'laDob', la.dob, existingData)
    setIfEmpty(patch, 'laGender', la.gender, existingData)
    setIfEmpty(patch, 'laMobileNo', la.mobileNo, existingData)
    setIfEmpty(patch, 'laEmailId', la.emailId, existingData)
    setIfEmpty(patch, 'laCity', la.city, existingData)
    setIfEmpty(patch, 'laState', la.state, existingData)
    setIfEmpty(patch, 'laPincode', la.pincode, existingData)
    setIfEmpty(patch, 'laOccCode', la.occCode, existingData)
    setIfEmpty(patch, 'laOccDesc', la.occDesc, existingData)
    setIfEmpty(patch, 'laEducation', la.education, existingData)
    setIfEmpty(patch, 'laIncome', la.income, existingData)
  }

  // ── Eagle screen ──
  const claimantMobile =
    existingData.claimants?.[0]?.mobileNo ||
    nominee?.mobileNo ||
    null

  setIfEmpty(patch, 'eagleLaMobile', existingData.laMobileNo || la?.mobileNo, existingData)
  setIfEmpty(patch, 'eagleClaimantMobile', claimantMobile, existingData)
  setIfEmpty(patch, 'eagleAgentMobile', policy.agentMobile, existingData)
  setIfEmpty(patch, 'eagleBankName', policy.bankName, existingData)
  setIfEmpty(patch, 'eagleAccNo', policy.accountNo, existingData)
  setIfEmpty(patch, 'eagleAccOpenDate', policy.accountOpenDate, existingData)
  setIfEmpty(patch, 'eagleOccupation', existingData.laNatureOfWork || la?.occDesc, existingData)

  return patch
}

export function countPrefillFields(patch) {
  return Object.keys(patch || {}).length
}
