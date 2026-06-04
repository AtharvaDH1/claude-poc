import wrapper from "../util/ApiWrapper";

export const claimSearch = {
  claimSearchNumber: async (claimNumber) => {
    try {
      const response = await wrapper.fetchWithToken("/claim-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claimNumber }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        return data;
      } else {
        console.error("claim no search error:", data?.message);
        return null;
      }
    } catch (error) {
      console.error("Error during search:", error);
      return null;
    }
  },

  updateAssessor: async (assessor, claimNumber, username) => {
    try {
      const response = await wrapper.fetchWithToken("/claim-search/update-ass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assessor, claimNumber, username }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        console.log("Policy found:", data);
        return data;
      } else {
        console.error("claim no search error:", data?.message);
        return null;
      }
    } catch (error) {
      console.error("Error during search:", error);
      return null;
    }
  },

  updateVerifier: async (verifier, claimNumber, username) => {
    try {
      const response = await wrapper.fetchWithToken("/claim-search/update-ver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verifier, claimNumber, username }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        return data;
      } else {
        console.error("claim no search error:", data?.message);
        return null;
      }
    } catch (error) {
      console.error("Error during search:", error);
      return null;
    }
  },
};