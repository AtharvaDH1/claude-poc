/** Map raw claims_poc.claims row for Claim Search table (Section D2). */
export function mapClaimSearchRow(row) {
  if (!row || typeof row !== 'object') return null
  return {
    claimNumber: row.CLAIM_NUMBER || row.claimNumber || row.claim_no || '',
    claimType: row.CLAIM_TYPE || row.claimType || '—',
    policyNumber: row.POLICY_ID || row.POLICY_NUMBER || row.policyNumber || '—',
    policyStatus: row.POLICY_STATUS || row.policyStatus || '—',
    claimStatus: row.CLAIM_STATUS || row.status || row.CLAIM_STATUS || '—',
    createdOn: (row.CREATED_AT || row.CREATED_ON || row.createdOn || '').toString().split('T')[0] || '—',
    createdBy: row.CREATED_BY || row.createdBy || '—',
  }
}
