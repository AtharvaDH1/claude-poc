import ApiWrapper from '../util/ApiWrapper';

export const registerPolicyService = (policyData) =>
  ApiWrapper.fetchWithToken('register-claim', {
    method: 'POST',
    body: JSON.stringify(policyData),
  });

export default registerPolicyService;
