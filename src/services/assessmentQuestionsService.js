import ApiWrapper from '../util/ApiWrapper';

const assessmentQuestionsService = (data) =>
  ApiWrapper.fetchWithToken('assessment-questions', { method: 'POST', body: JSON.stringify({ data }) });

export default assessmentQuestionsService;
