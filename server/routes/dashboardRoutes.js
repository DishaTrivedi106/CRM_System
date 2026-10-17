const express = require("express");

const { getDashboardSummary } = require("../controllers/dashboardController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get dashboard summary
router.get("/summary", protect, getDashboardSummary);

module.exports = router;
