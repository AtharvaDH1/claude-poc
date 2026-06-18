import ApiWrapper from '../../util/ApiWrapper';

const getUsername = () => sessionStorage.getItem('loggedUser') || '';

export const ExcelUploaderService = (data) =>
  ApiWrapper.fetchWithToken('capsAddDetails/addValue', {
    method: 'POST',
    body: JSON.stringify({ data, username: getUsername() }),
  });

export const searchWithUserInput = (attribute, value, caseType, page, limit) =>
  ApiWrapper.fetchWithToken('capsAddDetails/getData', {
    method: 'POST',
    body: JSON.stringify({ caseType, attribute, value, username: getUsername(), page, limit }),
  });

export const approveData = (selectedData, caseStatus) =>
  ApiWrapper.fetchWithToken('capsAddDetails/approver-approve', {
    method: 'POST',
    body: JSON.stringify({ caseId: selectedData, caseStatus, username: getUsername() }),
  });

export const rejectData = (selectedData, caseStatus) =>
  ApiWrapper.fetchWithToken('capsAddDetails/approver-approve', {
    method: 'POST',
    body: JSON.stringify({ caseId: selectedData, caseStatus, username: getUsername() }),
  });

const dataEntryUploadService = { ExcelUploaderService, searchWithUserInput, approveData, rejectData };
export default dataEntryUploadService;
