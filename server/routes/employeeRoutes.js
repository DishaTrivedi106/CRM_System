const express = require("express");

const employeeController = require("../controllers/employeeController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Employee Management
router.get("/", protect, employeeController.getEmployees);
router.post("/", protect, employeeController.addEmployee);
router.put("/:employeeId", protect, employeeController.updateEmployee);
router.delete("/:employeeId", protect, employeeController.deleteEmployee);

// Employee Performance
router.get("/performance", protect, employeeController.getEmployeePerformance);

module.exports = router;
