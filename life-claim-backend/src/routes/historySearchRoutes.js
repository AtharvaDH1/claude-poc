const express = require('express');
const { getHistorySearch } = require('../controllers/historySearchController');
const { protect } = require('../middleware/keycloak');

const router = express.Router();

// Security: Protect history search endpoint
router.post('/', protect(), getHistorySearch);

module.exports = router;