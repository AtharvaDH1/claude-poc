/** v1 claim workspace URL; v2 uses same path with ClaimView UI. */
export function claimWorkspacePath(claimId) {
  const id = encodeURIComponent(String(claimId || '').trim())
  return id ? `/registration-fetch/${id}` : '/claim-search'
}

/** Open workspace with optional router state (`from`: claimSearch | dashboard). */
export function openClaimWorkspace(navigate, claimId, options = {}) {
  const path = claimWorkspacePath(claimId)
  if (options.from) navigate(path, { state: { from: options.from } })
  else navigate(path)
}
