const mongoose = require("mongoose");

// Customer Activity Schema

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Created", "Updated", "Call", "Meeting", "Email", "Note"],
      required: true,
    },

    description: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Customer Purchase Schema

const purchaseSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

// Customer Schema

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Customer activity history
    activities: [activitySchema],

    // Customer purchase history
    purchases: [purchaseSchema],
  },
  {
    timestamps: true,
  },
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
