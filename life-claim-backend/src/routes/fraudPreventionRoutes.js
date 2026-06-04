const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fraudPreventionController = require('../controllers/fraudPreventionController');


router.post('/getSafeCityPincodeCheck', authMiddleware.authenticate, fraudPreventionController.getSafeCityPincodeCheck);
router.get('/claimant_Bankdetails_Check', authMiddleware.authenticate, fraudPreventionController.getClaimantBankdetailsCheck);
router.post('/agent_Trend_Check', authMiddleware.authenticate, fraudPreventionController.agentTrendCheckController);
router.post('/mobile_Number_Check', authMiddleware.authenticate, fraudPreventionController.mobileNumberCheckController);
router.post('/add_remarks_decisions', authMiddleware.authenticate, fraudPreventionController.addRemarksController);
router.post('/get_eagle_rule_details', authMiddleware.authenticate, fraudPreventionController.getEagleRuleDetailsController);
router.put('/update_eagle_rule_details', authMiddleware.authenticate, fraudPreventionController.updateEagleRuleDetailsController);

module.exports = router;
