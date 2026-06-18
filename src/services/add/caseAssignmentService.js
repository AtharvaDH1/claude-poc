import ApiWrapper from '../../util/ApiWrapper';

const getUsername = () => sessionStorage.getItem('loggedUser') || '';

const CaseAssignmentService = (data) =>
  ApiWrapper.fetchWithToken('case-assignment/add', {
    method: 'POST',
    body: JSON.stringify({ data, uploadedBy: getUsername() }),
  });

export default CaseAssignmentService;
