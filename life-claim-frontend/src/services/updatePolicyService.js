import wrapper from "../util/ApiWrapper";


const registerPolicyService = async (policyData) => { 
    console.log(policyData)
    const response = await wrapper.fetchWithToken("/register-claim/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policyData)
    });
    const data = await response.json().catch(() => null);
    console.log(data)
    return data;
  }

  export default registerPolicyService