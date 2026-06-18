import ApiWrapper from '../util/ApiWrapper';

export const getAllStates = () => ApiWrapper.fetchWithToken('states');

export const requirementMasterService = () => ApiWrapper.fetchWithToken('states/requirements');

export const getPortfolioService = (productCode, productName, sumAssured) =>
  ApiWrapper.fetchWithToken('states/portfolio', {
    method: 'POST',
    body: JSON.stringify({ productCode, productName, sumAssured }),
  });

export const getSystemRequirementService = (portfolioType, typeOfClaim, policyStatus, sumAssured) =>
  ApiWrapper.fetchWithToken('states/system-requirement', {
    method: 'POST',
    body: JSON.stringify({ portfolioType, typeOfClaim, policyStatus, sumAssured }),
  });

const statesService = { getAllStates, requirementMasterService, getPortfolioService, getSystemRequirementService };
export default statesService;
