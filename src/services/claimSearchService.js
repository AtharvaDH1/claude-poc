import ApiWrapper from '../util/ApiWrapper';

export const claimSearchNumber = (claimNumber) =>
  ApiWrapper.fetchWithToken('claim-search', {
    method: 'POST',
    body: JSON.stringify({ claimNumber }),
  });

export const updateAssessor = (assessor, claimNumber, username) =>
  ApiWrapper.fetchWithToken('claim-search/update-ass', {
    method: 'POST',
    body: JSON.stringify({ assessor, claimNumber, username }),
  });

export const updateVerifier = (verifier, claimNumber, username) =>
  ApiWrapper.fetchWithToken('claim-search/update-ver', {
    method: 'POST',
    body: JSON.stringify({ verifier, claimNumber, username }),
  });

const claimSearch = { claimSearchNumber, updateAssessor, updateVerifier };
export default claimSearch;
