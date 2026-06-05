const CapsAddDetailsDoa = require('../../dataAccess/add/capsAddDetailsDao');
const exposeErrorDetails = process.env.NODE_ENV !== 'production';
const internalError = (res, error) =>
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(exposeErrorDetails ? { detail: error?.message || String(error) } : {}),
  });

const addExcelDataToTable = async (req, res, next) => {
    console.log('capAddDetailsController.js >> addExcelDataToTable request received');
    const{ username, data} = req.body;
    console.log('capAddDetailsController.js >> addExcelDataToTable payload accepted');
    try {
        const addValue = await CapsAddDetailsDoa.insertCapsAddDetails({username, data});
        res.status(201).json({
            success: true,
            message: `Successfully inserted ${addValue.length} records`,
            data: addValue
        });
    } catch (e) {
        console.error('Error in addExcelDataToTable:', e);
        internalError(res, e);
    }
}

const getCapsAddDetails = async (req, res, next) => {
    //console.log('getCapsAddDetails', req.body);
    const attribute = req.body.attribute;
    const value = req.body.value;
    //console.log('capsAddDetailsController.js >> getCapsAddDetails: ', attribute, value);
    try {
        const addValue = await CapsAddDetailsDoa.getCapsAddDetails(attribute, value);
        res.status(200).json({
            success: true,
            data: addValue
        });
    } catch (e) {
        console.error('Error in getAddCapsDetails:', e);
        res.status(500).json({
            success: false,
            error: e.message
        });
    }
}

const getCapsAddDetailsByDecision = async (req, res, next) => {
    const caseType = req.body.caseType;
    const attribute = req.body.attribute;
    const value = req.body.value;
    const limit = req.body.limit;
    const offset = req.body.page;
    console.log('capsAddDetailsController.js >> getCapsAddDetailsByDecision request received');
    try{
        const aprroverQuery = await CapsAddDetailsDoa.getCapsAddDetailsByDecision(caseType, attribute, value,  limit, offset);
        res.status(200).json({
            success: true,
            data: aprroverQuery
        });     
    }catch(e){
        console.error('Error in getCapsAddDetailsByDecision:', e);
        internalError(res, e);
    }
}

const updateCapsAddDetailsCaseStatusController = async (req, res, next) => {
    const caseId = req.body.caseId;
    const caseStatus = req.body.caseStatus;
    const username = req.body.username;
    console.log('capsAddDetailsController.js >> updateCapsAddDetailsCaseStatusController request received');
    try{
        const updateCaseStatus = await CapsAddDetailsDoa.updateCapsAddDetailsCaseStatus(caseId, caseStatus, username);
        res.status(200).json({
            success: true,
            data: updateCaseStatus
        });
    }
    catch(e){
        console.error('Error in updateCapsAddDetailsCaseStatusController:', e);
        internalError(res, e);
    }
}

//get policy number and username to check if the policyNumber  is already present in the CapsAddDetails table and username is present in the Users table
const getCapsAddDetailsPolicyNumberUsername = async (req, res, next) => {
    console.log('capsAddDetailsController.js >> getCapsAddDetailsPolicyNumberUsername request received');
    try{
        console.log('Calling DAO function...');
        const response = await CapsAddDetailsDoa.getCapsAddDetailsPolicyNumberUsername();
        console.log('DAO response received:', response);
        
        res.status(200).json({
            success: true,
            message: 'Policy numbers and usernames retrieved successfully',
            data: response
        });
    }catch(e){
        console.error('Error in getCapsAddDetailsPolicyNumberUsername:', e);
        internalError(res, e);
    }
}

const addCaseAssignmentBulk = async (req, res, next) => {
    const { data, uploadedBy } = req.body;
    const username = uploadedBy || req.user?.username || '';
    console.log('capsAddDetailsController.js >> addCaseAssignmentBulk request received');

    try {
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ success: false, message: 'Assignment data array is required.' });
        }
        const result = await CapsAddDetailsDoa.bulkAssignCasesByPolicy(data, username);
        return res.status(200).json({
            success: true,
            message: `Assigned ${result.updated.length} policy row(s); ${result.failed.length} failed.`,
            data: result,
        });
    } catch (e) {
        console.error('Error in addCaseAssignmentBulk:', e);
        internalError(res, e);
    }
};

module.exports = {
    addExcelDataToTable,
    getCapsAddDetails,
    getCapsAddDetailsByDecision,
    updateCapsAddDetailsCaseStatusController,
    getCapsAddDetailsPolicyNumberUsername,
    addCaseAssignmentBulk,
};

