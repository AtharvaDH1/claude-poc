import ApiWrapper from '../util/ApiWrapper';

export const getAllCaseReasons = () => ApiWrapper.fetchWithToken('case-reasons/');

export const getCaseAccessorRemarks = (claimId) =>
  ApiWrapper.fetchWithToken('case-reasons/system-assessor-remarks/', {
    method: 'POST',
    body: JSON.stringify({ claimId }),
  });

const caseReasonsService = { getAllCaseReasons, getCaseAccessorRemarks };
export default caseReasonsService;
