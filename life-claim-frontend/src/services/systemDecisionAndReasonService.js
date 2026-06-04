import wrapper from "../util/ApiWrapper";

const systemDecisionAndReasonService = async (sysdata) => { 
    console.log(sysdata)
    const response = await wrapper.fetchWithToken("/systemDec/generateSystemDecision", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        policyData:sysdata
      })
    });

    const data = await response.json().catch(() => null);
    console.log(data)
    return data;
  }
  export default systemDecisionAndReasonService