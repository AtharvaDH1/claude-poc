const capsAssessmentPoolDOA = require('../../dataAccess/add/capsAssessmentPoolDoa');

const dataEnrichmentService = require('../../services/add/dataEnrichmentService');
const exposeErrorDetails = process.env.NODE_ENV !== 'production';
const internalError = (res, error) =>
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(exposeErrorDetails ? { detail: error?.message || String(error) } : {}),
  });

const getAssessmentPoolData = async (req, res) => {
    console.log('controller>>capsAssessmentPoolController>>getAssessmentPoolData request received');

    try{
        const { attribute, value, exclusionFilter, limit, offset } = req.body;
        
        // Use new function to fetch from CAPS_ADD_ASSESSOR_POOL_CASES
        const response = await capsAssessmentPoolDOA.getAssessorPoolCases(attribute, value, exclusionFilter, limit, offset);
        
        console.log('controller>>capsAssessmentPoolController>>getAssessmentPoolData>>response length: ', response?.data?.length, 'Total Count:', response?.totalCount);
        res.status(200).json({
            success: true,
            message: `Successfully fetched ${response?.data?.length || 0} records`,
            data: response.data,
            totalCount: response.totalCount
        });
    }catch(error){
        console.log(` controller>>capsAssessmentPoolController>>getAssessmentPoolData>>error: `, error);
        internalError(res, error);
    }
}

const getCaseDetails = async (req, res) => {
    try {
        const { caseId } = req.body;
        
        // Ensure req.user exists before destructuring, providing fallbacks for Keycloak tokens
        const user = req.user || {};
        const username = user.username || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.preferred_username) || '';
        const roles = user.roles || (req.kauth && req.kauth.grant && req.kauth.grant.access_token.content.realm_access.roles) || [];

        if (!caseId) {
            return res.status(400).json({ success: false, error: 'Case ID is required' });
        }

        // Fetch case details
        const data = await capsAssessmentPoolDOA.getCaseDetailsById(caseId);
        if (!data) {
            return res.status(404).json({ success: false, error: 'Case not found' });
        }

        // Security: IDOR Protection
        const isAdmin = Array.isArray(roles) ? roles.includes('admin') || roles.includes('Admin') : roles === 'admin';
        if (!isAdmin && username) {
            // Check if the case is assigned to the current user
            if (data.caseInfo.assignedTo && data.caseInfo.assignedTo !== username) {
                console.warn(`Forceful Browsing attempt: User ${username} tried to access unassigned case ${caseId}`);
                return res.status(403).json({ success: false, error: 'Access Denied: This case is not assigned to you.' });
            }
        }
        
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('controller>>capsAssessmentPoolController>>getCaseDetails>>error:', error);
        internalError(res, error);
    }
};

const refreshCaseData = async (req, res) => {
    try {
        const { caseId, username } = req.body;
        if (!caseId) {
            return res.status(400).json({ success: false, error: 'Case ID is required' });
        }

        await dataEnrichmentService.refreshSingleCase(caseId, username || 'System');

        res.status(200).json({
            success: true,
            message: 'Case data refreshed successfully from Life Asia'
        });
    } catch (error) {
        console.error('controller>>capsAssessmentPoolController>>refreshCaseData>>error:', error);
        internalError(res, error);
    }
};

module.exports = {
    getAssessmentPoolData,
    getCaseDetails,
    refreshCaseData
}
