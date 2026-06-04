const CapsAddExclusionMaster = require('../../models/add/CapsAddExclusionMaster');
const CapsAddDetails = require('../../models/add/CapsAddDetails');
const CapsAddContractDetails = require('../../models/add/CapsAddContractDetails');
const CapsAddLifeAssuredDetails = require('../../models/add/CapsAddLifeAssuredDetails');
const db = require('../../config/dbConfig');

/**
 * Applies exclusion rules to a case based on the Java logic
 * @param {number} caseId - The case ID to check
 * @returns {Promise<{exclusionApplied: boolean, exclusionType: string|null}>}
 */
const checkForExclusionRule = async (caseId) => {
    try {
        let exclusionApplied = false;
        let exclusionType = null;

        // Fetch case data with related tables using lowercase column names
        const queryText = `
            SELECT 
                d.case_id,
                cd.policy_status,
                cd.rcd,
                cd.annual_premium,
                cd.product_code,
                cd.premium_amount,
                cd.premium_frequency,
                cd.agent_stat_code,
                cd.agent_fsc_name,
                la.res_status,
                la.dob,
                la.age
            FROM caps_add_details d 
            LEFT JOIN caps_add_life_assured_details la ON d.case_id = la.case_id 
            LEFT JOIN caps_add_contract_details cd ON d.case_id = cd.case_id 
            WHERE d.case_id = ?
        `;

        const [rows] = await db.query(queryText, [caseId]);
        
        if (!rows || rows.length === 0) {
            console.log(`Case ID ${caseId} not found`);
            return { exclusionApplied: false, exclusionType: null };
        }

        const caseData = rows[0];
        
        const hasContractDetails = caseData.policy_status !== null;
        const hasLifeAssuredDetails = caseData.dob !== null;
        
        const claimType = caseData.policy_status || '';
        const policyStatus = caseData.policy_status || '';
        const residentialStatus = caseData.res_status || '';
        const advisor = caseData.agent_stat_code || '';
        const partner = caseData.agent_fsc_name || '';
        const premiumAmt = parseFloat(caseData.premium_amount) || 0;
        const premiumFreq = parseFloat(caseData.premium_frequency) || 0;
        const prdCode = caseData.product_code || '';
        const riskCommencementDate = caseData.rcd ? new Date(caseData.rcd) : null;
        const laDob = caseData.dob ? new Date(caseData.dob) : null;

        // Calculate annual premium
        let annualPremium = 0;
        if (hasContractDetails && premiumAmt && premiumFreq) {
            annualPremium = premiumAmt * premiumFreq;
            if (annualPremium > 0) {
                await CapsAddContractDetails.update(
                    { annual_premium: annualPremium.toString() },
                    { where: { case_id: caseId } }
                );
            }
        }

        let difference_In_Years = 0;
        if (hasContractDetails && riskCommencementDate) {
            const currentDate = new Date();
            const differenceInMillisec = currentDate.getTime() - riskCommencementDate.getTime();
            difference_In_Years = Math.floor(differenceInMillisec / (1000 * 60 * 60 * 24 * 365));
        }

        let ageInYears = 0;
        if (hasLifeAssuredDetails && laDob) {
            const currDate = new Date();
            const ageInMillis = currDate.getTime() - laDob.getTime();
            ageInYears = Math.floor(ageInMillis / (1000 * 60 * 60 * 24 * 365));
        }

        // Rule 1: Claim received
        if (!exclusionApplied) {
            const exclusionValues = await CapsAddExclusionMaster.findAll({
                where: { exclusion_type: 'Claim received' },
                attributes: ['exclusion_value']
            });
            for (const exclusion of exclusionValues) {
                if (claimType && claimType.toLowerCase() === exclusion.exclusion_value.toLowerCase()) {
                    exclusionType = 'Claim Received';
                    exclusionApplied = true;
                    break;
                }
            }
        }

        // Rule 2: In-active policy status
        if (!exclusionApplied) {
            const exclusionValues = await CapsAddExclusionMaster.findAll({
                where: { exclusion_type: 'In-active policy status' },
                attributes: ['exclusion_value']
            });
            for (const exclusion of exclusionValues) {
                if (policyStatus && policyStatus.toLowerCase() === exclusion.exclusion_value.toLowerCase()) {
                    exclusionType = 'In-active policy status';
                    exclusionApplied = true;
                    break;
                }
            }
        }

        if (!exclusionApplied && difference_In_Years >= 3) {
            exclusionType = 'RCD more than 3 years';
            exclusionApplied = true;
        }

        if (!exclusionApplied && hasContractDetails && premiumAmt && premiumFreq && prdCode && 
            (prdCode.toUpperCase().startsWith('E') || prdCode.toUpperCase().startsWith('U')) && 
            annualPremium >= 500000) {
            exclusionType = 'Annual Premium > 5 lakh saving cases';
            exclusionApplied = true;
        }

        if (!exclusionApplied && hasLifeAssuredDetails && residentialStatus && residentialStatus.toUpperCase() === 'N') {
            exclusionType = 'NRI customer';
            exclusionApplied = true;
        }

        if (!exclusionApplied && advisor) {
            const exclusionValues = await CapsAddExclusionMaster.findAll({
                where: { exclusion_type: 'Top advisor' },
                attributes: ['exclusion_value']
            });
            for (const exclusion of exclusionValues) {
                if (advisor.toLowerCase() === exclusion.exclusion_value.toLowerCase()) {
                    exclusionType = 'Top advisor';
                    exclusionApplied = true;
                    break;
                }
            }
        }

        if (!exclusionApplied && partner) {
            const exclusionValues = await CapsAddExclusionMaster.findAll({
                where: { exclusion_type: 'Partner Exclusion' },
                attributes: ['exclusion_value']
            });
            for (const exclusion of exclusionValues) {
                if (partner.toLowerCase() === exclusion.exclusion_value.toLowerCase()) {
                    exclusionType = 'Partner Exclusion';
                    exclusionApplied = true;
                    break;
                }
            }
        }

        if (!exclusionApplied && hasContractDetails && prdCode) {
            const exclusionValues = await CapsAddExclusionMaster.findAll({
                where: { exclusion_type: 'Product Norms' },
                attributes: ['exclusion_value']
            });
            for (const exclusion of exclusionValues) {
                if (prdCode.toLowerCase() === exclusion.exclusion_value.toLowerCase() ||
                    prdCode.toUpperCase().startsWith('G') ||
                    prdCode.toUpperCase().startsWith('I')) {
                    exclusionType = 'Product Norms';
                    exclusionApplied = true;
                    break;
                }
            }
        }

        if (!exclusionApplied && hasLifeAssuredDetails && ageInYears > 0 && ageInYears <= 18) {
            exclusionType = 'Minor Life Assured';
            exclusionApplied = true;
        }

        if (!exclusionApplied && hasContractDetails && prdCode) {
            const exclusionValues = await CapsAddExclusionMaster.findAll({
                where: { exclusion_type: 'ULIP Policy' },
                attributes: ['exclusion_value']
            });
            for (const exclusion of exclusionValues) {
                if (prdCode.toLowerCase() === exclusion.exclusion_value.toLowerCase()) {
                    exclusionType = 'ULIP Policy';
                    exclusionApplied = true;
                    break;
                }
            }
        }

        if (exclusionType) {
            await CapsAddDetails.update(
                { exclusion_type_rule: exclusionType },
                { where: { case_id: caseId } }
            );
        }

        return { exclusionApplied, exclusionType };

    } catch (error) {
        console.error('Error in checkForExclusionRule:', error);
        throw error;
    }
};

module.exports = { checkForExclusionRule };
