import ApiWrapper from '../util/ApiWrapper';

const placeOfDeathService = () => ApiWrapper.fetchWithToken('states/place');

export default placeOfDeathService;
