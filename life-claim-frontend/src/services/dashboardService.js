import { API_URL } from "../util/config";
import claimsService from "./claimsServices";
import wrapper from "../util/ApiWrapper";
import adminService from "./adminService";

const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (username, roles = []) => {
    try {
      const claims = await claimsService.getClaimByUsername(username);
      
      if (!claims || !Array.isArray(claims)) {
        return {
          totalClaims: 0,
          pendingClaims: 0,
          approvedClaims: 0,
          rejectedClaims: 0,
        };
      }

      // Logic based on roles
      const isAssessor = Array.isArray(roles) ? roles.includes("Assessor") : roles === "Assessor";
      const isVerifier = Array.isArray(roles) ? roles.includes("Verifier") : roles === "Verifier";

      let pendingClaimsCount, approvedClaimsCount, rejectedClaimsCount;

      if (isAssessor) {
        pendingClaimsCount = claims.filter(c => (c.STATUS || c.status || "").toLowerCase() === "pending assessor action").length;
        rejectedClaimsCount = claims.filter(c => {
          const s = (c.STATUS || c.status || "").toLowerCase();
          return s === "rejected" || s === "assessor rejected" || s === "payout rejected";
        }).length;
        approvedClaimsCount = claims.filter(c => {
          const s = (c.STATUS || c.status || "").toLowerCase();
          const r = (c.ROLE || c.role || "").toLowerCase();
          return s === "approved" || (s === "pending verifier allocation" && r === "verifier");
        }).length;
      } else if (isVerifier) {
        pendingClaimsCount = claims.filter(c => (c.STATUS || c.status || "").toLowerCase() === "pending verifier action").length;
        rejectedClaimsCount = claims.filter(c => {
          const s = (c.STATUS || c.status || "").toLowerCase();
          return s === "verifier rejected" || s === "payout rejected" || s === "rejected";
        }).length;
        approvedClaimsCount = claims.filter(c => {
          const s = (c.STATUS || c.status || "").toLowerCase();
          return s === "payout completed" || s === "approved";
        }).length;
      } else {
        // Default logic for other roles
        pendingClaimsCount = claims.filter(
          (claim) => {
            const s = (claim.STATUS || claim.status || "").toLowerCase();
            return s === "pending" || s === "in progress" || !s || s === "pending assessor action" || s === "pending verifier action";
          }
        ).length;
        approvedClaimsCount = claims.filter(
          (claim) => {
            const s = (claim.STATUS || claim.status || "").toLowerCase();
            return s === "approved" || s === "pending verifier allocation" || s === "payout completed";
          }
        ).length;
        rejectedClaimsCount = claims.filter(
          (claim) => {
            const s = (claim.STATUS || claim.status || "").toLowerCase();
            return s === "rejected" || s === "verifier rejected" || s === "assessor rejected" || s === "payout rejected";
          }
        ).length;
      }

      return {
        totalClaims: claims.length,
        pendingClaims: pendingClaimsCount,
        approvedClaims: approvedClaimsCount,
        rejectedClaims: rejectedClaimsCount,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return {
        totalClaims: 0,
        pendingClaims: 0,
        approvedClaims: 0,
        rejectedClaims: 0,
      };
    }
  },

  // Get recent activities for Activity Pulse
  getRecentActivities: async () => {
    try {
      const response = await wrapper.fetchWithToken("/dashboard/activities", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json().catch(() => null);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error fetching dashboard activities:", error);
      return [];
    }
  },

  // Get recent claims
  getRecentClaims: async (username, limit = 10) => {
    try {
      const claims = await claimsService.getClaimByUsername(username);
      
      if (!claims || !Array.isArray(claims)) {
        return [];
      }

      // Sort by date (most recent first) and limit
      // Backend already sorts, but we'll sort again as safety measure using correct field names
      const sortedClaims = claims
        .sort((a, b) => {
          const dateA = new Date(a.MODIFIED_AT || a.CREATED_AT || a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.MODIFIED_AT || b.CREATED_AT || b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        })
        .slice(0, limit);

      return sortedClaims;
    } catch (error) {
      console.error("Error fetching recent claims:", error);
      return [];
    }
  },
};

export const getDashboardData = async () => {
  const summary = await adminService.getSummary();
  return {
    metrics: {
      total: summary.totalClaims || 0,
      pending: summary.pending || 0,
      approved: summary.approved || 0,
      rejected: summary.rejected || 0,
    },
  };
};

export default dashboardService;
