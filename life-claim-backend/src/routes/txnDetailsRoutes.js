const express = require('express');
const authService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');
const txnDetailsController = require('../controllers/txnDetailsController');

const router = express.Router();

router.post('/txnDetails', authMiddleware.authenticate, txnDetailsController.getTxnDetailsController);
router.post('/transactionApiDBDetails', authMiddleware.authenticate, txnDetailsController.getTransactionApiDetailsController);
router.post('/txnSave', authMiddleware.authenticate, txnDetailsController.saveTransactionApiDetailsController);

module.exports = router; 