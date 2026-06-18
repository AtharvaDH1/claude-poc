import ApiWrapper from '../util/ApiWrapper';

export const demogsFetch = (claimNo) => ApiWrapper.fetchWithToken(`assessor-fetch/demogs/${claimNo}`);
export const requireFetch = (claimNo) => ApiWrapper.fetchWithToken(`assessor-fetch/require/${claimNo}`);
export const assessmentFetch = (claimNo) => ApiWrapper.fetchWithToken(`assessor-fetch/assess/${claimNo}`);
export const decisionFetch = (claimNo) => ApiWrapper.fetchWithToken(`assessor-fetch/decision/${claimNo}`);
export const calculateAmountFetch = (claimNo) => ApiWrapper.fetchWithToken(`assessor-fetch/calcAmt/${claimNo}`);

const assessorFetchService = { demogsFetch, requireFetch, assessmentFetch, decisionFetch, calculateAmountFetch };
export default assessorFetchService;
