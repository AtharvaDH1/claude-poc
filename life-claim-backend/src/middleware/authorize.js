// backend/middleware/authorize.js

/**
 * Middleware to authorize users based on their roles
 * @param {...string} allowedRoles - The roles that are allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user information found' });
    }

    const userRoles = req.user.roles || [];
    const norm = (r) => String(r || '').toLowerCase().trim();

    // Check if the user has at least one of the allowed roles (case-insensitive)
    const hasPermission = allowedRoles.some((role) =>
      userRoles.some((ur) => norm(ur) === norm(role))
    );

    if (!hasPermission) {
      console.warn(`Access denied for user ${req.user.username}. Required roles: [${allowedRoles}], User roles: [${userRoles}]`);
      return res.status(403).json({ message: 'Forbidden: You do not have permission to access this resource' });
    }

    next();
  };
};

module.exports = authorize;
