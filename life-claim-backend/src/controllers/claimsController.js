const logger = require('../config/logConfig');
const claimsService = require('../services/claimsService')


exports.getClaimByUsername = async (req, res, next) => {
  const token = req.kauth?.grant?.access_token?.content;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No access token' });
  }

  const usernameFromToken = token.preferred_username;
  const roles = token.realm_access?.roles || [];
  const requestedUsername = String(req.body?.username || '').trim();

  // Treat "Admin" (or "admin") as admin role
  const isAdmin =
    roles.includes('Admin') ||
    roles.includes('admin') ||
    roles.includes('ROLE_ADMIN');

  // Non-admins can only fetch their own claims; admins may fetch any user.
  const username = isAdmin
    ? (requestedUsername || usernameFromToken)
    : usernameFromToken;

  try {
    let claims = await claimsService.getClaimByUsername(username);
    res.json(claims);
  } catch (error) {
    logger.error(`Cannot GET users || MSG : ${error}`);
    next(error);
  }

}

exports.assignClaims = async(req,res,next)=>{
  try {
    const claims = req.body.claims
    console.log('claimsController >> assignClaims request received');
  } catch (error) {
    logger.error(`Cannot GET users || MSG : ${error}`);
    next(error);
  }
}

exports.changeStatus = async (req, res, next) => {
  try {
    const {status, claimNumber} = req.body
    let  claims = await claimsService.changeStatus(claimNumber,status)
    res.json(claims)
  } catch (error) {
    logger.error(` ${error}`);
    next(error);
  }
}