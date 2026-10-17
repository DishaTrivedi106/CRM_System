const Lead = require("../models/Lead");
const User = require("../models/User");
const Customer = require("../models/Customer");

// Validation Functions
const isValidName = (name) => {
  return /^[A-Za-z ]{2,50}$/.test(name.trim());
};

const isValidEmail = (email) => {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
};

const isValidPhone = (phone) => {
  return /^\+?[0-9\s()-]{7,20}$/.test(phone.trim());
};

// Add Lead
const addLead = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!isValidName(cleanName)) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain only letters and spaces and must be 2-50 characters long",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    const existingLead = await Lead.findOne({
      email: cleanEmail,
    });

    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: "Lead with this email already exists",
      });
    }

    const lead = await Lead.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      stage: "New",
      createdBy: req.user.userId,
      stageHistory: [
        {
          stage: "New",
          changedBy: req.user.userId,
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Lead added successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add lead",
      error: error.message,
    });
  }
};

// Get Leads
const getLeads = async (req, res) => {
  try {
    let leads;

    if (req.user.role === "manager") {
      leads = await Lead.find()
        .populate("assignedTo", "name employeeId email")
        .populate("createdBy", "name employeeId email")
        .populate("convertedCustomer", "name email")
        .populate("stageHistory.changedBy", "name employeeId email")
        .sort({ createdAt: -1 });
    } else {
      leads = await Lead.find({
        $or: [
          {
            assignedTo: req.user.userId,
          },
          {
            assignedTo: null,
            createdBy: req.user.userId,
          },
        ],
      })
        .populate("assignedTo", "name employeeId email")
        .populate("createdBy", "name employeeId email")
        .populate("convertedCustomer", "name email")
        .populate("stageHistory.changedBy", "name employeeId email")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      leads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message,
    });
  }
};

// Update Lead Details
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!isValidName(cleanName)) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain only letters and spaces and must be 2-50 characters long",
      });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (req.user.role === "employee") {
      const isAssignedToEmployee =
        lead.assignedTo && lead.assignedTo.toString() === req.user.userId;

      const isOwnUnassignedLead =
        !lead.assignedTo && lead.createdBy.toString() === req.user.userId;

      if (!isAssignedToEmployee && !isOwnUnassignedLead) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to edit this lead",
        });
      }
    }

    const existingLead = await Lead.findOne({
      email: cleanEmail,
      _id: { $ne: id },
    });

    if (existingLead) {
      return res.status(409).json({
        success: false,
        message: "Lead with this email already exists",
      });
    }

    lead.name = cleanName;
    lead.email = cleanEmail;
    lead.phone = cleanPhone;

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update lead",
      error: error.message,
    });
  }
};

// Update Lead Stage
const updateLeadStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    const validStages = ["New", "Contacted", "Lost"];

    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid stage. Converted stage can only be set through lead conversion.",
      });
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (req.user.role === "employee") {
      const isAssignedToEmployee =
        lead.assignedTo && lead.assignedTo.toString() === req.user.userId;

      const isOwnUnassignedLead =
        !lead.assignedTo && lead.createdBy.toString() === req.user.userId;

      if (!isAssignedToEmployee && !isOwnUnassignedLead) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this lead",
        });
      }
    }

    if (lead.stage === "Converted") {
      return res.status(400).json({
        success: false,
        message: "Converted lead cannot be changed",
      });
    }

    if (lead.stage === stage) {
      return res.status(400).json({
        success: false,
        message: "Lead is already in this stage",
      });
    }

    const allowedTransitions = {
      New: ["Contacted", "Lost"],
      Contacted: ["New", "Lost"],
      Lost: ["Contacted"],
    };

    if (!allowedTransitions[lead.stage]?.includes(stage)) {
      return res.status(400).json({
        success: false,
        message: `Lead cannot be changed from ${lead.stage} to ${stage}`,
      });
    }

    lead.stage = stage;

    lead.stageHistory.push({
      stage,
      changedBy: req.user.userId,
      changedAt: new Date(),
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead stage updated successfully",
      lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update lead stage",
      error: error.message,
    });
  }
};

// Assign Lead
const assignLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can assign leads",
      });
    }

    if (!employeeId || !employeeId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    const employee = await User.findOne({
      employeeId: employeeId.trim().toUpperCase(),
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
        message: "Employee is inactive",
      });
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (lead.stage === "Converted") {
      return res.status(400).json({
        success: false,
        message: "Converted lead cannot be reassigned",
      });
    }

    lead.assignedTo = employee._id;

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead assigned successfully",
      lead,
      assignedEmployee: {
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign lead",
      error: error.message,
    });
  }
};

// Convert Lead To Customer
const convertLeadToCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (req.user.role === "employee") {
      const isAssignedToEmployee =
        lead.assignedTo && lead.assignedTo.toString() === req.user.userId;

      const isOwnUnassignedLead =
        !lead.assignedTo && lead.createdBy.toString() === req.user.userId;

      if (!isAssignedToEmployee && !isOwnUnassignedLead) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to convert this lead",
        });
      }
    }

    if (lead.stage === "Converted" || lead.convertedCustomer) {
      return res.status(400).json({
        success: false,
        message: "Lead is already converted to a customer",
      });
    }

    if (lead.stage === "Lost") {
      return res.status(400).json({
        success: false,
        message:
          "Lost lead cannot be converted. Change the lead to Contacted first.",
      });
    }

    const existingCustomer = await Customer.findOne({
      email: lead.email.toLowerCase(),
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }

    const customer = await Customer.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      createdBy: req.user.userId,
      activities: [
        {
          type: "Created",
          description: "Customer created by converting lead",
          createdBy: req.user.userId,
        },
      ],
    });

    lead.stage = "Converted";
    lead.convertedCustomer = customer._id;

    lead.stageHistory.push({
      stage: "Converted",
      changedBy: req.user.userId,
      changedAt: new Date(),
    });

    await lead.save();

    res.status(200).json({
      success: true,
      message: "Lead converted to customer successfully",
      lead,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to convert lead",
      error: error.message,
    });
  }
};

// Delete Lead
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Only manager can delete leads",
      });
    }

    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    await Lead.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error.message,
    });
  }
};

module.exports = {
  addLead,
  getLeads,
  updateLead,
  updateLeadStage,
  assignLead,
  convertLeadToCustomer,
  deleteLead,
};
