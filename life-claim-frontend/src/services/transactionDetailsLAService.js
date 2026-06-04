import wrapper from "../util/ApiWrapper";
import { toast } from "react-toastify";

// Fetch transaction details for Life Assured
export const getTransactionDetailsLA = async (policyId, txnDate) => {
  try {
    const response = await wrapper.fetchWithToken("/txn/txnDetails/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ policyId, txnDate }),
    });

    console.log("transactionDetailsLA >> response: ", response);
    const txnResult = await response.json().catch(() => null);
    console.log("transactionDetailsLA >> txnResult: ", txnResult);
    return txnResult;
  } catch (error) {
    console.error("transactionDetailsLA >> error: ", error);
    toast.error("Error fetching transaction details");
    return null;
  }
};

// Save / persist transaction details (including remarks & actions)
export const saveTransactionDetailsLA = async (
  policyId,
  txnDate,
  transactionDetails
) => {
  try {
    console.log("saveTransactionDetailsLAService.js >> transactionDetails: ", transactionDetails);
    const response = await wrapper.fetchWithToken("/txn/txnSave/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        policyId,
        txnDate,
        transactionDetails,
      }),
    });

    const result = await response.json().catch(() => null);
    console.log("saveTransactionDetailsLA >> result: ", result);

    if (result) {
      toast.success("Transaction details Added/Updated successfully");
      return result;
    } else {
      console.error("saveTransactionDetailsLA >> error: ", result);
      toast.error("Error saving transaction details");
      return null;
    }
  } catch (error) {
    console.error("saveTransactionDetailsLA >> exception: ", error);
    toast.error("Unexpected error while saving transaction details");
    return null;
  }
};

// Keep default export for existing imports
export default getTransactionDetailsLA;
