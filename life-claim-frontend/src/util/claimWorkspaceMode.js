/** v1 browse vs work mode for /registration-fetch/:claimNo */

export function isBrowseMode(locationState) {
  return locationState?.from === 'claimSearch'
}

export function isDashboardEntry(locationState) {
  return locationState?.from === 'dashboard'
}

export function areFieldsDisabled(locationState) {
  return isBrowseMode(locationState)
}

export function enableAssessor(locationState, claim) {
  if (areFieldsDisabled(locationState)) return false
  const role = norm(claim?.claimRole)
  return role === 'assessor'
}

export function enableVerifier(locationState, claim) {
  if (areFieldsDisabled(locationState)) return false
  const role = norm(claim?.claimRole)
  return role === 'verifier'
}

export function canEditWorkspace(locationState, claim) {
  if (areFieldsDisabled(locationState)) return false
  return enableAssessor(locationState, claim) || enableVerifier(locationState, claim)
}

const norm = (s) => String(s || '').toLowerCase().trim()

export function getSubmitGuard(claim, username, locationState) {
  if (areFieldsDisabled(locationState)) {
    return { ok: false, hint: 'Browse mode — open this claim from My Task or Dashboard to work it.' }
  }

  const logged = (username || sessionStorage.getItem('loggedUser') || '').trim()
  const claimRole = norm(claim?.claimRole)
  const status = norm(claim?.status)
  const assigned = (claim?.assignedTo || '').trim()

  if (assigned && logged && assigned.toLowerCase() !== logged.toLowerCase()) {
    return { ok: false, hint: `Assigned to ${assigned}. You are logged in as ${logged}.` }
  }

  if (claimRole === 'assessor') {
    if (status !== 'pending assessor action') {
      return { ok: false, hint: 'Assessor submit requires status “Pending Assessor Action”.' }
    }
    return { ok: true, mode: 'assessor' }
  }

  if (claimRole === 'verifier') {
    if (status !== 'pending verifier action') {
      return { ok: false, hint: 'Verifier submit requires status “Pending Verifier Action”.' }
    }
    return { ok: true, mode: 'verifier' }
  }

  return { ok: false, hint: 'Submit is only available when the claim is with Assessor or Verifier.' }
}

export function mapAccessorDecisionToApi(decision) {
  const d = norm(decision)
  if (d === 'approve' || d === 'accept') return 'accept'
  if (d === 'reject' || d === 'repudiate') return 'reject'
  return d || 'accept'
}
