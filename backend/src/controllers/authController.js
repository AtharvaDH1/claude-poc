const bcrypt  = require('bcrypt')
const jwt     = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { User, AuditLog } = require('../models')
const logger  = require('../config/logger')
const { Op }  = require('sequelize')

const MAX_ATTEMPTS = parseInt(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS) || 5
const LOCKOUT_MS   = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MS)  || 900000

// Build JWT matching Keycloak token structure so frontend works with both
const buildToken = (user, roles, sessionId) => jwt.sign(
  {
    sub:                user.username,
    preferred_username: user.username,
    email:              user.email,
    given_name:         user.first_Name,
    family_name:        user.last_Name,
    id:                 user.id,
    roles,
    realm_access:       { roles },
    session_state:      sessionId,
  },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
)

// POST /api/auth/keycloak/token  (mirrors Keycloak token endpoint)
exports.keycloakToken = async (req, res, next) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ message: 'Username and password required.' })

    const user = await User.findOne({ where: { username } })
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' })

    // Lockout check
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const rem = Math.ceil((new Date(user.lockout_until) - Date.now()) / 60000)
      return res.status(401).json({ message: `Account locked. Try again in ${rem} minute(s).`, locked: true })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const attempts = (user.failed_attempts || 0) + 1
      const updates  = { failed_attempts: attempts }
      if (attempts >= MAX_ATTEMPTS) updates.lockout_until = new Date(Date.now() + LOCKOUT_MS)
      await User.update(updates, { where: { id: user.id } })
      const rem = MAX_ATTEMPTS - attempts
      return res.status(401).json({ message: `Invalid credentials. ${rem > 0 ? rem + ' attempt(s) remaining.' : 'Account locked.'}` })
    }

    // Reset attempts on success
    const sessionId = uuidv4()
    await User.update({ failed_attempts: 0, lockout_until: null, current_session_id: sessionId, last_login: new Date() }, { where: { id: user.id } })

    // Fetch roles
    const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : ['Pre Assessor'])

    const token = buildToken(user, roles, sessionId)

    // Audit log
    await AuditLog.create({
      USERNAME:  user.username,
      LOGIN_AT:  new Date(),
      roles,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action:    'Login',
      session_id: sessionId,
    }).catch(() => {})

    logger.info(`Login: ${user.username} (${roles.join(',')})`)

    return res.json({
      access_token: token,
      token_type:   'Bearer',
      expires_in:   28800,
      user: {
        id:        user.id,
        username:  user.username,
        name:      `${user.first_Name} ${user.last_Name}`.trim(),
        email:     user.email,
        role:      roles[0],
        roles,
        avatar:    (user.first_Name?.[0] || '') + (user.last_Name?.[0] || ''),
        loginTime: new Date().toISOString(),
      },
    })
  } catch (err) { next(err) }
}

// POST /api/user/login  (legacy fallback)
exports.login = exports.keycloakToken

// POST /api/auth/logout-audit
exports.logoutAudit = async (req, res, next) => {
  try {
    const username = req.user?.username || req.body?.username
    if (username) {
      await AuditLog.update({ LOGOUT_AT: new Date(), action: 'Logout' }, { where: { USERNAME: username, LOGOUT_AT: null }, limit: 1 }).catch(() => {})
      await User.update({ current_session_id: null }, { where: { username } }).catch(() => {})
    }
    res.clearCookie('token')
    return res.json({ message: 'Logged out.' })
  } catch (err) { next(err) }
}

// POST /api/user/logout
exports.logout = exports.logoutAudit

// GET /api/auth/last-login
exports.lastLogin = async (req, res, next) => {
  try {
    const username = req.user?.username
    const log = await AuditLog.findOne({ where: { USERNAME: username }, order: [['LOGIN_AT', 'DESC']], attributes: ['LOGIN_AT'] })
    return res.json({ lastLogin: log?.LOGIN_AT || null })
  } catch (err) { next(err) }
}

// POST /api/auth/authenticate  (token validation)
exports.authenticate = async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ message: 'Token required.' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return res.json({ valid: true, user: decoded })
  } catch { return res.status(401).json({ valid: false, message: 'Invalid token.' }) }
}

// POST /api/auth/clear-token-cookie
exports.clearTokenCookie = (req, res) => {
  res.clearCookie('token')
  return res.json({ message: 'Cookie cleared.' })
}
