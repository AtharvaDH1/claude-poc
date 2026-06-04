const express = require('express');
const router = express.Router();
const registerClaimController = require('../controllers/registerClaimController');
const { updateClaim } = require('../controllers/updateClaimController');
const { protect } = require('../middleware/keycloak');
const { PrepareStatementInfo } = require('mysql2');

// Pre Assessors can register claims
router.post('/', protect('realm:Pre Assessor'), registerClaimController.registerClaim);
// Any authenticated user can update claims; UI and business logic still enforce role rules
router.post('/update', protect(), updateClaim);

module.exports = router;
