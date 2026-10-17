const Customer = require("../models/Customer");

// Validation
const isValidEmail = (email) => {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
};

// Add Customer
const addCustomer = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const existingCustomer = await Customer.findOne({
      email: cleanEmail,
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }

    const customer = await Customer.create({
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add customer",
      error: error.message,
    });
  }
};

// Get Customers
const getCustomers = async (req, res) => {
  try {
    let query = {};

    // Employee can only see their own customers
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customers = await Customer.find(query)
      .populate("createdBy", "name email role employeeId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    let query = { _id: id };

    // Employee can update only their own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (name !== undefined) {
      customer.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();

      if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }

      const existingCustomer = await Customer.findOne({
        email: normalizedEmail,
        _id: { $ne: id },
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Another customer already uses this email",
        });
      }

      customer.email = normalizedEmail;
    }

    if (phone !== undefined) {
      customer.phone = phone.trim();
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    let query = { _id: id };

    // Employee can delete only their own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOneAndDelete(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
};

// CUSTOMER ACTIVITIES

// Add Customer Activity
const addCustomerActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Activity type is required",
      });
    }

    let query = {
      _id: id,
    };

    // Employee can add activity only to own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.activities.push({
      type,
      description: description ? description.trim() : "",
      createdBy: req.user.userId,
    });

    await customer.save();

    const addedActivity = customer.activities[customer.activities.length - 1];

    res.status(201).json({
      success: true,
      message: "Customer activity added successfully",
      activity: addedActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add customer activity",
      error: error.message,
    });
  }
};

// Get Customer Activities
const getCustomerActivities = async (req, res) => {
  try {
    const { id } = req.params;

    let query = {
      _id: id,
    };

    // Employee can see activities only for own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query).populate(
      "activities.createdBy",
      "name email role employeeId",
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const activities = [...customer.activities].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer activities",
      error: error.message,
    });
  }
};

// Update Customer Activity
const updateCustomerActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;
    const { type, description } = req.body;

    let query = {
      _id: id,
    };

    // Employee can update activities only for own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const activity = customer.activities.id(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    if (type !== undefined) {
      activity.type = type;
    }

    if (description !== undefined) {
      activity.description = description.trim();
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer activity updated successfully",
      activity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update customer activity",
      error: error.message,
    });
  }
};

// Delete Customer Activity
const deleteCustomerActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;

    let query = {
      _id: id,
    };

    // Employee can delete activities only for own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const activity = customer.activities.id(activityId);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    activity.deleteOne();

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer activity deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete customer activity",
      error: error.message,
    });
  }
};

// CUSTOMER PURCHASES
// Add Customer Purchase
const addCustomerPurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { productName, quantity, price, purchaseDate } = req.body;

    if (!productName || quantity === undefined || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product name, quantity and price are required",
      });
    }

    if (Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    let query = {
      _id: id,
    };

    // Employee can add purchase only to own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const purchase = {
      productName: productName.trim(),
      quantity: Number(quantity),
      price: Number(price),
    };

    if (purchaseDate) {
      purchase.purchaseDate = purchaseDate;
    }

    customer.purchases.push(purchase);

    await customer.save();

    const addedPurchase = customer.purchases[customer.purchases.length - 1];

    res.status(201).json({
      success: true,
      message: "Customer purchase added successfully",
      purchase: addedPurchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add customer purchase",
      error: error.message,
    });
  }
};

// Get Customer Purchases
const getCustomerPurchases = async (req, res) => {
  try {
    const { id } = req.params;

    let query = {
      _id: id,
    };

    // Employee can see purchases only for own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const purchases = [...customer.purchases].sort(
      (a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate),
    );

    res.status(200).json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer purchases",
      error: error.message,
    });
  }
};

// Update Customer Purchase
const updateCustomerPurchase = async (req, res) => {
  try {
    const { id, purchaseId } = req.params;
    const { productName, quantity, price, purchaseDate } = req.body;

    let query = {
      _id: id,
    };

    // Employee can update purchases only for own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const purchase = customer.purchases.id(purchaseId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (productName !== undefined) {
      if (!productName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Product name cannot be empty",
        });
      }

      purchase.productName = productName.trim();
    }

    if (quantity !== undefined) {
      if (Number(quantity) < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be at least 1",
        });
      }

      purchase.quantity = Number(quantity);
    }

    if (price !== undefined) {
      if (Number(price) < 0) {
        return res.status(400).json({
          success: false,
          message: "Price cannot be negative",
        });
      }

      purchase.price = Number(price);
    }

    if (purchaseDate !== undefined && purchaseDate !== "") {
      purchase.purchaseDate = purchaseDate;
    }

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer purchase updated successfully",
      purchase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update customer purchase",
      error: error.message,
    });
  }
};

// Delete Customer Purchase
const deleteCustomerPurchase = async (req, res) => {
  try {
    const { id, purchaseId } = req.params;

    let query = {
      _id: id,
    };

    // Employee can delete purchases only for own customer
    if (req.user.role === "employee") {
      query.createdBy = req.user.userId;
    }

    const customer = await Customer.findOne(query);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const purchase = customer.purchases.id(purchaseId);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    purchase.deleteOne();

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Customer purchase deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete customer purchase",
      error: error.message,
    });
  }
};

// Exports
module.exports = {
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
};
