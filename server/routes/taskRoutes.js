const express = require("express");

const {
  createTask,
  getTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskReminders,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create task
router.post("/", protect, createTask);

// Get all tasks
router.get("/", protect, getTasks);

// Get task reminders
router.get("/reminders", protect, getTaskReminders);

// Update task status
router.put("/:id/status", protect, updateTaskStatus);

// Update task details
router.put("/:id", protect, updateTask);

// Delete task
router.delete("/:id", protect, deleteTask);

module.exports = router;
