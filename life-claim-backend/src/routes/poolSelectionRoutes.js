const express = require('express');
const { getSelectedPool, updateAssignedUser } = require('../controllers/poolSelectionController');
const { protect, hasAnyRole } = require('../middleware/keycloak');

const router = express.Router();

const poolRoles = ['Assessor', 'Verifier'];

router.post('/', protect(hasAnyRole(poolRoles)), getSelectedPool);
router.patch('/:claimNumber', protect(hasAnyRole(poolRoles)), updateAssignedUser);

module.exports = router;