import ApiWrapper from '../util/ApiWrapper';

const calculateAmountService = (obj) =>
  ApiWrapper.fetchWithToken('calculate-amount', { method: 'POST', body: JSON.stringify({ obj }) });

export default calculateAmountService;
