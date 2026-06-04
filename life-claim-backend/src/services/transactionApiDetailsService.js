const { getTransactionApiDBDetails, saveTransactionApiDetails } = require('../dataAccess/transactionApiDetails');

const getTransactionApiDBDetailsService = async (policyNumber) => {
    try {
        const transactionApiDetails = await getTransactionApiDBDetails(policyNumber);
        return transactionApiDetails;
    } catch (error) {
        console.log(' services >> txnTransactionApiDetailsService.js >> getTxnTransactionApiDetailsService >> error :>', error);
        return error;
       // throw new Error('Service error: ' + error.message);
    
    }
}

const saveTransactionApiDetailsService = async (transactionApiDetails) => {
    try {
        const savedTransactionApiDetails = await saveTransactionApiDetails(transactionApiDetails);
        console.log(' services >> txnTransactionApiDetailsService.js >> saveTxnTransactionApiDetailsService >> savedTransactionApiDetails :>', savedTransactionApiDetails);
        return savedTransactionApiDetails;
    } catch (error) {
        console.log(' services >> txnTransactionApiDetailsService.js >> saveTxnTransactionApiDetailsService >> error :>', error);
        return error;
       // throw new Error('Service error: ' + error.message);
    
    }
}

module.exports = { getTransactionApiDBDetailsService, saveTransactionApiDetailsService };