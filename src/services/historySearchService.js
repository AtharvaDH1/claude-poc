import ApiWrapper from '../util/ApiWrapper';

const historySearch = (policyNumber, claimNumber) =>
  ApiWrapper.fetchWithToken('history-search', {
    method: 'POST',
    body: JSON.stringify({ policyNumber, claimNumber }),
  });

export default historySearch;
