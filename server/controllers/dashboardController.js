const Customer = require("../models/Customer");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Task = require("../models/Task");

const getDashboardSummary = async (req, res) => {
  try {
    const role = req.user.role?.toLowerCase();
    const userId = req.user.userId;

    if (role !== "manager" && role !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const customerFilter = role === "employee" ? { createdBy: userId } : {};

    const leadFilter =
      role === "employee"
        ? {
            $or: [
              { assignedTo: userId },
              { assignedTo: null, createdBy: userId },
            ],
          }
        : {};

    const dealFilter = role === "employee" ? { createdBy: userId } : {};

    const taskFilter = role === "employee" ? { assignedTo: userId } : {};

    const [
      totalCustomers,
      totalLeads,
      totalDeals,
      wonDeals,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      newLeads,
      contactedLeads,
      convertedLeads,
      lostLeads,
      openDeals,
      wonDealCount,
      lostDeals,
    ] = await Promise.all([
      Customer.countDocuments(customerFilter),
      Lead.countDocuments(leadFilter),
      Deal.countDocuments(dealFilter),

      Deal.find({
        ...dealFilter,
        status: "Won",
      }).select("amount cost createdAt"),

      Task.countDocuments({
        ...taskFilter,
        status: "Pending",
      }),
      Task.countDocuments({
        ...taskFilter,
        status: "In Progress",
      }),
      Task.countDocuments({
        ...taskFilter,
        status: "Completed",
      }),

      Lead.countDocuments({ ...leadFilter, stage: "New" }),
      Lead.countDocuments({ ...leadFilter, stage: "Contacted" }),
      Lead.countDocuments({ ...leadFilter, stage: "Converted" }),
      Lead.countDocuments({ ...leadFilter, stage: "Lost" }),

      Deal.countDocuments({
        ...dealFilter,
        status: "Open",
      }),
      Deal.countDocuments({
        ...dealFilter,
        status: "Won",
      }),
      Deal.countDocuments({
        ...dealFilter,
        status: "Lost",
      }),
    ]);

    const totalRevenue = wonDeals.reduce(
      (sum, deal) => sum + (Number(deal.amount) || 0),
      0,
    );

    const totalProfit = wonDeals.reduce(
      (sum, deal) =>
        sum + (Number(deal.amount) || 0) - (Number(deal.cost) || 0),
      0,
    );

    const monthlyMap = {};

    wonDeals.forEach((deal) => {
      const date = new Date(deal.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          _id: { year, month },
          revenue: 0,
          profit: 0,
        };
      }

      const amount = Number(deal.amount) || 0;
      const cost = Number(deal.cost) || 0;

      monthlyMap[key].revenue += amount;
      monthlyMap[key].profit += amount - cost;
    });

    const monthlyRevenue = Object.values(monthlyMap).sort(
      (a, b) => a._id.year - b._id.year || a._id.month - b._id.month,
    );

    const summary = {
      totalCustomers,
      totalLeads,
      totalDeals,
      totalRevenue,
      totalProfit,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      totalTasks: pendingTasks + inProgressTasks + completedTasks,

      leadsByStage: {
        New: newLeads,
        Contacted: contactedLeads,
        Converted: convertedLeads,
        Lost: lostLeads,
      },

      dealsByStatus: {
        Open: openDeals,
        Won: wonDealCount,
        Lost: lostDeals,
      },

      monthlyRevenue,
    };

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary",
      error: error.message,
    });
  }
};

module.exports = { getDashboardSummary };
