import wrapper from "../util/ApiWrapper";

const causeEventService = {
    causeEvent : async () => {
        try {
          const response = await wrapper.fetchWithToken("/cause-event",{
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          const payload = await response.json().catch(() => null);
          if (Array.isArray(payload)) return payload;
          if (Array.isArray(payload?.data)) return payload.data;
          return [];
        } catch (error) {
          console.error("Error fetching cause event:", error);
          return [];
        }
      },
}

export default causeEventService;