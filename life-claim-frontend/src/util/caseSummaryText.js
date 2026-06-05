/** Build the same narrative string shown in Case Summary panel. */
export function buildCaseSummaryNarrative(claim, demogs) {
  const intimation = demogs?.intimation || {}
  const la = demogs?.lifeAssured || {}
  const claimants = demogs?.claimant || []

  return [
    `Claim ${claim?.claimId} on policy ${claim?.policyId} (${claim?.claimType}).`,
    `Life assured: ${la.name || la.laName || claim?.laName || '—'}.`,
    `Intimation: ${intimation.intimationDate || claim?.intimationDate || '—'} via ${intimation.source || claim?.source || '—'}.`,
    `Event date: ${intimation.dateOfDeath || intimation.dateOfDeathEvent || claim?.dateOfDeathEvent || '—'}.`,
    `Cause: ${claim?.causeDescription || '—'} (${claim?.causeCode || ''}).`,
    `Status: ${claim?.status} · Workflow role: ${claim?.claimRole || '—'} · Assigned: ${claim?.assignedTo || 'unassigned'}.`,
    claimants.length
      ? `Claimant(s): ${claimants.map((c) => c.name || c.claimantName).filter(Boolean).join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}
