// Role-based access control — mirrors original authorize middleware
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated.' })
  const userRoles = req.user.roles || []
  const allowed   = allowedRoles.flat().map(r => r.toLowerCase())
  const hasRole   = userRoles.some(r => allowed.includes(r.toLowerCase()))
  if (!hasRole) {
    return res.status(403).json({ message: `Access denied. Required role: ${allowedRoles.join(' or ')}` })
  }
  next()
}

module.exports = authorize
