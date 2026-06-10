const POLICY_ONLY_STATUSES = new Set([
  'in force',
  'inforce',
  'lapsed',
  'paid-up',
  'paid up',
  'foreclosed',
])

const WORKFLOW_ROLES = new Set(['pre assessor', 'assessor', 'verifier'])

/** Workflow STATUS from claims row — never policy CLAIM_STATUS like "In Force". */
export function workflowStatusFromRow(row) {
  if (!row || typeof row !== 'object') return '—'
  const workflow = String(row.status || row.STATUS || '').trim()
  if (workflow) return workflow
  const legacy = String(row.CLAIM_STATUS || row.claimStatus || '').trim()
  if (legacy && !POLICY_ONLY_STATUSES.has(legacy.toLowerCase())) return legacy
  return '—'
}

/** ROLE column — Assessor / Verifier / Pre Assessor (not terminal payout labels). */
export function workflowRoleFromRow(row) {
  if (!row || typeof row !== 'object') return '—'
  const role = String(row.role || row.ROLE || '').trim()
  if (role && WORKFLOW_ROLES.has(role.toLowerCase())) return role
  const st = workflowStatusFromRow(row).toLowerCase()
  if (st.includes('assessor')) return 'Assessor'
  if (st.includes('verifier')) return 'Verifier'
  if (st.includes('pre assessor') || st.includes('registration')) return 'Pre Assessor'
  return '—'
}

/** Map raw claims_poc.claims row for Claim Search table (Section D2). */
export function mapClaimSearchRow(row) {
  if (!row || typeof row !== 'object') return null
  return {
    claimNumber: row.CLAIM_NUMBER || row.claimNumber || row.claim_no || '',
    claimType: row.CLAIM_TYPE || row.claimType || '—',
    policyNumber: row.POLICY_ID || row.POLICY_NUMBER || row.policyNumber || '—',
    policyStatus: row.POLICY_STATUS || row.policyStatus || '—',
    claimStatus: workflowStatusFromRow(row),
    claimRole: workflowRoleFromRow(row),
    createdOn: (row.CREATED_AT || row.CREATED_ON || row.createdOn || '').toString().split('T')[0] || '—',
    createdBy: row.CREATED_BY || row.createdBy || '—',
  }
}
