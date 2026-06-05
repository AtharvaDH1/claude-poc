const express = require('express');
const { protect, hasAnyRole } = require('../../middleware/keycloak');
const capsAddDetailsController = require('../../controllers/add/capsAddDetailsController');
const capsAddCaseSearchController = require('../../controllers/add/caseSearchController');
const capsAssessmentPoolController = require('../../controllers/add/capsAssessmentPoolController');
const exclusionRulesController = require('../../controllers/add/exclusionRulesController');
const assessorPoolCasesController = require('../../controllers/add/assessorPoolCasesController');
const capsAddDecisionController = require('../../controllers/add/capsAddDecisionController');
const capsAddFindingsController = require('../../controllers/add/capsAddFindingsController');
const router = express.Router();

const assessorOrVerifier = ['Pre Assessor', 'Assessor', 'Verifier'];

router.post('/addValue', protect(hasAnyRole(assessorOrVerifier)), capsAddDetailsController.addExcelDataToTable);
// ...
router.get('/decisionMasterData', protect(hasAnyRole(assessorOrVerifier)), capsAddDecisionController.getDecisionMasterData);
router.post('/saveDecision', protect(hasAnyRole(assessorOrVerifier)), capsAddDecisionController.saveDecisionController);
router.post('/saveFindings', protect(hasAnyRole(assessorOrVerifier)), capsAddFindingsController.saveFindingsController);
router.post('/getData', protect(hasAnyRole(assessorOrVerifier)), capsAddDetailsController.getCapsAddDetailsByDecision);
router.post('/approver-approve', protect(hasAnyRole(assessorOrVerifier)), capsAddDetailsController.updateCapsAddDetailsCaseStatusController);
router.post('/search', protect(hasAnyRole(assessorOrVerifier)), capsAddCaseSearchController.getCaseSearchController);
router.post('/pool', protect(hasAnyRole(assessorOrVerifier)), capsAssessmentPoolController.getAssessmentPoolData);
router.post('/getCaseDetails', protect(hasAnyRole(assessorOrVerifier)), capsAssessmentPoolController.getCaseDetails);
router.post('/refreshLifeAsiaData', protect(hasAnyRole(assessorOrVerifier)), capsAssessmentPoolController.refreshCaseData);
router.post('/policynumberusername', protect(hasAnyRole(assessorOrVerifier)), capsAddDetailsController.getCapsAddDetailsPolicyNumberUsername);
router.post('/add', protect(hasAnyRole(assessorOrVerifier)), capsAddDetailsController.addCaseAssignmentBulk);
router.post('/applyExclusionRules', protect(hasAnyRole(assessorOrVerifier)), exclusionRulesController.applyExclusionRulesToCase);
router.post('/applyExclusionRulesBatch', protect(hasAnyRole(assessorOrVerifier)), exclusionRulesController.applyExclusionRulesToMultipleCases);
router.post('/refreshAssessorPoolCase', protect(hasAnyRole(assessorOrVerifier)), assessorPoolCasesController.refreshAssessorPoolCaseController);
router.post('/refreshAssessorPoolCasesBatch', protect(hasAnyRole(assessorOrVerifier)), assessorPoolCasesController.refreshAssessorPoolCasesBatchController);
router.post('/closeCasesAsExclusion', protect(hasAnyRole(assessorOrVerifier)), assessorPoolCasesController.closeCasesAsExclusionController);
router.post('/moveCasesToBeReferred', protect(hasAnyRole(assessorOrVerifier)), assessorPoolCasesController.moveCasesToBeReferredController);
//router.post('/approver-reject', authMiddleware.authenticate, capsAddDetailsController.getCapsAddDetailsByDecision);
//router.post('/addrole', authMiddleware.authenticate, roleController.createRole);

module.exports = router;