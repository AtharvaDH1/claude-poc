const express = require("express");
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Apply authentication and admin authorization to all admin routes
router.use(authMiddleware.authenticate);
router.use(authorize("admin"));

// Platform-wide dashboard summary
router.get("/summary", adminController.getSummary);

// Recent claims across the platform
router.get("/claims/recent", adminController.getRecentClaims);

// Reports summary for admin reports page
router.get("/reports/summary", adminController.getReportSummary);

// Audit events for admin audit log
router.get("/audit", adminController.getAuditEvents);
router.get("/audit/tracked-users", adminController.getTrackedUserStatuses);
router.post("/audit/force-logout", adminController.forceLogoutTrackedUser);

// Admin claim assignment
router.post("/claims/assign", adminController.assignClaim);

module.exports = router;

