import ApiWrapper from '../util/ApiWrapper';

export const getAllCountries = () => ApiWrapper.fetchWithToken('countries');

const countriesService = { getAllCountries };
export default countriesService;
