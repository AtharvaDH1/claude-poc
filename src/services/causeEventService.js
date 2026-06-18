import ApiWrapper from '../util/ApiWrapper';

export const causeEvent = () => ApiWrapper.fetchWithToken('cause-event');

const causeEventService = { causeEvent };
export default causeEventService;
