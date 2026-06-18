import ApiWrapper from '../util/ApiWrapper';

export const trapScoreService = (trapScoreData) =>
  ApiWrapper.fetchWithToken('trap-score', { method: 'POST', body: JSON.stringify({ trapScoreData }) });

export default trapScoreService;
