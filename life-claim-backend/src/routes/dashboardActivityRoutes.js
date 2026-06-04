const express = require('express');
const router = express.Router();
const dashboardActivityController = require('../controllers/dashboardActivityController');
const { protect } = require('../middleware/keycloak');

// Any authenticated user can view dashboard activities
router.get('/activities', protect(), dashboardActivityController.getDashboardActivities);

module.exports = router;
