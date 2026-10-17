const express = require("express");

const {
  addLead,
  getLeads,
  updateLead,
  updateLeadStage,
  assignLead,
  convertLeadToCustomer,
  deleteLead,
} = require("../controllers/leadController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, addLead);

router.get("/", protect, getLeads);

router.put("/:id", protect, updateLead);

router.put("/:id/stage", protect, updateLeadStage);

router.put("/:id/assign", protect, assignLead);

router.put("/:id/convert", protect, convertLeadToCustomer);

router.delete("/:id", protect, deleteLead);

module.exports = router;
