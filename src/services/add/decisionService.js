import ApiWrapper from '../../util/ApiWrapper';

const getUsername = () => sessionStorage.getItem('loggedUser') || '';

export const getDecisionMasterData = () => ApiWrapper.fetchWithToken('Assessment/decisionMasterData');

export const saveFindings = (findings) =>
  ApiWrapper.fetchWithToken('Assessment/saveFindings', {
    method: 'POST',
    body: JSON.stringify({ findings, username: getUsername() }),
  });

export const saveDecision = (decisionData) =>
  ApiWrapper.fetchWithToken('Assessment/saveDecision', {
    method: 'POST',
    body: JSON.stringify({ decisionData, username: getUsername() }),
  });

const decisionService = { getDecisionMasterData, saveFindings, saveDecision };
export default decisionService;
