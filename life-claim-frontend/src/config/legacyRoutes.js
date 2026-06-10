/**
 * Section L — routes and pages that exist in repo but are NOT in v2 App.jsx.
 * Do not add to sidebar until product re-enables them.
 */

/** Active v2 routes (canonical). */
export const V2_ACTIVE_ROUTES = [
  { path: '/login', label: 'Login' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/policy-search', label: 'Policy Search', roles: 'Pre Assessor' },
  { path: '/registration', label: 'New claim wizard', roles: 'Pre Assessor' },
  { path: '/claim-search', label: 'Claim Search' },
  { path: '/registration-fetch/:claimId', label: 'Claim workspace' },
  { path: '/pool-selection', label: 'Pool Selection', roles: 'Assessor/Verifier' },
  { path: '/my-task', label: 'My Tasks', roles: 'Assessor/Verifier' },
  { path: '/add-screen', label: 'Advance Investigation', roles: 'Assessor/Verifier' },
  { path: '/case/:id', label: 'CAPS case detail', roles: 'Assessor/Verifier' },
  { path: '/admin', label: 'Admin overview', roles: 'admin' },
  { path: '/admin/claim-search', label: 'Admin claim assign', roles: 'admin' },
  { path: '/audit-log', label: 'Login sessions', roles: 'admin' },
  { path: '/user-management', label: 'User CRUD', roles: 'admin' },
  { path: '/profile', label: 'Profile' },
]

/** v1 URL aliases still supported. */
export const V2_ROUTE_ALIASES = [
  { from: '/assessor-pool', to: '/pool-selection' },
  { from: '/claim-view/:id', to: '/registration-fetch/:id' },
  { from: '/user-manager', to: '/user-management' },
  { from: '/admin/audit', to: '/audit-log' },
  { from: '/admin/users', to: '/user-management' },
  { from: '/admin-reports', to: '/admin' },
  { from: '/admin/reports', to: '/admin' },
]

/** Pages in repo, not registered in App.jsx. */
export const DORMANT_FRONTEND_PAGES = [
  {
    id: 'inward',
    v1Path: '/inward',
    file: 'pages/InwardMail.jsx',
    backend: 'GET /api/mail, /api/attachment (legacy JWT authMiddleware)',
    note: 'IMAP ingestion commented in app.js — emailService.handleNewMail()',
  },
  {
    id: 'hospital-contacts',
    v1Path: '/hospitalSearch (and related)',
    file: 'pages/HospitalContacts.jsx',
    backend: 'GET/POST/PUT/DELETE /api/app/* (legacy JWT)',
    note: 'Hospital master search/CI modules removed; Eagle hospital table on claim workspace is active',
  },
  {
    id: 'document-upload-standalone',
    v1Path: '—',
    file: 'components/DocumentUpload.jsx',
    backend: '—',
    note: 'Superseded by components/claim/workspace/DocumentSideSlider.jsx',
  },
  {
    id: 'admin-reports-charts',
    v1Path: '/admin/reports',
    file: 'pages/AdminReports.jsx',
    backend: 'GET /api/admin/reports/summary',
    note: 'Route redirects to /admin; charts UI dormant',
  },
]

/** v1 multi-route registration — consolidated in v2. */
export const V1_SUPERSEDED_PATTERNS = [
  '/claimant-details, /eagle-screen, /requirement, /assessment-fetch, …',
  '→ v2: single /registration wizard (tabs) and /registration-fetch/:claimNo (ClaimView tabs)',
  '/registration-duplicate shell and *-fetch child routes removed',
]

/** v1 App.js comment block (not present in v2 App.jsx). */
export const V1_COMMENT_ONLY_ROUTES = [
  '/home', '/event', '/loanCalculator', '/hospitalSearch', '/case-init', '/case-init-read',
  '/provider-master', '/health-checkup', '/health-checkupCN', '/summary→Success',
  '/MainDetails', '/HospitalCI', '/Infrastructure', '/GeneralInfo', '/ClientCI',
  '/Surgery', '/PackageTarrif', '/RoomTarrif', '/Financial', '/inward',
]
