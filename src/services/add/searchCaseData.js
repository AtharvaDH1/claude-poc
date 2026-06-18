import ApiWrapper from '../../util/ApiWrapper';

const searchCaseTableData = (attribute, value, limit, offset) =>
  ApiWrapper.fetchWithToken('case-search/search', {
    method: 'POST',
    body: JSON.stringify({ attribute, value, limit, offset }),
  });

export default searchCaseTableData;
