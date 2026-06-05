/** Shared CAPS row mappers (Section I). */

export const CASE_SEARCH_ATTRIBUTES = [
  { id: 'policy_number', label: 'Policy number' },
  { id: 'krn', label: 'KRN' },
  { id: 'case_status', label: 'Case status' },
  { id: 'iris_status', label: 'IRIS status' },
]

export function extractCaseRows(result) {
  if (result?.success && Array.isArray(result.data)) return result.data
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result)) return result
  return []
}

export function mapCaseRow(row) {
  const caseId = row.case_id ?? row.CASE_ID ?? row.id
  return {
    caseId: caseId != null ? String(caseId) : '—',
    policyNumber: row.policy_number || row.POLICY_NUMBER || '—',
    krn: row.krn || row.KRN || '—',
    source: row.source || row.SOURCE || '—',
    irisStatus: row.iris_status || row.IRIS_STATUS || '—',
    registeredDate: (row.referral_date || row.referralDate || row.created_on || '').toString().split('T')[0],
    assignedTo: row.assigned_to || row.ASSIGNED_TO || 'Unassigned',
    status: row.case_status || row.CASE_STATUS || row.status || 'Open',
    exclusionType: row.exclusion_type_rule || row.exclusion_type || '—',
  }
}

export function mapPoolRow(row) {
  const caseId = row.case_id ?? row.CASE_ID
  return {
    caseId: caseId != null ? String(caseId) : null,
    policyId: row.policy_number || row.policy_no || row.POLICY_NO || '—',
    krn: row.krn || row.ksn || row.KSN || '—',
    status: row.case_status || row.status || 'Pending',
    exclusion: row.is_excluded === 'Y' || row.exclusion_type ? 'Y' : 'N',
    daysOpen: row.scn_aging ?? row.sch_aging ?? 0,
    irisStatus: row.iris_status || row.irss_status || '—',
  }
}

export function openCasePath(caseId) {
  if (!caseId || caseId === '—') return null
  return `/case/${encodeURIComponent(caseId)}`
}
