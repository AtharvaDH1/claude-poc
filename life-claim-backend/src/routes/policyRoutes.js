const express = require('express');
const policyController = require('../controllers/policyController');
const authMiddleware = require('../middleware/authMiddleware');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect policy detail fetching
router.get('/:policyID', protect(), policyController.getPolicyDetails);

module.exports = router;