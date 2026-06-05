const db = require('../config/dbConfig');

const ADMIN_ROLES = new Set(['admin', 'Admin', 'ROLE_ADMIN']);
/** Same roles that can open registration-fetch / assessor-fetch (not assignment-gated). */
const OPERATIONAL_CLAIM_ROLES = new Set(['Pre Assessor', 'Assessor', 'Verifier']);

const userRoles = (req) => (Array.isArray(req.user?.roles) ? req.user.roles : []);
const isAdmin = (roles) => roles.some((r) => ADMIN_ROLES.has(r));
const hasOperationalClaimRole = (roles) => roles.some((r) => OPERATIONAL_CLAIM_ROLES.has(r));

const getClaimNumberFromRequest = (req) =>
  String(req.body?.claimNo || req.body?.claimNumber || req.body?.claimId || '').trim();

const hasClaimAccess = async (username, roles, claimNumber) => {
  if (!claimNumber || !username) return false;
  if (isAdmin(roles)) return true;

  const query = `
    SELECT CLAIM_NUMBER
    FROM claims_poc.claims
    WHERE CLAIM_NUMBER = ?
      AND (
        ASSIGNED_TO = ?
        OR MODIFIED_BY = ?
        OR ASSESSMENT_USERNAME = ?
        OR APPROVER_USERNAME = ?
        OR CREATED_BY = ?
      )
    LIMIT 1
  `;

  const [rows] = await db.execute(query, [
    claimNumber,
    username,
    username,
    username,
    username,
    username,
  ]);
  return rows.length > 0;
};

const authorizeClaimBodyAccess = async (req, res, next) => {
  try {
    const claimNumber = getClaimNumberFromRequest(req);
    const username = String(req.user?.username || '').trim();
    const roles = userRoles(req);

    if (!claimNumber) {
      return res.status(400).json({ message: 'Claim number is required.' });
    }

    // Match assessor-fetch: operational roles may open documents for any claim they can view in the UI
    if (isAdmin(roles) || hasOperationalClaimRole(roles)) {
      req.claimNumber = claimNumber;
      return next();
    }

    const allowed = await hasClaimAccess(username, roles, claimNumber);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'Forbidden: you are not authorized to access this claim.' });
    }

    req.claimNumber = claimNumber;
    next();
  } catch (error) {
    console.error('claimAccessMiddleware >> authorizeClaimBodyAccess error:', error.message || error);
    return res.status(500).json({ message: 'Failed to validate claim access.' });
  }
};

const authorizePreviewNodeAccess = async (req, res, next) => {
  try {
    const nodeId = String(req.params?.nodeId || '').trim();
    const username = String(req.user?.username || '').trim();
    const roles = userRoles(req);

    if (!nodeId) {
      return res.status(400).json({ message: 'Document node ID is required.' });
    }

    const [rows] = await db.execute(
      'SELECT claimId FROM claims_poc.UploadedDocuments WHERE AlfrescoFileId = ? LIMIT 1',
      [nodeId]
    );

    if (!rows.length || !rows[0].claimId) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const claimNumber = String(rows[0].claimId).trim();

    if (isAdmin(roles) || hasOperationalClaimRole(roles)) {
      req.claimNumber = claimNumber;
      return next();
    }

    const allowed = await hasClaimAccess(username, roles, claimNumber);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'Forbidden: you are not authorized to preview this document.' });
    }

    req.claimNumber = claimNumber;
    next();
  } catch (error) {
    console.error(
      'claimAccessMiddleware >> authorizePreviewNodeAccess error:',
      error.message || error
    );
    return res.status(500).json({ message: 'Failed to validate document access.' });
  }
};

module.exports = {
  authorizeClaimBodyAccess,
  authorizePreviewNodeAccess,
};
