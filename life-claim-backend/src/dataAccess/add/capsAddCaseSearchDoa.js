const CapsAddDetails = require('../../models/add/CapsAddDetails');

const caseSearchData = async (attribute, value, limit, offset) => {
    try {
        let searchValue = value;
        // Normalize policy number if that's the search attribute
        if (attribute === 'policy_number') {
            searchValue = String(value).trim();
            if (searchValue.length < 8 && /^\d+$/.test(searchValue)) {
                searchValue = searchValue.padStart(8, '0');
            }
        }

        const { rows, count } = await CapsAddDetails.findAndCountAll({
            where: {
                [attribute]: searchValue,
            },
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
            order: [['case_id', 'DESC']]
        });
        console.log(`caseSearchData.js >> found ${rows.length} cases out of ${count}`);
        return { rows, count };
    } catch (error) {
        console.error('DataAccess > capsAddCaseSearchDoa.js > caseSearchData, Error getting data from CapsAddDetails:', error);
        throw error;
    }
}

module.exports = {caseSearchData};