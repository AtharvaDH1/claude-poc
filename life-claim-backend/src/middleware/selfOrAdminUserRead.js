/**
 * Only allow reading /api/user/user/:id if the caller is that user or has admin role.
 * Prevents horizontal privilege escalation / IDOR on user profile lookup.
 */
function selfOrAdminUserRead(req, res, next) {
  const requested = String(req.params.id || '').trim();
  const me = String((req.user && req.user.username) || '').trim();
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  const isAdmin = roles.includes('admin');

  if (!requested) {
    return res.status(400).json({ message: 'User identifier is required' });
  }

  if (isAdmin || (me && requested.toLowerCase() === me.toLowerCase())) {
    return next();
  }

  return res.status(403).json({
    message: 'Forbidden: you can only view your own profile unless you are an administrator.',
  });
}

module.exports = selfOrAdminUserRead;
