const Task = require("../models/Task");
const User = require("../models/User");

// Create a task
const createTask = async (req, res) => {
  try {
    // Only manager can create and assign tasks
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can create tasks",
      });
    }

    const { title, description, employeeId, dueDate } = req.body;

    // Validate required fields
    if (!title || !employeeId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title, Employee ID and due date are required",
      });
    }

    // Find employee using Employee ID
    const employee = await User.findOne({
      employeeId: employeeId.toUpperCase(),
      role: "employee",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee with this Employee ID not found",
      });
    }

    // Check employee is active
    if (!employee.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign task to an inactive employee",
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description: description || "",
      assignedTo: employee._id,
      createdBy: req.user.userId,
      status: "Pending",
      dueDate,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        assignedTo: employee.employeeId,
        employeeName: employee.name,
        status: task.status,
        dueDate: task.dueDate,
      },
    });
  } catch (error) {
    //500 Internal Server Error
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// Get tasks
const getTasks = async (req, res) => {
  try {
    let query = {};

    // Employee can only see tasks assigned to them
    if (req.user.role === "employee") {
      query.assignedTo = req.user.userId;
    }

    const tasks = await Task.find(query)
      // Populate the assignedTo and createdBy fields with employee and manager details, respectively, but only select specific fields to return
      .populate("assignedTo", "employeeId name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "In Progress", "Completed"];

    // Validate status
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    // Find task
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Employee can update only their own assigned task
    if (
      req.user.role === "employee" &&
      task.assignedTo.toString() !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You can update only your assigned tasks",
      });
    }

    // Employees must follow the correct status order
    if (req.user.role === "employee") {
      const allowedTransitions = {
        Pending: ["In Progress"],
        "In Progress": ["Completed"],
        Completed: [],
      };

      const allowedNextStatuses = allowedTransitions[task.status];

      if (!allowedNextStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Employee cannot change task status from ${task.status} to ${status}`,
        });
      }
    }

    // Manager can change any task status
    task.status = status;

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: error.message,
    });
  }
};

// Update task details
const updateTask = async (req, res) => {
  try {
    // Only manager can edit task details
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can update task details",
      });
    }

    const { id } = req.params;
    const { title, description, employeeId, dueDate } = req.body;

    // Find task
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // Update title if provided
    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    // Update description if provided
    if (description !== undefined) {
      task.description = description.trim();
    }

    // Update assigned employee if provided
    if (employeeId !== undefined) {
      const employee = await User.findOne({
        employeeId: employeeId.toUpperCase(),
        role: "employee",
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee with this Employee ID not found",
        });
      }

      if (!employee.isActive) {
        return res.status(400).json({
          success: false,
          message: "Cannot assign task to an inactive employee",
        });
      }

      task.assignedTo = employee._id;
    }

    // Update due date if provided
    if (dueDate !== undefined) {
      if (!dueDate) {
        return res.status(400).json({
          success: false,
          message: "Due date cannot be empty",
        });
      }

      task.dueDate = dueDate;
    }

    await task.save();

    // Get updated task with employee and creator details
    const updatedTask = await Task.findById(task._id)
      .populate("assignedTo", "employeeId name email role")
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    // Only manager can delete tasks
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can delete tasks",
      });
    }

    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

// Get tasks that need attention
const getTaskReminders = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const baseQuery = {
      status: { $ne: "Completed" },
    };

    if (req.user.role === "employee") {
      baseQuery.assignedTo = req.user.userId;
    }

    const overdueTasks = await Task.find({
      ...baseQuery,
      dueDate: { $lt: startOfToday },
    })
      .populate("assignedTo", "employeeId name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    const dueTodayTasks = await Task.find({
      ...baseQuery,
      dueDate: { $gte: startOfToday, $lte: endOfToday },
    })
      .populate("assignedTo", "employeeId name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    const upcomingTasks = await Task.find({
      ...baseQuery,
      dueDate: { $gt: endOfToday },
    })
      .populate("assignedTo", "employeeId name email role")
      .populate("createdBy", "name email role")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      summary: {
        overdue: overdueTasks.length,
        dueToday: dueTodayTasks.length,
        upcoming: upcomingTasks.length,
      },
      reminders: {
        overdue: overdueTasks,
        dueToday: dueTodayTasks,
        upcoming: upcomingTasks,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch task reminders",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTaskReminders,
};
