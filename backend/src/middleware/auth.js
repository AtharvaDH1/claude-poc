const jwt = require('jsonwebtoken')
const { User } = require('../models')
const logger = require('../config/logger')

const authenticate = async (req, res, next) => {
  try {
    let token = null

    // 1. Bearer token in Authorization header
    const authHeader = req.headers['authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    }
    // 2. Fallback: httpOnly cookie
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Support both our format and Keycloak format
    const username = decoded.preferred_username || decoded.username || decoded.sub
    const roles    = decoded.realm_access?.roles || decoded.roles || []

    req.user = { id: decoded.id, username, roles, email: decoded.email }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' })
    }
    logger.warn(`Auth failed: ${err.message}`)
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

module.exports = { authenticate }
