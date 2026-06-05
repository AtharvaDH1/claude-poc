/** Operational roles — admin-only users skip these (v1 manual §A1). */
const OPERATIONAL_ROLES = [
  'Pre Assessor',
  'Pre-Assessor',
  'Assessor',
  'Verifier',
  'clerk',
  'business',
]

const norm = (r) => String(r || '').toLowerCase().trim()

export function isAdminOnlyUser(roles = []) {
  const list = Array.isArray(roles) ? roles : []
  const hasAdmin = list.some((r) => norm(r) === 'admin')
  const hasOperational = list.some((r) =>
    OPERATIONAL_ROLES.some((op) => norm(op) === norm(r))
  )
  return hasAdmin && !hasOperational
}

export function hasAdminRole(roles = []) {
  return (Array.isArray(roles) ? roles : []).some((r) => norm(r) === 'admin')
}

export function hasOperationalRole(roles = []) {
  return (Array.isArray(roles) ? roles : []).some((r) =>
    OPERATIONAL_ROLES.some((op) => norm(op) === norm(r))
  )
}

/** v1 `/admin` → v2 admin landing (single AppLayout, no legacy AdminLayout). */
export function postLoginPath(roles = []) {
  if (isAdminOnlyUser(roles)) return '/admin'
  return '/dashboard'
}

/** Paths admin-only users may use (v2 unified shell). */
export const ADMIN_SHELL_PATHS = [
  '/admin',
  '/admin/claim-search',
  '/admin-reports',
  '/user-management',
  '/user-manager',
  '/audit-log',
  '/profile',
]

export function isAdminShellPath(pathname = '') {
  const p = pathname || ''
  return ADMIN_SHELL_PATHS.some(
    (base) => p === base || p.startsWith(`${base}/`)
  )
}

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

export function getLocalLockout(username) {
  const key = String(username || '').trim().toLowerCase()
  if (!key) return { locked: false, remainingMs: 0 }
  const until = Number(localStorage.getItem(`lockout_${key}`) || 0)
  if (!until || Date.now() >= until) {
    if (until) localStorage.removeItem(`lockout_${key}`)
    return { locked: false, remainingMs: 0 }
  }
  return { locked: true, remainingMs: until - Date.now() }
}

export function recordLocalLoginFailure(username) {
  const key = String(username || '').trim().toLowerCase()
  if (!key) return { locked: false, remaining: MAX_ATTEMPTS }
  const countKey = `login_attempts_${key}`
  const n = Number(localStorage.getItem(countKey) || 0) + 1
  localStorage.setItem(countKey, String(n))
  if (n >= MAX_ATTEMPTS) {
    localStorage.setItem(`lockout_${key}`, String(Date.now() + LOCKOUT_MS))
    localStorage.setItem(countKey, '0')
    return { locked: true, remaining: 0, attempts: n }
  }
  return { locked: false, remaining: MAX_ATTEMPTS - n, attempts: n }
}

export function clearLocalLoginFailures(username) {
  const key = String(username || '').trim().toLowerCase()
  if (!key) return
  localStorage.removeItem(`login_attempts_${key}`)
  localStorage.removeItem(`lockout_${key}`)
}

export function logoutReasonMessage(reason) {
  switch (reason) {
    case 'idle':
      return 'Your session expired due to inactivity. Please sign in again.'
    case 'session':
      return 'You were signed out because your account was used in another tab or window.'
    case 'concurrent':
      return 'You were signed out because a new session started elsewhere.'
    case 'token_expired':
      return 'Your session expired. Please sign in again.'
    default:
      return ''
  }
}
