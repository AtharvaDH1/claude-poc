//const CapsAddDetails = require('../add/CapsAddDetails');
const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddDecision = require('../../models/add/CapsAddDecision');
const CapsAddRawData = require('../../models/add/CapsAddRawData');
const Users = require('../../models/User');
const { checkForExclusionRule } = require('../../services/add/exclusionRulesService');
const { upsertAssessorPoolCase } = require('./capsAssessorPoolCasesDao');
const dataEnrichmentService = require('../../services/add/dataEnrichmentService');

// to insert data into the table
const insertCapsAddDetails = async ({username, data}) => {
    try {
        console.log('DataAccess > capsAddDetailsDao.js : insertCapsAddDetails (Saving to RAW)', username, data);
       
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array of objects');
        }
 
        if (data.length === 0) {
            throw new Error('Data array cannot be empty');
        }

        const insertPromises = data.map(async (item, index) => {
            if (!item.POLICY_NUMBER) {
                throw new Error(`POLICY_NUMBER is required for item at index ${index}`);
            }
 
            const formattedReferralDate = formatDateString(item.REFERRAL_DATE);
 
            // Save to Staging/Raw table instead of final tables directly
            const rawRecord = await CapsAddRawData.create({
                policy_number: item.POLICY_NUMBER,
                source: item.SOURCE || 'Excel',
                referral_date: formattedReferralDate,
                initiation_remarks: item.REMARK || null,
                processed_flag: 0, // Pending
                created_by: username || null,
                created_on: new Date()
            });

            return rawRecord;
        });
 
        const addedRawData = await Promise.all(insertPromises);

        // 🚀 TRIGGER BACKGROUND ENRICHMENT AUTOMATICALLY
        // We don't 'await' this so the user gets a fast response while the API calls happen in background
        dataEnrichmentService.processRawDataBatch().catch(err => {
            console.error('DataAccess >> Enrichment trigger error:', err);
        });

        return addedRawData;
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > insertCapsAddDetails, Error inserting into Raw Table:', err);
        throw err;
    }
}
 
function formatDateString(dateStr) {
    if (!dateStr) {
        throw new Error('Date string is required');
    }
 
    // ✅ Excel numeric date (e.g. 45703)
    if (typeof dateStr === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + dateStr * 86400000);
        return date.toISOString().split('T')[0];
    }
 
    // ✅ If already Date object
    if (dateStr instanceof Date) {
        return dateStr.toISOString().split('T')[0];
    }
 
    // Convert to string
    dateStr = String(dateStr);
 
    // YYYY-MM-DD
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
        return dateStr;
    }
 
    // DD-MM-YYYY
    if (dateStr.includes('-')) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
 
    // DD/MM/YYYY
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
 
    throw new Error(`Invalid date format: ${dateStr}`);
}
 
// to get data from the table [NOT INUSED CURRENTLY]
const getCapsAddDetails = async (attribute, value) => {
    try {
        console.log('capsAddDetailsDoa.js >> getCapsAddDetails: ', attribute, value);
        const capsAddDetails = await CapsAddDetails.findAll({
            where: {
                [attribute]: value,
                }
        });
        console.log('capsAddDetailsDoa.js >> getCapsAddDetails: ', capsAddDetails);
        return capsAddDetails;
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > getCapsAddDetails, Error getting data from CapsAddDetails:', err);
        throw err;
    }
}
 
// to get based on the desicion selection of the user
// Complex query to get case details with findings and decisions
const getCapsAddDetailsByDecision = async (caseType, attribute, value, limit, offset) => {
    try {
        console.log('capsAddDetailsDoa.js >> getCapsAddDetailsWithFindings: ', caseType, attribute, value, limit, offset);

        // Whitelist attributes to prevent SQL Injection on column names
        const allowedAttributes = {
            'case_id': 'd.case_id',
            'policy_number': 'd.policy_number',
            'krn': 'd.krn',
            'policy_no': 'd.policy_number'
        };

        const dbColumn = allowedAttributes[attribute.toLowerCase()];
        if (!dbColumn) {
            console.error(`Invalid attribute provided for filtering: ${attribute}`);
            throw new Error(`Invalid search attribute: ${attribute}`);
        }

        const query = `
            SELECT  
                d.case_id AS CASE_ID,
                d.case_id AS APP_No,
                d.policy_number AS Policy_Number,
                d.krn AS KRN,
                d.case_status AS CaseStatus,
                f.findings AS Finding,
                f.remarks AS Remarks,
                f.rule AS Rule,
                f.decision AS Decision,
                c.scn_aging AS SCNAging,
                d.iris_status AS IRISStatus
            FROM
                caps_add_details d
            LEFT JOIN
                caps_add_decision c ON d.case_id = c.case_id
            INNER JOIN
                caps_add_findings f ON d.case_id = f.case_id
            WHERE
                f.decision = :caseType AND ${dbColumn} = :value
            ORDER BY
                d.case_id
            LIMIT :limit OFFSET :offset
        `;

        const result = await CapsAddDetails.sequelize.query(query, {
            replacements: {
                caseType,
                value,
                limit: parseInt(limit) || 10,
                offset: parseInt(offset) || 0
            },
            type: CapsAddDetails.sequelize.QueryTypes.SELECT
        });

        console.log('capsAddDetailsDoa.js >> getCapsAddDetailsWithFindings: ', result);
        return result;
    } catch (err) {
        console.error('DataAccess > capsAddDetailsDao.js > getCapsAddDetailsWithFindings, Error getting data:', err);
        throw err;
    }
}
 
 
const updateCapsAddDetailsCaseStatus = async (caseId, caseStatus, username) => {
    console.log('capsAddDetailsDoa.js >> updateCapsAddDetailsCaseStatus: ', caseId, caseStatus);
 
    try{
        // 1. Update status in caps_add_details
        const capsAddDetails = await CapsAddDetails.update(
            {case_status: caseStatus, modified_by: username, modified_on: new Date()},
            {where: {case_id: caseId}});

        // 2. Map and update final_decision in caps_add_decision
        let finalDecision = '';
        if (caseStatus.includes('Approved')) finalDecision = 'Approved';
        else if (caseStatus.includes('Rejected')) finalDecision = 'Rejected';

        if (finalDecision) {
            await CapsAddDecision.update(
                { 
                    final_decision: finalDecision, 
                    modified_by: username, 
                    modified_on: new Date() 
                },
                { where: { case_id: caseId } }
            );
        }
        
        return capsAddDetails;
    }catch(err){
        console.error('DataAccess > capsAddDetailsDao.js > updateCapsAddDetailsCaseStatus, Error updating data:', err);
        throw err;      
    }
}
 
const getCapsAddDetailsPolicyNumberUsername = async () => {
 
    try{
        const responsePolicyNumber = await CapsAddDetails.findAll({
            attributes: ['policy_number']
        });
       
        const responseUsername = await Users.findAll({
            attributes: ['username'],
        });
 
        return {responsePolicyNumber, responseUsername};
       // return responsePolicyNumber;
    }catch(err){
        console.error('DataAccess > capsAddDetailsDao.js > getCapsAddDetailsLpolicyNumber, Error getting data:', err);
        throw err;
    }
   
}
 
const UpdateCapsAddDetailsCaseAssignment = async(req, res) => {
    console.log('dataAccess >> add >> capsAddDetailsDao.js ',);
 
}
 
module.exports = {insertCapsAddDetails, getCapsAddDetails, getCapsAddDetailsByDecision, updateCapsAddDetailsCaseStatus, getCapsAddDetailsPolicyNumberUsername}
