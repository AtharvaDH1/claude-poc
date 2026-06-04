const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleController = require('../controllers/roleController');


const router = express.Router();

router.get('/getroles', authMiddleware.authenticate, roleController.getAllRoles);
router.post('/addrole', authMiddleware.authenticate, roleController.createRole);

module.exports = router;