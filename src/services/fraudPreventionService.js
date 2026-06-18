import ApiWrapper from '../util/ApiWrapper';
import userService from './userService';

export const fraudPreventionService = (pincode, city) =>
  ApiWrapper.fetchWithToken('fraudprevention/getSafeCityPincodeCheck', {
    method: 'POST',
    body: JSON.stringify({ pincode, city }),
  });

export const ruleTwoService = () =>
  ApiWrapper.fetchWithToken('fraudprevention/claimant_Bankdetails_Check');

export const ruleThreeService = (source) =>
  ApiWrapper.fetchWithToken('fraudprevention/agent_Trend_Check', {
    method: 'POST',
    body: JSON.stringify({ source }),
  });

export const ruleFourService = (numbers) =>
  ApiWrapper.fetchWithToken('fraudprevention/mobile_Number_Check', {
    method: 'POST',
    body: JSON.stringify({ numbers }),
  });

export const addAccessorFeedback = async (feedback, claimNumber) => {
  const loggedUser = sessionStorage.getItem('loggedUser') || '';
  let role = '';
  try {
    const userData = await userService.getUserById(loggedUser);
    role = userData?.roles?.[0] || '';
  } catch { }
  return ApiWrapper.fetchWithToken('fraudprevention/add_remarks_decisions', {
    method: 'POST',
    body: JSON.stringify({ feedback, claimNumber, role, username: loggedUser }),
  });
};

export const getExistingFeedback = (claimNumber) =>
  ApiWrapper.fetchWithToken('fraudprevention/get_eagle_rule_details', {
    method: 'POST',
    body: JSON.stringify({ claimNumber }),
  });

export const updateAccessorFeedback = (feedback, claimNumber) =>
  ApiWrapper.fetchWithToken('fraudprevention/update_eagle_rule_details', {
    method: 'PUT',
    body: JSON.stringify({ feedback, claimNumber }),
  });

const fraudPreventionServiceObj = { fraudPreventionService, ruleTwoService, ruleThreeService, ruleFourService, addAccessorFeedback, getExistingFeedback, updateAccessorFeedback };
export default fraudPreventionServiceObj;
