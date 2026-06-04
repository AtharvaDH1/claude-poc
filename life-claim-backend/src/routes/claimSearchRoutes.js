const express = require('express');
const { getClaimSearch, updateAssessor, updateVerifier } = require('../controllers/claimSearchController');
const { protect, hasAnyRole } = require('../middleware/keycloak');

const router = express.Router();

const assessorRoles = ['Pre Assessor', 'Assessor', 'Verifier'];

// Searching claims is allowed for all assessor-related roles
router.post('/', protect(hasAnyRole(assessorRoles)), getClaimSearch);

// Updating assessor/verifier info is restricted to Assessor and Verifier roles
router.post('/update-ass', protect(hasAnyRole(assessorRoles)), updateAssessor);
router.post('/update-ver', protect('realm:Verifier'), updateVerifier);

module.exports = router;