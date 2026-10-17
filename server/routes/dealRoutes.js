const express = require("express");

const {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  getSalesReport,
} = require("../controllers/dealController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create deal
router.post("/", protect, createDeal);
// Get sales report
router.get("/report", protect, getSalesReport);
// Get all deals
router.get("/", protect, getDeals);
// Get single deal details
router.get("/:id", protect, getDealById);
// Update deal
router.put("/:id", protect, updateDeal);
// Delete deal
router.delete("/:id", protect, deleteDeal);

module.exports = router;
