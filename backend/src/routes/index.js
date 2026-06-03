const router = require('express').Router()
const { authenticate }  = require('../middleware/auth')
const authorize         = require('../middleware/authorize')
const { authLimiter, loginLimiter } = require('../middleware/rateLimiter')
const multer            = require('multer')

const authCtrl     = require('../controllers/authController')
const userCtrl     = require('../controllers/userController')
const claimsCtrl   = require('../controllers/claimsController')
const dashCtrl     = require('../controllers/dashboardController')
const policyCtrl   = require('../controllers/policyController')
const masterCtrl   = require('../controllers/masterController')
const docCtrl      = require('../controllers/documentController')
const addCtrl      = require('../controllers/addScreenController')
const fraudCtrl    = require('../controllers/fraudController')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// ── AUTH ──────────────────────────────────────────────
router.post('/auth/keycloak/token',    authLimiter,  authCtrl.keycloakToken)
router.post('/auth/authenticate',      authLimiter,  authCtrl.authenticate)
router.post('/auth/logout-audit',      authenticate, authCtrl.logoutAudit)
router.get( '/auth/last-login',        authenticate, authCtrl.lastLogin)
router.post('/auth/clear-token-cookie',              authCtrl.clearTokenCookie)

// ── USER / LOGIN (legacy) ─────────────────────────────
router.post('/user/login',         loginLimiter,  authCtrl.login)
router.post('/user/logout',        authenticate,  authCtrl.logout)
router.post('/user/logout-on-close', authenticate, authCtrl.logout)
router.get( '/user',               authenticate, authorize('admin','Admin'), userCtrl.getUsers)
router.get( '/user/:id',           authenticate, userCtrl.getUserById)
router.post('/user',               authenticate, authorize('admin','Admin'), userCtrl.createUser)
router.put( '/user/:id',           authenticate, authorize('admin','Admin'), userCtrl.updateUser)
router.delete('/user/:id',         authenticate, authorize('admin','Admin'), userCtrl.deleteUser)

// ── ROLES ─────────────────────────────────────────────
router.get('/role/roles', authenticate, masterCtrl.getRoles)

// ── CLAIMS ────────────────────────────────────────────
router.post('/claims/claimByUsername', authenticate, claimsCtrl.getClaimByUsername)
router.post('/claims/assignClaim',     authenticate, claimsCtrl.assignClaim)
router.post('/claims/changeStatus',    authenticate, claimsCtrl.changeStatus)
router.get( '/claim-search',           authenticate, claimsCtrl.searchClaims)
router.get( '/claims/:claimNumber',    authenticate, claimsCtrl.getClaimByNumber)

// ── REGISTER CLAIM ────────────────────────────────────
router.post('/register-claim',   authenticate, authorize('Pre Assessor','Admin'), claimsCtrl.registerClaim)
router.post('/register-claim/update', authenticate, claimsCtrl.changeStatus)

// ── DASHBOARD ─────────────────────────────────────────
router.get('/dashboard/activities', authenticate, dashCtrl.getDashboardActivities)
router.get('/dashboard/activity',   authenticate, dashCtrl.getDashboardActivities)

// ── ADMIN ─────────────────────────────────────────────
router.get('/admin/summary',       authenticate, authorize('admin','Admin'), dashCtrl.getSummary)
router.get('/admin/claims/recent', authenticate, authorize('admin','Admin'), dashCtrl.getRecentClaims)
router.get('/admin/audit',         authenticate, authorize('admin','Admin'), dashCtrl.getAuditLogs)
router.get('/admin/audit-logs',    authenticate, authorize('admin','Admin'), dashCtrl.getAuditLogs)

// ── POLICY ────────────────────────────────────────────
router.get('/policy/:policyID',             authenticate, policyCtrl.getPolicyDetails)
router.get('/agentRepudiation/:agentCode',  authenticate, policyCtrl.getAgentRepudiation)

// ── MASTER DATA ───────────────────────────────────────
router.get( '/states',               authenticate, masterCtrl.getStates)
router.get( '/countries',            authenticate, masterCtrl.getCountries)
router.post('/cause-event',          authenticate, masterCtrl.getCauseEvents)
router.get( '/cause-event',          authenticate, masterCtrl.getCauseEvents)
router.get( '/places-of-death',      authenticate, masterCtrl.getPlacesOfDeath)
router.get( '/assessment-questions', authenticate, masterCtrl.getAssessmentQuestions)
router.get( '/portfolios',           authenticate, masterCtrl.getPortfolios)
router.post('/history-search',       authenticate, masterCtrl.historySearch)
router.get( '/case-reasons',         authenticate, (req, res) => res.json([]))
router.get( '/pool-selection',       authenticate, (req, res) => res.json([]))

// ── DECISIONS / SCORING ───────────────────────────────
router.post('/systemDec/system',     authenticate, masterCtrl.getSystemDecision)
router.post('/trap-score',           authenticate, masterCtrl.getTrapScore)
router.post('/trapScoreRoutes',      authenticate, masterCtrl.getTrapScore)
router.post('/calculate-amount',     authenticate, (req, res) => res.json({ amount: req.body?.sumAssured || 0 }))
router.post('/capsAddDetails',       authenticate, (req, res) => res.json({ message: 'saved' }))

// ── DOCUMENTS ─────────────────────────────────────────
router.get( '/documents/:claimId',  authenticate, docCtrl.getDocuments)
router.get( '/uploaded/:claimId',   authenticate, docCtrl.getUploadedDocuments)
router.post('/upload',              authenticate, upload.single('file'), docCtrl.uploadDocument)
router.delete('/uploaded/:docId',   authenticate, docCtrl.deleteDocument)

// ── POOL SELECTION ────────────────────────────────────
router.post('/assessor-fetch',   authenticate, addCtrl.assessorFetch)
router.post('/pool-selection',   authenticate, addCtrl.getPool)
router.get( '/pool-selection',   authenticate, addCtrl.getPool)

// ── CASE SEARCH / ADD SCREEN ──────────────────────────
router.post('/case-search',      authenticate, addCtrl.caseSearch)
router.get( '/case-search',      authenticate, addCtrl.caseSearch)
router.post('/caseassignment',   authenticate, addCtrl.caseAssignment)
router.post('/capsAddDetails',   authenticate, addCtrl.saveAddDetails)
router.post('/Assessment',       authenticate, (req, res) => res.json({ message: 'saved' }))

// ── FRAUD PREVENTION ──────────────────────────────────
router.get( '/fraudprevention/safe-city/:pincode', authenticate, fraudCtrl.safeCity)
router.get( '/fraudprevention/safe-pincode',       authenticate, fraudCtrl.safePincode)
router.get( '/fraudprevention/rules',              authenticate, fraudCtrl.getRules)
router.post('/fraudprevention/rules',              authenticate, fraudCtrl.saveRules)

// ── HEALTH CHECK ──────────────────────────────────────
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'life-claim-poc-backend', port: process.env.PORT, db: process.env.DB_DATABASE, timestamp: new Date().toISOString() }))

module.exports = router
