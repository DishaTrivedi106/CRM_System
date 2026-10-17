const Deal = require("../models/Deal");
const Customer = require("../models/Customer");

// Create a deal
const createDeal = async (req, res) => {
  try {
    const { title, customerId, newCustomer, amount, cost } = req.body;

    if (typeof title !== "string" || !title.trim() || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title and amount are required",
      });
    }

    const dealAmount = Number(amount);
    const dealCost = cost === undefined ? 0 : Number(cost);

    if (!Number.isFinite(dealAmount) || dealAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid non-negative number",
      });
    }

    if (!Number.isFinite(dealCost) || dealCost < 0) {
      return res.status(400).json({
        success: false,
        message: "Cost must be a valid non-negative number",
      });
    }

    let customer;

    if (customerId) {
      customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    } else if (newCustomer) {
      const { name, email, phone } = newCustomer;

      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer name is required",
        });
      }

      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer email is required",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Customer phone is required",
        });
      }

      const normalizedPhone = phone.trim();

      if (!/^\+?[0-9\s\-().]{7,20}$/.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid phone number",
        });
      }

      const existingCustomer = await Customer.findOne({
        email: normalizedEmail,
      });

      if (existingCustomer) {
        return res.status(409).json({
          success: false,
          message:
            "Customer with this email already exists. Select the existing customer.",
        });
      }

      customer = await Customer.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        createdBy: req.user.userId,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Select an existing customer or provide new customer details",
      });
    }

    const deal = await Deal.create({
      title: title.trim(),
      customer: customer._id,
      amount: dealAmount,
      cost: dealCost,
      status: "Open",
      createdBy: req.user.userId,
    });

    const populatedDeal = await Deal.findById(deal._id)
      .populate("customer", "name email phone")
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Deal created successfully",
      deal: populatedDeal,
      customer,
    });
  } catch (error) {
    console.error("Create deal error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create deal",
      error: error.message,
    });
  }
};

// Get deals based on role, with search and filters
const getDeals = async (req, res) => {
  try {
    const { search, status, customerId } = req.query;
    const role = req.user.role?.toLowerCase();

    const filter = {};

    if (role === "employee") {
      filter.createdBy = req.user.userId;
    } else if (role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (search) {
      filter.title = {
        //regex is used to perform a case-insensitive search for deals whose title contains the search term.
        $regex: search,
        $options: "i",
      };
    }

    if (status) {
      const validStatuses = ["Open", "Won", "Lost"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid deal status",
        });
      }

      filter.status = status;
    }

    if (customerId) {
      filter.customer = customerId;
    }

    const deals = await Deal.find(filter)
      .populate("customer", "name email phone")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deals.length,
      deals,
    });
  } catch (error) {
    console.error("Get deals error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch deals",
      error: error.message,
    });
  }
};

// Get single deal details
const getDealById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role?.toLowerCase();

    const deal = await Deal.findById(id)
      .populate("customer", "name email phone")
      .populate("createdBy", "name email role");

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (
      role === "employee" &&
      deal.createdBy._id.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own deals",
      });
    }

    if (role !== "employee" && role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      deal,
    });
  } catch (error) {
    console.error("Get deal details error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch deal details",
      error: error.message,
    });
  }
};

// Update deal
const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, customerId, amount, cost, status } = req.body;
    const role = req.user.role?.toLowerCase();

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (role === "employee" && deal.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own deals",
      });
    }

    if (role !== "employee" && role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }

      deal.title = title.trim();
    }

    if (customerId !== undefined) {
      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      deal.customer = customer._id;
    }

    if (amount !== undefined) {
      const dealAmount = Number(amount);

      if (!Number.isFinite(dealAmount) || dealAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Amount must be a valid non-negative number",
        });
      }

      deal.amount = dealAmount;
    }

    if (cost !== undefined) {
      const dealCost = Number(cost);

      if (!Number.isFinite(dealCost) || dealCost < 0) {
        return res.status(400).json({
          success: false,
          message: "Cost must be a valid non-negative number",
        });
      }

      deal.cost = dealCost;
    }

    if (status !== undefined) {
      const validStatuses = ["Open", "Won", "Lost"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid deal status",
        });
      }

      deal.status = status;
    }

    await deal.save();

    const updatedDeal = await Deal.findById(deal._id)
      .populate("customer", "name email phone")
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Deal updated successfully",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Update deal error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update deal",
      error: error.message,
    });
  }
};

// Delete deal
const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role?.toLowerCase();

    const deal = await Deal.findById(id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (role === "employee" && deal.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own deals",
      });
    }

    if (role !== "employee" && role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Deal.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("Delete deal error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete deal",
      error: error.message,
    });
  }
};

// Get sales report
const getSalesReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const role = req.user.role?.toLowerCase();

    const filter = {};

    if (role === "employee") {
      filter.createdBy = req.user.userId;
    } else if (role !== "manager") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (month || year) {
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: "Both month and year are required",
        });
      }

      const monthNumber = Number(month);
      const yearNumber = Number(year);

      if (
        !Number.isInteger(monthNumber) ||
        monthNumber < 1 ||
        monthNumber > 12
      ) {
        return res.status(400).json({
          success: false,
          message: "Month must be between 1 and 12",
        });
      }

      if (!Number.isInteger(yearNumber) || yearNumber < 2000) {
        return res.status(400).json({
          success: false,
          message: "Invalid year",
        });
      }

      const startDate = new Date(yearNumber, monthNumber - 1, 1);
      const endDate = new Date(yearNumber, monthNumber, 1);

      filter.createdAt = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    const deals = await Deal.find(filter);

    const wonDeals = deals.filter((deal) => deal.status === "Won");
    const lostDeals = deals.filter((deal) => deal.status === "Lost");
    const openDeals = deals.filter((deal) => deal.status === "Open");

    const totalRevenue = wonDeals.reduce(
      (total, deal) => total + deal.amount,
      0,
    );

    const totalProfit = wonDeals.reduce(
      (total, deal) => total + (deal.amount - deal.cost),
      0,
    );

    const completedDeals = wonDeals.length + lostDeals.length;

    const conversionRate =
      completedDeals === 0 ? 0 : (wonDeals.length / completedDeals) * 100;

    res.status(200).json({
      success: true,
      report: {
        totalDeals: deals.length,
        totalRevenue,
        totalProfit,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        openDeals: openDeals.length,
        conversionRate: Number(conversionRate.toFixed(2)),
        period:
          month && year
            ? `${year}-${String(month).padStart(2, "0")}`
            : "All Time",
      },
    });
  } catch (error) {
    console.error("Sales report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: error.message,
    });
  }
};

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
  getSalesReport,
};
