import ApiWrapper from '../util/ApiWrapper';

export const getTransactionDetailsLA = (policyId, txnDate) =>
  ApiWrapper.fetchWithToken('txn/txnDetails/', {
    method: 'POST',
    body: JSON.stringify({ policyId, txnDate }),
  });

export const saveTransactionDetailsLA = (policyId, txnDate, transactionDetails) =>
  ApiWrapper.fetchWithToken('txn/txnSave/', {
    method: 'POST',
    body: JSON.stringify({ policyId, txnDate, transactionDetails }),
  });

const transactionDetailsLAService = { getTransactionDetailsLA, saveTransactionDetailsLA };
export default transactionDetailsLAService;
