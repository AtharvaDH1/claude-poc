import { getPolicyClients } from './policyClients'

/** Policy age from date of death/event vs contract RCD (v1 ContactDetails). */
export function computePolicyAge(dateOfDeathEvent, riskCommencementDate) {
  if (!dateOfDeathEvent || !riskCommencementDate) {
    return { policyAge: null, policyAge1: null, policyAgeLabel: null }
  }
  const end = new Date(dateOfDeathEvent)
  const start = new Date(riskCommencementDate)
  if (Number.isNaN(end.getTime()) || Number.isNaN(start.getTime()) || end < start) {
    return { policyAge: null, policyAge1: null, policyAgeLabel: null }
  }

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  let days = end.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  const policyAge1 = Math.round((totalDays / 365.25) * 10) / 10
  const policyAgeLabel = `${years} years ${months} months ${days} days`

  return { policyAge: policyAgeLabel, policyAge1, policyAgeLabel }
}

function laClient(data, policy) {
  const clients = getPolicyClients(policy)
  return clients[0] || {}
}

export function buildIntimationDetails(data, policy) {
  return {
    claimType: data.claimType,
    policyStatus: data.policyStatus || policy?.premiumStatus || data.initialPolicyStatus,
    intimationType: data.informationType,
    initiationDate: data.initiationDate,
    intimationDate: data.intimationDate,
    source: data.source,
    firPmReceived: data.firPmReceived,
    bondType: data.bondType,
    whatsappFlag: data.whatsappFlag,
    declaredByDoctor: data.declaredByDoctor,
    portfolio: data.portfolioType,
    lifeAsrStatus: data.lifeAsrStatus,
    dateOfDeathEvent: data.dateOfDeathEvent,
    dateOfDeathReg: data.dateOfDeathReg,
    dateOfCremation: data.dateOfCremation,
    dateOfAccident: data.dateOfAccident,
    placeOfDeathTi: data.placeOfDeath,
    policyStatusOnDoddoe: data.policyStatusOnDod,
    policyStatusEditRemark: data.policyStatusEditRemark,
    deathCertificate: data.deathCertificate,
    deathCertificateRegNumber: data.dcRegNumber,
    deathCertificateRegDate: data.dcRegDate,
    deathCertificateIssueDistrict: data.dcIssueDistrict,
    deathCertificateIssuingAuthority: data.dcIssuingAuthority,
    deathCertificateTehsil: data.dcTehsil,
    deathCertificateIssueState: data.dcIssueState,
    deathCertificatePlaceOnCertificate: data.dcPlaceOnCertificate,
    deathCertificateVillageBlock: data.dcVillageBlock,
    deathCertificateOfficerPosition: data.dcOfficerPosition,
    initialPolicyStatus: data.initialPolicyStatus || data.policyStatusOnDod || policy?.premiumStatus,
  }
}

export function buildCauseEvent(data) {
  return {
    typeOfClaim: data.typeOfClaim,
    causeCode: data.causeCode,
    causeDescription: data.causeDescription,
    causeCategory: data.causeCategory,
    causeOfClaim: data.causeOfClaim || data.causeDescription || data.causeCode,
    ifOthersSpecify: data.causeIfOthers || '',
    dateOfEvent: data.causeEventDate || data.dateOfDeathEvent,
    polStatusOnEvent: data.policyStatusOnEvent || data.policyStatusOnDod,
    claimSubType: data.causeSubType || data.claimSubType,
    claimRegistrationType: data.claimRegistrationType,
  }
}

export function buildLifeAssuredDetails(data, policy) {
  const c = laClient(data, policy)
  return {
    name: data.laName || [c.name, c.lastName].filter(Boolean).join(' '),
    clientId: data.laClientId || c.clientId,
    dob: data.laDob || c.dob,
    gender: data.laGender || c.gender,
    riskIndicator: data.laRiskIndicator || c.riskIndicator,
    ageAtDeath: data.laAgeAtDeath,
    idProofType: data.laIdProofType,
    idNumber: data.laIdNumber || c.idNumber,
    mobileNo: data.laMobileNo || c.mobileNo,
    emailId: data.laEmailId || c.emailId,
    flat: data.laFlat || c.flat,
    road: data.laRoad || c.road,
    area: data.laArea || c.area,
    city: data.laCity || c.city,
    state: data.laState || c.state,
    pincode: data.laPincode || c.pincode,
    occCode: data.laOccCode,
    occDesc: data.laOccDesc,
    income: data.laIncome,
    estName: data.laEstName,
    designation: data.laDesignation,
    natureOfWork: data.laNatureOfWork,
  }
}

export function buildContactDetails(data, policy) {
  const age = computePolicyAge(
    data.dateOfDeathEvent,
    data.riskCommencementDate || policy?.riskCommencementDate
  )
  return {
    appNo: data.appNo,
    policyNo: data.policyId || policy?.policyId,
    productName: data.productName || policy?.productName,
    productCode: data.productCode || policy?.productCode,
    cdfDate: data.cdfDate,
    issueDate: data.issueDate || policy?.issueDate,
    riskCommencementDate: data.riskCommencementDate || policy?.riskCommencementDate,
    paidToDate: data.paidToDate || policy?.paidToDate,
    premiumFrequency: data.premiumFrequency || policy?.premiumFrequency,
    premiumStatus: data.premiumStatus || policy?.premiumStatus,
    term: data.term || policy?.term,
    premPaidYrs: data.premPaidYrs || policy?.premPaidYrs,
    totalPremiumPaid: data.totalPremiumPaid || policy?.totalPremiumPaid,
    originalSa: data.originalSA || policy?.originalSA,
    currentSa: data.currentSA || policy?.currentSA,
    cashValue: data.cashValue || policy?.cashValue,
    maturityValue: data.maturityValue || policy?.maturityValue,
    outstandingLoan: data.outstandingLoan,
    excessPremium: data.excessPremium,
    uwDecision: data.uwDecision || policy?.uwDecision,
    uwDecisionDate: data.uwDecisionDate || policy?.uwDecisionDate,
    advisorCode: data.advisorCode || policy?.advisorCode,
    advisorStatus: data.advisorStatus || policy?.advisorStatus,
    nameChangeDecl: data.nameChangeDecl,
    ekitPrinted: data.ekitPrinted || policy?.ekitPrinted,
    assignment: data.assignment || policy?.assignment,
    salesChannel: data.salesChannel || policy?.salesChannel,
    policyAge: data.policyAge || age.policyAgeLabel,
    policyAge1: data.policyAge1 ?? age.policyAge1,
    availableSa: data.currentSA || policy?.currentSA || data.sumAssured || policy?.sumAssured,
  }
}

export function buildTrapScoreData(data, policy) {
  const c = laClient(data, policy)
  const age = computePolicyAge(
    data.dateOfDeathEvent,
    data.riskCommencementDate || policy?.riskCommencementDate
  )
  return {
    trapScore: data.trapScore,
    trapRisk: data.trapRisk,
    trapRemarks: data.trapRemarks,
    trapDate: data.trapDate,
    gender: data.laGender || c.gender,
    availableSa: data.sumAssured || policy?.sumAssured,
    ageAtDeath: data.laAgeAtDeath,
    policyAge: data.policyAge1 ?? age.policyAge1,
    causeOfDeath: data.causeOfClaim || data.causeDescription || data.causeCode,
    placeOfClaim: data.placeOfDeath,
    firPmReceived: data.firPmReceived,
    declaredByDoctor: data.declaredByDoctor,
    claimType: data.claimType,
    typeOfClaim: data.typeOfClaim,
    intimationDate: data.intimationDate,
    dateOfDeathEvent: data.dateOfDeathEvent,
    productCode: data.productCode || policy?.productCode,
    advisorCode: data.advisorCode || policy?.advisorCode,
    advisorStatus: data.advisorStatus || policy?.advisorStatus,
    city: data.laCity || c.city,
    pincode: data.laPincode || c.pincode,
    occCategory: data.laOccCode,
  }
}

export function buildEagleScreen(data) {
  return {
    laMobile: data.eagleLaMobile,
    claimantMobile: data.eagleClaimantMobile,
    agentMobile: data.eagleAgentMobile,
    bankName: data.eagleBankName,
    accountNo: data.eagleAccNo,
    accountOpenDate: data.eagleAccOpenDate,
    centerName: data.eagleCenterName,
    doctorName: data.eagleDoctorName,
    occupation: data.eagleOccupation,
    advisorHistoryCount: data.advisorHistoryCount,
  }
}

/** Map flat v2 wizard state → v1 register-claim body (keeps flat fields too). */
export function buildRegistrationPayload(flat, policy) {
  const claimants = flat.claimants || flat.claimantDetails || []
  return {
    ...flat,
    policyID: flat.policyId || flat.policyID,
    intimationDetails: buildIntimationDetails(flat, policy),
    causeEvent: buildCauseEvent(flat),
    payeeDetails: flat.payeeDetails || [],
    claimantDetails: claimants,
    lifeAssuredDetails: buildLifeAssuredDetails(flat, policy),
    contactDetails: buildContactDetails(flat, policy),
    eagleScreen: buildEagleScreen(flat),
    hospitalDetailsTable: flat.hospitalDetails || [],
    doctorDetailsTable: flat.doctorDetails || [],
    proofDetailsTable: flat.proofDetails || [],
    insuranceProofDetailsTable: flat.insProofDetails || [],
    witnessDetailsTable: flat.witnessDetails || [],
    incomeDetailsTable: flat.incomeDetails || [],
    agentHistoryTable: policy?.agentRepudiation || flat.agentHistoryTable || [],
    trapScoreData: buildTrapScoreData(flat, policy),
    riderDetailsTable1: policy?.riders || flat.riderDetailsTable1 || [],
  }
}

/** Sync v1 nested keys into flat state (for Requirements / trap / register). */
export function syncDemographicsSections(flat, policy) {
  const age = computePolicyAge(
    flat.dateOfDeathEvent,
    flat.riskCommencementDate || policy?.riskCommencementDate
  )
  return {
    intimationDetails: buildIntimationDetails(flat, policy),
    causeEvent: buildCauseEvent(flat),
    lifeAssuredDetails: buildLifeAssuredDetails(flat, policy),
    contactDetails: buildContactDetails(flat, policy),
    trapScoreData: buildTrapScoreData(flat, policy),
    eagleScreen: buildEagleScreen(flat),
    policyAge: flat.policyAge || age.policyAgeLabel,
    policyAge1: flat.policyAge1 ?? age.policyAge1,
  }
}
