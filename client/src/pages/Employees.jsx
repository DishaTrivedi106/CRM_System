import React, { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Employees.css";

const Employees = () => {
  //[] use for to store the employees data and search term for filtering employees
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [performance, setPerformance] = useState([]);
  const [performanceSearchTerm, setPerformanceSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isManager = user?.role === "manager";

  const fetchEmployees = async () => {
    try {
      setError("");

      const response = await API.get("/employees");

      setEmployees(response.data.employees || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch employees");
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await API.get("/employees/performance");

      setPerformance(response.data.performance || []);
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch employee performance",
      );
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchEmployees();
      fetchPerformance();
    }
  }, [isManager]);

  const showSuccessMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // Handle form input changes for adding a new employee
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission for adding a new employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await API.post("/employees", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      showSuccessMessage(
        response.data.message || "Employee added successfully",
      );

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      await fetchEmployees();
      await fetchPerformance();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add employee");
    }
  };

  // Handle edit button click to populate the edit form with employee data
  const handleEditClick = (employee) => {
    setError("");
    setMessage("");

    setEditEmployeeId(employee.employeeId);

    setEditFormData({
      name: employee.name || "",
      email: employee.email || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission for updating an existing employee
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await API.put(`/employees/${editEmployeeId}`, {
        name: editFormData.name,
        email: editFormData.email,
      });

      showSuccessMessage(
        response.data.message || "Employee updated successfully",
      );

      setEditEmployeeId(null);

      setEditFormData({
        name: "",
        email: "",
      });

      await fetchEmployees();
      await fetchPerformance();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update employee");
    }
  };

  // Handle toggling the active status of an employee
  const handleToggleStatus = async (employee) => {
    const action = employee.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${employee.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      // Send a PUT request to toggle the employee's active status
      const response = await API.put(`/employees/${employee.employeeId}`, {
        isActive: !employee.isActive,
      });

      showSuccessMessage(
        response.data.message || `Employee ${action}d successfully`,
      );

      await fetchEmployees();
      await fetchPerformance();
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${action} employee`);
    }
  };

  // Handle deleting an employee
  const handleDeleteEmployee = async (employee) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${employee.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await API.delete(`/employees/${employee.employeeId}`);

      showSuccessMessage(
        response.data.message || "Employee deleted successfully",
      );

      if (editEmployeeId === employee.employeeId) {
        setEditEmployeeId(null);

        setEditFormData({
          name: "",
          email: "",
        });
      }

      await fetchEmployees();
      await fetchPerformance();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return true;
    }

    // Filter employees based on name, email, or employee ID matching the search term
    return (
      employee.name?.toLowerCase().includes(search) ||
      employee.email?.toLowerCase().includes(search) ||
      employee.employeeId?.toLowerCase().includes(search)
    );
  });

  const filteredPerformance = performance.filter((employee) => {
    const search = performanceSearchTerm.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      employee.name?.toLowerCase().includes(search) ||
      employee.email?.toLowerCase().includes(search) ||
      employee.employeeId?.toLowerCase().includes(search)
    );
  });

  if (!isManager) {
    return (
      <Layout>
        <div className="employees-page">
          <div className="access-denied">
            <h1>Employee Management</h1>
            <p>Only managers can access employee management.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="employees-page">
        <div className="page-header">
          <div>
            <h1>Employee Management</h1>
            <p>Manage employees and their account status</p>
          </div>

          <div className="employee-count">
            <span>{employees.length}</span>
            <small>Total Employees</small>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <section className="employee-section">
          <div className="section-title">
            <h2>Add Employee</h2>
            <p>Create a new employee account</p>
          </div>

          <form className="employee-form" onSubmit={handleAddEmployee}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter employee email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter temporary password"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                Add Employee
              </button>
            </div>
          </form>
        </section>

        <section className="employee-section">
          <div className="employee-list-header">
            <div className="section-title">
              <h2>Employees</h2>
              <p>View and manage all employees</p>
            </div>

            <div className="employee-search">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <h3>No employees found</h3>
              <p>
                {searchTerm
                  ? "No employees match your search."
                  : "There are currently no employees."}
              </p>
            </div>
          ) : (
            <div className="employee-grid">
              {filteredEmployees.map((employee) => (
                <div className="employee-card" key={employee._id}>
                  <div className="employee-card-header">
                    <div>
                      <h3>{employee.name}</h3>
                      <p>{employee.email}</p>
                    </div>

                    <span
                      className={`employee-status ${
                        employee.isActive ? "active" : "inactive"
                      }`}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="employee-details">
                    <div>
                      <span>Employee ID</span>
                      <strong>{employee.employeeId}</strong>
                    </div>

                    <div>
                      <span>Role</span>
                      <strong>{employee.role}</strong>
                    </div>
                  </div>

                  <div className="employee-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditClick(employee)}
                    >
                      Edit
                    </button>

                    <button
                      className={
                        employee.isActive
                          ? "deactivate-button"
                          : "activate-button"
                      }
                      onClick={() => handleToggleStatus(employee)}
                    >
                      {employee.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      className="delete-button"
                      onClick={() => handleDeleteEmployee(employee)}
                    >
                      Delete
                    </button>
                  </div>

                  {editEmployeeId === employee.employeeId && (
                    <div className="edit-employee-box">
                      <h3>Edit Employee</h3>

                      <form onSubmit={handleUpdateEmployee}>
                        <div className="form-group">
                          <label>Name</label>
                          <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={editFormData.email}
                            onChange={handleEditChange}
                            required
                          />
                        </div>

                        <div className="employee-actions">
                          <button type="submit" className="primary-button">
                            Update Employee
                          </button>

                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() => setEditEmployeeId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="employee-section">
          <div className="performance-header">
            <div className="section-title">
              <h2>Employee Performance</h2>
              <p>Track leads and task performance</p>
            </div>

            <div className="performance-search">
              <input
                type="text"
                placeholder="Search employees..."
                value={performanceSearchTerm}
                onChange={(e) => setPerformanceSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {performance.length === 0 ? (
            <div className="empty-state">
              <h3>No performance data</h3>
              <p>There are currently no employees to display.</p>
            </div>
          ) : filteredPerformance.length === 0 ? (
            <div className="empty-state">
              <h3>No employees found</h3>
              <p>No employee matches your search.</p>
            </div>
          ) : (
            <div className="performance-table-wrapper">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Leads Handled</th>
                    <th>Tasks Assigned</th>
                    <th>Tasks Completed</th>
                    <th>Pending Tasks</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPerformance.map((employee) => (
                    <tr key={employee.employeeId}>
                      <td>
                        <strong>{employee.name}</strong>
                        <span>{employee.email}</span>
                      </td>

                      <td>{employee.employeeId}</td>
                      <td>{employee.leadsHandled}</td>
                      <td>{employee.tasksAssigned}</td>
                      <td>{employee.tasksCompleted}</td>
                      <td>{employee.pendingTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Employees;
