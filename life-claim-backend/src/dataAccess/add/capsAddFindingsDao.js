const CapsAddFindings = require('../../models/add/CapsAddFindings');

/**
 * Save multiple findings to caps_add_findings
 */
const saveFindings = async (findingsList, username) => {
    try {
        if (findingsList.length > 0) {
            const caseId = findingsList[0].case_id || findingsList[0].caseId;
            // Delete existing findings for this case to prevent duplicates
            await CapsAddFindings.destroy({ where: { case_id: caseId } });
        }

        const findingsToSave = findingsList.map(item => ({
            case_id: item.case_id || item.caseId,
            findings: item.findings,
            remarks: item.remarks,
            rule: item.rule,
            decision: item.decision,
            severity: item.severity,
            ailment_name: item.ailment_name || item.ailmentName,
            ailment_type: item.ailment_type || item.ailmentType,
            type_of_evidence: item.type_of_evidence || item.evidenceType,
            medical_records: 'medical_records',
            created_by: username,
            created_on: new Date(),
            modified_by: username,
            modified_on: new Date()
        }));

        return await CapsAddFindings.bulkCreate(findingsToSave);
    } catch (error) {
        console.error('Error in saveFindings DAO:', error);
        throw error;
    }
};

module.exports = {
    saveFindings
};
