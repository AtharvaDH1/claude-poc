const express = require('express');
const {
  getDemogs,
  getRequirement,
  getAssessment,
  getDecision,
  getCalculateAmount,
} = require('../controllers/assessorController');
const { protect, hasAnyRole } = require('../middleware/keycloak');

const router = express.Router();

// Security: Apply authentication and authorization to all assessor fetch routes
// Allow Pre Assessor, Assessor, and Verifier roles to access these details
const assessorOrVerifier = ['Pre Assessor', 'Assessor', 'Verifier'];

router.get('/demogs/:claimNo', protect(hasAnyRole(assessorOrVerifier)), getDemogs);
router.get('/require/:claimNo', protect(hasAnyRole(assessorOrVerifier)), getRequirement);
router.get('/assess/:claimNo', protect(hasAnyRole(assessorOrVerifier)), getAssessment);
router.get('/decision/:claimNo', protect(hasAnyRole(assessorOrVerifier)), getDecision);
router.get('/calcAmt/:claimNo', protect(hasAnyRole(assessorOrVerifier)), getCalculateAmount);

module.exports = router;