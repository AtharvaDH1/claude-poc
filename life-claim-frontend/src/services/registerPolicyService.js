import wrapper from "../util/ApiWrapper";


const registerPolicyService = async (policyData) => { 
  console.log('registerPolicyService.js >> policyData', policyData)
    
    const response = await wrapper.fetchWithToken("/register-claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(policyData)
    });
    const data = await response.json().catch(() => null);
    return data;
  }

  const getPolicyService = async (policyData) => { 
    
    const response = await wrapper.fetchWithToken("/register-claim", {
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