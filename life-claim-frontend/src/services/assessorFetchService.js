import wrapper from "../util/ApiWrapper";

const fetchAssessorData = async (path) => {
  try {
    const response = await wrapper.fetchWithToken(path, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json().catch(() => null);
    return data;
  } catch (error) {
    console.error(`assessorFetchService error for ${path}:`, error);
    return null;
  }
};

const assessorFetchService = {
  demogsFetch: async (claimNo) => {
    return fetchAssessorData(`/assessor-fetch/demogs/${claimNo}`);
  },
  requireFetch: async (claimNo) => {
    return fetchAssessorData(`/assessor-fetch/require/${claimNo}`);
  },
  assessmentFetch: async (claimNo) => {
    return fetchAssessorData(`/assessor-fetch/assess/${claimNo}`);
  },
  decisionFetch: async (claimNo) => {
    return fetchAssessorData(`/assessor-fetch/decision/${claimNo}`);
  },
  calculateAmountFetch: async (claimNo) => {
    return fetchAssessorData(`/assessor-fetch/calcAmt/${claimNo}`);
  },

};

export default assessorFetchService;
