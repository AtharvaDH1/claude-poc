import ApiWrapper from '../util/ApiWrapper';

export const DataSearch = (role) =>
  ApiWrapper.fetchWithToken('pool-selection', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });

export const updateAssignedUser = (claimNumber, LoggedUser, role, checkboxValue) =>
  ApiWrapper.fetchWithToken(`pool-selection/${claimNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ checkboxValue, LoggedUser, role }),
  });

const poolSelectionService = { DataSearch, updateAssignedUser };
export default poolSelectionService;
