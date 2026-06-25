const express = require('express');
const router = express.Router();
const registerClaimController = require('../controllers/registerClaimController');
const { updateClaim } = require('../controllers/updateClaimController');
const { protect, hasAnyRole } = require('../middleware/keycloak');
const { authorizeClaimBodyAccess } = require('../middleware/claimAccessMiddleware');

const operationalRoles = ['Pre Assessor', 'Assessor', 'Verifier'];

// Pre Assessors can register claims
router.post('/', protect('realm:Pre Assessor'), registerClaimController.registerClaim);
router.post(
  '/update',
  protect(hasAnyRole(operationalRoles)),
  authorizeClaimBodyAccess,
  updateClaim,
);

module.exports = router;
