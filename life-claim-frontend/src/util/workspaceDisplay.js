import {
  REGISTRATION_ASSESSMENT_QUESTIONS,
  REGISTRATION_REQUIREMENTS,
} from '../config/registrationCatalog'

const META_KEYS = new Set([
  'claimId',
  'createdBy',
  'modifiedBy',
  'createdAt',
  'modifiedAt',
])

/** HTML date input expects YYYY-MM-DD (strips ISO timestamps from DB). */
export function normalizeDateForInput(val) {
  if (val == null || val === '') return ''
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

/** Y/N or Yes/No → display label. */
export function formatYesNo(val) {
  if (val == null || val === '') return '—'
  const s = String(val).trim()
  if (s === 'Y' || s.toLowerCase() === 'yes') return 'Yes'
  if (s === 'N' || s.toLowerCase() === 'no') return 'No'
  return s
}

/** Map claim_questions row → 14 registration questions with labels. */
export function mapAssessmentForWorkspace(assessmentPayload = {}) {
  const raw =
    assessmentPayload?.assessment ||
    assessmentPayload?.claimQuestions ||
    assessmentPayload ||
    {}

  return REGISTRATION_ASSESSMENT_QUESTIONS.map((q, idx) => {
    const key = `question${idx}`
    const val = raw[key] ?? raw[`question${q.id}`] ?? raw[`question${q.id - 1}`]
    return {
      id: q.id,
      question: q.question,
      answer: formatYesNo(val),
      key,
    }
  })
}

/** Apply status change to a requirement row (matches registration RequirementsTab logic). */
export function patchRequirementRowStatus(row, status) {
  const today = new Date().toISOString().split('T')[0]
  const receiptDate = status === 'Received' ? today : null
  return {
    ...row,
    status,
    status1: status,
    documentStatus: status,
    receiptDate,
    receiptDate1: receiptDate,
  }
}

/** Normalize requirement rows from assessor-fetch into registration-style table rows. */
export function mapRequirementsForWorkspace(requirementsPayload = {}) {
  const rows = requirementsPayload?.requirementTable || []
  if (!Array.isArray(rows) || !rows.length) return []

  return rows.map((row, i) => {
    const catalog = REGISTRATION_REQUIREMENTS[i]
    const name =
      row.requirementName ||
      row.requirementName1 ||
      row.documentName ||
      row.name ||
      row.remarks ||
      catalog?.name ||
      `Requirement ${i + 1}`

    return {
      id: row.reqMappingId || row.id || catalog?.id || i + 1,
      name,
      docType:
        row.requirementType ||
        row.requirementType1 ||
        row.docType ||
        catalog?.docType ||
        '—',
      source: row.source || row.source1 || catalog?.source || '—',
      status: row.status || row.status1 || row.documentStatus || 'Pending',
      triggeredBy: row.triggeredBy || row.triggeredBy1 || 'System',
      triggerDate: row.triggeredDate || row.triggerDate1 || row.triggerDate || '—',
      receiptDate: row.receiptDate || row.receiptDate1 || '—',
    }
  })
}

/** Strip metadata keys when falling back to raw question object entries. */
export function filterQuestionEntries(questions = {}) {
  return Object.entries(questions).filter(
    ([key, val]) => !META_KEYS.has(key) && val != null && val !== ''
  )
}

const fmtRs = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return '—'
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

const PAYABLE_KEYS = ['baseSec', 'base', 'fundSec', 'interimSec', 'gaSec', 'loanScheduleSec', 'premiumOtsSec', 'totalAmtPayable']

/** True when calc / txn payload has at least one payable amount. */
export function hasCalcAmountData(calc = {}) {
  if (!calc || typeof calc !== 'object') return false
  return PAYABLE_KEYS.some((k) => {
    const v = calc[k]
    return v != null && String(v).trim() !== '' && !Number.isNaN(Number(v))
  })
}

/** Transaction API calcAmt → readable summary cards (not raw JSON). */
export function formatCalcAmountSummary(calc = {}, claimIdFallback = '') {
  const rows = [
    { label: 'Claim ID', value: calc.claimId || claimIdFallback || '—' },
    { label: 'Base SA', value: fmtRs(calc.baseSec) },
    { label: 'Fund', value: fmtRs(calc.fundSec) },
    { label: 'Interim', value: fmtRs(calc.interimSec) },
    { label: 'GA', value: fmtRs(calc.gaSec) },
    { label: 'Loan / NOC', value: fmtRs(calc.loanScheduleSec) },
    { label: 'Premium OTS', value: fmtRs(calc.premiumOtsSec) },
    { label: 'Total payable (est.)', value: fmtRs(calc.totalAmtPayable || calc.baseSec) },
  ]
  return rows.filter((r) => r.value !== '—')
}
