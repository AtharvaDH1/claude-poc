import ApiWrapper from '../../util/ApiWrapper';

export const AssessmentPool = (attribute, value, exclusionFilter, offset, limit) =>
  ApiWrapper.fetchWithToken('Assessment/pool', {
    method: 'POST',
    body: JSON.stringify({ attribute, value, exclusionFilter, offset, limit }),
  });

export const closeCasesAsExclusion = (caseIds, reason, remarks) =>
  ApiWrapper.fetchWithToken('Assessment/closeCasesAsExclusion', {
    method: 'POST',
    body: JSON.stringify({ caseIds, reason, remarks }),
  });

export const moveCasesToBeReferred = (caseIds) =>
  ApiWrapper.fetchWithToken('Assessment/moveCasesToBeReferred', {
    method: 'POST',
    body: JSON.stringify({ caseIds }),
  });

export const getCaseDetails = (caseId) =>
  ApiWrapper.fetchWithToken('Assessment/getCaseDetails', {
    method: 'POST',
    body: JSON.stringify({ caseId }),
  });

export const refreshLifeAsiaData = (caseId, username) =>
  ApiWrapper.fetchWithToken('Assessment/refreshLifeAsiaData', {
    method: 'POST',
    body: JSON.stringify({ caseId, username }),
  });

const assessmentPoolService = { AssessmentPool, closeCasesAsExclusion, moveCasesToBeReferred, getCaseDetails, refreshLifeAsiaData };
export default assessmentPoolService;
