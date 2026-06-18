import ApiWrapper from '../util/ApiWrapper';

const systemDecisionAndReasonService = (policyData) =>
  ApiWrapper.fetchWithToken('systemDec/generateSystemDecision', {
    method: 'POST',
    body: JSON.stringify({ policyData }),
  });

export default systemDecisionAndReasonService;
