/** Build v1-shaped policyData from assessor-fetch raw bundles (Section F10). */

export function buildPolicyDataFromRaw(raw, claimNo, user) {
  const d = raw?.demogs || {}
  const r = raw?.requirements || {}
  const a = raw?.assessment || {}
  const dec = raw?.decision || {}

  return {
    claimNo: claimNo || raw?.searchRow?.CLAIM_NUMBER || raw?.searchRow?.claimNumber,
    modifiedBy: user?.username || sessionStorage.getItem('loggedUser') || '',
    intimationDetails: { ...(d.intimation || {}) },
    establishedCauseDetails: { ...(d.establishedCause || {}) },
    payeeDetails: Array.isArray(d.payee) ? d.payee : [],
    claimantDetails: Array.isArray(d.claimant) ? d.claimant : [],
    lifeAssuredDetails: { ...(d.lifeAssured || {}) },
    contactDetails: { ...(d.contact || {}) },
    eagleScreenDetails: { ...(d.eagle || {}) },
    hospitalDetailsTable: d.hospitalDetailsTable || [],
    doctorDetailsTable: d.doctorDetailsTable || [],
    proofDetailsTable: d.proofDetailsTable || [],
    insuranceProofDetailsTable: d.insuranceProofDetailsTable || [],
    witnessDetailsTable: d.witnessDetailsTable || [],
    incomeDetailsTable: d.incomeDetailsTable || [],
    trapScoreData: d.trap || d.trapScoreData || {},
    agentHistoryTable: d.agentHistoryTable || [],
    riderDetailsTable: d.riderDetailsTable || [],
    requirements: { ...(r.requirement || {}) },
    requirementTable: r.requirementTable || [],
    reqCommonDetailsTable: r.reqCommonDetailsTable || [],
    reqRiderDetailsTable: r.reqRiderDetailsTable || [],
    reqEmailDetailsTable: r.reqEmailDetailsTable || [],
    reqLetterDetailsTable: r.reqLetterDetailsTable || [],
    smsScriptTable: r.smsScriptTable || [],
    claimQuestions: { ...(a.assessment || a.claimQuestions || {}) },
    iibEnquiryTable: a.iibEnquiry || a.iibEnquiryTable || [],
    telecallingTable: a.telecalling || a.telecallingTable || [],
    caseTriggerTable: a.caseTrigger || a.caseTriggerTable || [],
    systemAssessorRemarks: a.remarks || a.systemRemarksTable || {},
    priorityFlagRemarks: a.priorityFlag || a.priorityFlagTable || {},
    accessorDetails: { ...(dec.decisionAccessor || {}) },
    verifierDetails: { ...(dec.decisionVerificationAndSummary || {}) },
    systemDetails: { ...(dec.decisionSystem || {}) },
  }
}

export function mergePolicyData(prev, patch) {
  if (!prev) return patch || {}
  const next = { ...prev, ...patch }
  const mergeObj = (key) => {
    if (patch?.[key] && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
      next[key] = { ...(prev[key] || {}), ...patch[key] }
    }
  }
  ;['intimationDetails', 'lifeAssuredDetails', 'contactDetails', 'eagleScreenDetails', 'establishedCauseDetails', 'requirements', 'accessorDetails', 'verifierDetails', 'systemDetails'].forEach(mergeObj)
  return next
}

export function applyDecisionEditsToPolicyData(policyData, edits) {
  if (!policyData || !edits) return policyData
  return mergePolicyData(policyData, {
    accessorDetails: {
      ...(policyData.accessorDetails || {}),
      decision: edits.accessorDecision,
      decisionReason: edits.accessorReason,
      remarks: edits.accessorReason,
      reqDamt: edits.accessorAmount,
    },
    verifierDetails: {
      ...(policyData.verifierDetails || {}),
      status: edits.verificationStatus,
      remarks: edits.verificationRemarks,
      verificationStatus: edits.verificationStatus,
      verificationRemarks: edits.verificationRemarks,
    },
  })
}
