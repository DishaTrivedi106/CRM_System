const User = require("../models/User");
const Task = require("../models/Task");

// Generate next Employee ID
const generateEmployeeId = async () => {
  const lastEmployee = await User.findOne({
    role: "employee",
    employeeId: { $exists: true },
  }).sort({ employeeId: -1 });

  if (!lastEmployee) {
    return "EMP001";
  }

  const lastNumber = parseInt(lastEmployee.employeeId.replace("EMP", ""), 10);

  return `EMP${String(lastNumber + 1).padStart(3, "0")}`;
};

// Get all employees
const getEmployees = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      //403 Forbidden status code indicates that the server understands the request but refuses to authorize it. In this case, it is used to indicate that only users with the "manager" role are allowed to view employees.
      return res.status(403).json({
        success: false,
        message: "Only manager can view employees",
      });
    }

    const employees = await User.find({ role: "employee" }, "-password").sort({
      createdAt: -1,
    });

    //200 ok status code
    res.status(200).json({
      success: true,
      count: employees.length,
      employees,
    });
  } catch (error) {
    //500 Internal Server Error
    res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};

// Add employee
const addEmployee = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can add employees",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    const employeeId = await generateEmployeeId();

    const bcrypt = require("bcryptjs");

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await User.create({
      employeeId,
      name,
      email,
      password: hashedPassword,
      role: "employee",
      isActive: true,
    });

    //201 Created status code indicates that the request has been fulfilled and has resulted in the creation of a new resource.
    res.status(201).json({
      success: true,
      message: "Employee added successfully",
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add employee",
      error: error.message,
    });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can update employees",
      });
    }

    const { employeeId } = req.params;
    const { name, email, isActive } = req.body;

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

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      employee.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const existingUser = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: employee._id },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Another user already uses this email",
        });
      }

      employee.email = email.toLowerCase().trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      employee.isActive = isActive;
    }

    await employee.save();

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error.message,
    });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can delete employees",
      });
    }

    const { employeeId } = req.params;

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

    //findByIdAndDelete is a Mongoose method that finds a document by its _id and deletes it from the database.
    await User.findByIdAndDelete(employee._id);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete employee",
      error: error.message,
    });
  }
};

// Get employee performance
const getEmployeePerformance = async (req, res) => {
  try {
    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can view employee performance",
      });
    }

    const employees = await User.find(
      { role: "employee" },
      "employeeId name email isActive",
    );

    const performance = await Promise.all(
      //map through each employee and get their performance metrics
      employees.map(async (employee) => {
        // Count leads handled by the employee
        const leadCount = await require("../models/Lead").countDocuments({
          assignedTo: employee._id,
        });

        const tasksAssigned = await Task.countDocuments({
          assignedTo: employee._id,
        });

        const tasksCompleted = await Task.countDocuments({
          assignedTo: employee._id,
          status: "Completed",
        });

        const pendingTasks = await Task.countDocuments({
          assignedTo: employee._id,
          status: {
            $in: ["Pending", "In Progress"],
          },
        });

        return {
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          isActive: employee.isActive,
          leadsHandled: leadCount,
          tasksAssigned,
          tasksCompleted,
          pendingTasks,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: performance.length,
      performance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch employee performance",
      error: error.message,
    });
  }
};

module.exports = {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeePerformance,
};
