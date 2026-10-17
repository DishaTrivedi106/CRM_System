const express = require("express");

const {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,

  addCustomerActivity,
  getCustomerActivities,
  updateCustomerActivity,
  deleteCustomerActivity,

  addCustomerPurchase,
  getCustomerPurchases,
  updateCustomerPurchase,
  deleteCustomerPurchase,
} = require("../controllers/customerController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CUSTOMER ROUTES
// Add customer
router.post("/", protect, addCustomer);

// Get customers
router.get("/", protect, getCustomers);

// Update customer
router.put("/:id", protect, updateCustomer);

// Delete customer
router.delete("/:id", protect, deleteCustomer);

// CUSTOMER ACTIVITY ROUTES
// Add activity
router.post("/:id/activities", protect, addCustomerActivity);

// Get activities
router.get("/:id/activities", protect, getCustomerActivities);

// Update activity
router.put("/:id/activities/:activityId", protect, updateCustomerActivity);

// Delete activity
router.delete("/:id/activities/:activityId", protect, deleteCustomerActivity);

// CUSTOMER PURCHASE ROUTES
// Add purchase
router.post("/:id/purchases", protect, addCustomerPurchase);

// Get purchases
router.get("/:id/purchases", protect, getCustomerPurchases);

// Update purchase
router.put("/:id/purchases/:purchaseId", protect, updateCustomerPurchase);

// Delete purchase
router.delete("/:id/purchases/:purchaseId", protect, deleteCustomerPurchase);

module.exports = router;
