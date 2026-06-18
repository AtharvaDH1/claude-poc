import ApiWrapper from '../util/ApiWrapper';

export const getPolicyDetails = (policyID) => ApiWrapper.fetchWithToken(`policy/${policyID}`);

export const getAgentRepudiationDetails = (agentCode) =>
  ApiWrapper.fetchWithToken('agentRepudiation', {
    method: 'POST',
    body: JSON.stringify({ agentCode }),
  });

const policyService = { getPolicyDetails, getAgentRepudiationDetails };
export default policyService;
