import wrapper from "../util/ApiWrapper";

// Fetch transaction details for Life Assured
export const getTransactionDetailsLA = async (policyId, txnDate) => {
  const response = await wrapper.fetchWithToken("/txn/txnDetails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policyId, txnDate }),
  });
  return response.json().catch(() => null);
};

// Save / persist transaction details (including remarks & actions)
export const saveTransactionDetailsLA = async (policyId, txnDate, transactionDetails) => {
  const response = await wrapper.fetchWithToken("/txn/txnSave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ policyId, txnDate, transactionDetails }),
  });
  return response.json().catch(() => null);
};

export const getTransactionApiDBDetails = async (policyId, txnDate) => {
  const response = await wrapper.fetchWithToken('/txn/transactionApiDBDetails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policyId, txnDate }),
  })
  return response.json().catch(() => null)
}

// Keep default export for existing imports
export default getTransactionDetailsLA;
