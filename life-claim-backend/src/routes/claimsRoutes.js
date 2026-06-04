const express = require('express');
const claimsController = require('../controllers/claimsController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const {
  validateClaimByUsernameBody,
  validateAssignClaimsBody,
  validateChangeStatusBody,
} = require('../middleware/requestValidation');

const router = express.Router();

// Security: use POST body instead of URL path to avoid exposing username in request URL.
router.post('/claimByUsername', protect(), validateClaimByUsernameBody, claimsController.getClaimByUsername);

// Pre Assessors and Verifiers can assign claims
router.post(
  '/assignClaim',
  protect(hasAnyRole(['Pre Assessor', 'Assessor', 'Verifier'])),
  validateAssignClaimsBody,
  claimsController.assignClaims
);

// Any authenticated user with Pre Assessor role can change status
router.post(
  '/changeStatus',
  protect('realm:Pre Assessor'),
  validateChangeStatusBody,
  claimsController.changeStatus
);

module.exports = router;