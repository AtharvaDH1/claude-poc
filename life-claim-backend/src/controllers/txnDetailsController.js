const { error } = require('winston');

const { getTransactionApiDBDetailsService, saveTransactionApiDetailsService } = require('../services/transactionApiDetailsService');
const {
  getTransactionApiBase,
  formatPolicyNumber,
} = require('../services/transactionApiClient');

console.log('txnDetailsController >> transaction service:', getTransactionApiBase());
const exposeErrorDetails = process.env.NODE_ENV !== 'production';

// Transaction API calling 
const getTxnDetailsController = async (req, res) => {
    try {
        const { policyId, txnDate } = req.body;
        const formattedPolicyId = formatPolicyNumber(policyId);
        const txnDetails = await fetch(
          `${getTransactionApiBase()}/api/transactionDetails/${formattedPolicyId}/${txnDate}`
        );
        //console.log('txnDetailsControllerjs >> getTxnDetailsController >> txnDetails :>', txnDetails);
        const data = await txnDetails.json();
       // console.log('txnDetailsControllerjs >> getTxnDetailsController >> txnDetails data :>', data );
         
        if (txnDetails.status === 200) {
            res.status(200).json(data);
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
        return data;
    } catch (error) {
        console.error('txnDetailsControllerjs >> getTxnDetailsController >> error :>', error);
        res.status(503).json({ 
            message: 'Service unavailable',
            ...(exposeErrorDetails ? {
                detail: error.message || 'Failed to connect to transaction service',
                code: error.code || undefined,
            } : {})
        });
    }
}

const getTransactionApiDetailsController = async (req, res) => {
    const {policyNumber} = req.body;
    const transactionApiDetails = await getTransactionApiDBDetailsService(policyNumber);
    if (transactionApiDetails.status === 200) {
        res.status(200).json(transactionApiDetails);
    } else {
        res.status(500).json({
            message: 'Internal server error',
            ...(exposeErrorDetails ? { detail: 'Transaction details lookup failed' } : {}),
        });
    }
}

const saveTransactionApiDetailsController = async (req, res) => {
    const transactionApiDetails = req.body;
    console.log('txnDetailsController >> saveTransactionApiDetailsController request received');
    const savedTransactionApiDetails = await saveTransactionApiDetailsService(transactionApiDetails);
    console.log('txnDetailsController >> saveTransactionApiDetailsController completed');
    if (savedTransactionApiDetails) {
        res.status(200).json(savedTransactionApiDetails);
    } else {
        res.status(500).json({
            message: 'Internal server error',
            ...(exposeErrorDetails ? { detail: 'Failed to persist transaction details' } : {}),
        });
    }
    //return savedTransactionApiDetails;
}

module.exports = {
    getTxnDetailsController, getTransactionApiDetailsController, saveTransactionApiDetailsController
}