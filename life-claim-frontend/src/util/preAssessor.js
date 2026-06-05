export function isPreAssessorRole(userRole, roles = []) {
  const norm = (s) => String(s || '').toLowerCase().replace(/-/g, ' ')
  if (norm(userRole) === 'pre assessor') return true
  return (Array.isArray(roles) ? roles : []).some((r) => norm(r) === 'pre assessor')
}
