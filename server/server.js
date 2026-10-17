const express = require("express");
//load environmental variables
const dotenv = require("dotenv");
//cross origin resource sharing
const cors = require("cors");

const connectDB = require("./config/db");

//instead of writing all the routes in this file, we will create separate route files for each resource and import them here
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const leadRoutes = require("./routes/leadRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dealRoutes = require("./routes/dealRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const protect = require("./middleware/authMiddleware");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Protected test route
//shows that the user is authorized to access this route if they have a valid token
app.get("/api/protected", protect, (req, res) => {
  res.json({
    success: true,
    message: "You are authorized!",
    user: req.user,
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("CRM Backend is running!");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
