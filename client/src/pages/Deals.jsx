import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Deals.css";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    cost: "",
  });

  const [customerMode, setCustomerMode] = useState("existing");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [editingDeal, setEditingDeal] = useState(null);

  const [editFormData, setEditFormData] = useState({
    title: "",
    amount: "",
    cost: "",
  });

  const [selectedDeal, setSelectedDeal] = useState(null);

  const [report, setReport] = useState(null);
  const [reportMonth, setReportMonth] = useState("");
  const [reportYear, setReportYear] = useState("");

  const showSuccessMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const fetchCustomers = async () => {
    try {
      const response = await API.get("/customers");
      setCustomers(response.data.customers || response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load customers");
    }
  };

  //showLoader is used to determine whether to show the loading state or not. This is useful when we want to fetch deals without showing the loader,
  const fetchDeals = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await API.get("/deals");
      setDeals(response.data.deals || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load deals");
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const fetchReport = async () => {
    try {
      const params = {};

      if (reportMonth && reportYear) {
        params.month = reportMonth;
        params.year = reportYear;
      }

      const response = await API.get("/deals/report", { params });
      setReport(response.data.report);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load sales report");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchDeals(true);
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportMonth, reportYear]);

  const filteredDeals = deals.filter((deal) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      deal.title?.toLowerCase().includes(searchText) ||
      deal.customer?.name?.toLowerCase().includes(searchText) ||
      deal.customer?.email?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "All" || deal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredCustomers = customers.filter((customer) => {
    const searchText = customerSearch.trim();

    if (!searchText) return false;

    const phone = customer.phone?.toString().replace(/\D/g, "") || "";

    return phone.includes(searchText);
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;

    setNewCustomer((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const resetAddDealForm = () => {
    setFormData({
      title: "",
      amount: "",
      cost: "",
    });

    setCustomerMode("existing");
    setCustomerSearch("");
    setSelectedCustomer(null);
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!formData.title.trim()) {
      setError("Deal title is required");
      return;
    }

    if (customerMode === "existing" && !selectedCustomer) {
      setError("Please search and select a customer");
      return;
    }

    if (customerMode === "new") {
      if (!newCustomer.name.trim()) {
        setError("Customer name is required");
        return;
      }

      if (!newCustomer.email.trim()) {
        setError("Customer email is required");
        return;
      }

      if (!newCustomer.phone.trim()) {
        setError("Customer phone is required");
        return;
      }
    }

    if (formData.amount === "") {
      setError("Amount is required");
      return;
    }

    if (
      !Number.isFinite(Number(formData.amount)) ||
      Number(formData.amount) < 0
    ) {
      setError("Amount must be a valid non-negative number");
      return;
    }

    if (
      formData.cost !== "" &&
      (!Number.isFinite(Number(formData.cost)) || Number(formData.cost) < 0)
    ) {
      setError("Cost must be a valid non-negative number");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: formData.title.trim(),
        amount: Number(formData.amount),
        cost: formData.cost === "" ? 0 : Number(formData.cost),
      };

      if (customerMode === "existing") {
        payload.customerId = selectedCustomer._id;
      } else {
        payload.newCustomer = {
          name: newCustomer.name.trim(),
          email: newCustomer.email.trim(),
          phone: newCustomer.phone.trim(),
        };
      }

      await API.post("/deals", payload);

      resetAddDealForm();
      showSuccessMessage("Deal created successfully");

      await fetchCustomers();
      await fetchDeals();
      await fetchReport();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create deal");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (deal) => {
    setEditingDeal(deal);

    setEditFormData({
      title: deal.title || "",
      amount: deal.amount ?? "",
      cost: deal.cost ?? 0,
    });

    setError("");
    setMessage("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!editFormData.title.trim()) {
      setError("Deal title is required");
      return;
    }

    if (editFormData.amount === "") {
      setError("Amount is required");
      return;
    }

    if (
      !Number.isFinite(Number(editFormData.amount)) ||
      Number(editFormData.amount) < 0
    ) {
      setError("Amount must be a valid non-negative number");
      return;
    }

    if (
      editFormData.cost !== "" &&
      (!Number.isFinite(Number(editFormData.cost)) ||
        Number(editFormData.cost) < 0)
    ) {
      setError("Cost must be a valid non-negative number");
      return;
    }

    try {
      setSaving(true);

      await API.put(`/deals/${editingDeal._id}`, {
        title: editFormData.title.trim(),
        amount: Number(editFormData.amount),
        cost: editFormData.cost === "" ? 0 : Number(editFormData.cost),
      });

      setEditingDeal(null);
      showSuccessMessage("Deal updated successfully");

      await fetchDeals();
      await fetchReport();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update deal");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dealId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this deal?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await API.delete(`/deals/${dealId}`);

      showSuccessMessage("Deal deleted successfully");

      await fetchDeals();
      await fetchReport();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete deal");
    }
  };

  const handleStatusChange = async (deal, status) => {
    try {
      setError("");
      setMessage("");

      await API.put(`/deals/${deal._id}`, { status });

      showSuccessMessage("Deal status updated successfully");

      await fetchDeals();
      await fetchReport();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update deal status");
    }
  };

  const openDetails = async (dealId) => {
    try {
      setError("");

      const response = await API.get(`/deals/${dealId}`);
      setSelectedDeal(response.data.deal);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load deal details");
    }
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Sales</h1>
          <p>Manage deals and sales performance.</p>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <div className="form-section">
        <h2>Add Deal</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Deal Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter deal title"
              />
            </div>

            <div className="form-field">
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="Enter amount"
                min="0"
              />
            </div>

            <div className="form-field">
              <label>Cost</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                placeholder="Enter cost"
                min="0"
              />
            </div>
          </div>

          <div className="form-field">
            <label>Customer</label>

            <div className="form-buttons">
              <button
                type="button"
                className={
                  customerMode === "existing"
                    ? "primary-button"
                    : "secondary-button"
                }
                onClick={() => {
                  setCustomerMode("existing");
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                  setError("");
                }}
              >
                Existing Customer
              </button>

              <button
                type="button"
                className={
                  customerMode === "new" ? "primary-button" : "secondary-button"
                }
                onClick={() => {
                  setCustomerMode("new");
                  setSelectedCustomer(null);
                  setCustomerSearch("");
                  setError("");
                }}
              >
                New Customer
              </button>
            </div>
          </div>

          {customerMode === "existing" ? (
            <div className="form-field">
              {selectedCustomer ? (
                <div>
                  <p>
                    <strong>Selected Customer:</strong> {selectedCustomer.name}{" "}
                    ({selectedCustomer.email})
                  </p>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearch("");
                    }}
                  >
                    Change Customer
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="tel"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    placeholder="Search by phone number"
                  />

                  {customerSearch.trim() !== "" && (
                    <div className="customer-search-results">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <button
                            type="button"
                            key={customer._id}
                            className="customer-search-result"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setCustomerSearch("");
                              setError("");
                            }}
                          >
                            <strong>{customer.name}</strong>
                            <span>{customer.email}</span>
                            <span>{customer.phone}</span>
                          </button>
                        ))
                      ) : (
                        <p>No matching customers found.</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="form-row">
              <div className="form-field">
                <label>Customer Name</label>
                <input
                  type="text"
                  name="name"
                  value={newCustomer.name}
                  onChange={handleNewCustomerChange}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="form-field">
                <label>Customer Email</label>
                <input
                  type="email"
                  name="email"
                  value={newCustomer.email}
                  onChange={handleNewCustomerChange}
                  placeholder="Enter customer email"
                />
              </div>

              <div className="form-field">
                <label>Customer Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleNewCustomerChange}
                  placeholder="Enter customer phone"
                />
              </div>
            </div>
          )}

          <div className="form-buttons">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Add Deal"}
            </button>
          </div>
        </form>
      </div>

      <div className="list-section">
        <h2>Sales Report</h2>

        <div className="form-row">
          <div className="form-field">
            <label>Month</label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div className="form-field">
            <label>Year</label>
            <input
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
              placeholder="Example: 2026"
              min="2000"
            />
          </div>
        </div>

        {report && (
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Total Deals</h3>
              <p>{report.totalDeals}</p>
            </div>

            <div className="dashboard-card">
              <h3>Revenue</h3>
              <p>{formatCurrency(report.totalRevenue)}</p>
            </div>

            <div className="dashboard-card">
              <h3>Profit</h3>
              <p>{formatCurrency(report.totalProfit)}</p>
            </div>

            <div className="dashboard-card">
              <h3>Won Deals</h3>
              <p>{report.wonDeals}</p>
            </div>

            <div className="dashboard-card">
              <h3>Lost Deals</h3>
              <p>{report.lostDeals}</p>
            </div>

            <div className="dashboard-card">
              <h3>Conversion Rate</h3>
              <p>{report.conversionRate}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="list-section">
        <div className="list-header">
          <h2>Deal List</h2>

          <div className="lead-list-controls">
            <input
              type="text"
              className="search-input"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>

        <p className="total-leads">
          Showing {filteredDeals.length} of {deals.length} deals
        </p>

        {loading ? (
          <p>Loading deals...</p>
        ) : filteredDeals.length === 0 ? (
          <p>No deals found.</p>
        ) : (
          <div className="lead-table-wrapper">
            <table className="lead-data-table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Cost</th>
                  <th>Profit</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal._id}>
                    <td>{deal.title}</td>
                    <td>{deal.customer?.name || "Unknown"}</td>
                    <td>{formatCurrency(deal.amount)}</td>
                    <td>{formatCurrency(deal.cost)}</td>
                    <td>{formatCurrency(deal.amount - deal.cost)}</td>

                    <td>
                      <select
                        value={deal.status}
                        onChange={(e) =>
                          handleStatusChange(deal, e.target.value)
                        }
                      >
                        <option value="Open">Open</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>

                    <td>{deal.createdBy?.name || "Unknown"}</td>

                    <td>
                      <div className="lead-action-buttons">
                        <button
                          className="primary-button"
                          onClick={() => openDetails(deal._id)}
                        >
                          Details
                        </button>

                        <button
                          className="edit-button"
                          onClick={() => openEditModal(deal)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDelete(deal._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingDeal && (
        <div className="lead-modal-overlay">
          <div className="lead-modal-card">
            <h3>Edit Deal</h3>

            <form onSubmit={handleEditSubmit}>
              <div className="form-field">
                <label>Deal Title</label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditChange}
                />
              </div>

              <div className="form-field">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={editFormData.amount}
                  onChange={handleEditChange}
                  min="0"
                />
              </div>

              <div className="form-field">
                <label>Cost</label>
                <input
                  type="number"
                  name="cost"
                  value={editFormData.cost}
                  onChange={handleEditChange}
                  min="0"
                />
              </div>

              {error && <p className="error">{error}</p>}

              <div className="form-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingDeal(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Deal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDeal && (
        <div className="lead-modal-overlay">
          <div className="lead-modal-card">
            <h3>Deal Details</h3>

            <p>
              <strong>Title:</strong> {selectedDeal.title}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {selectedDeal.customer?.name || "Unknown"}
            </p>

            <p>
              <strong>Email:</strong> {selectedDeal.customer?.email || "N/A"}
            </p>

            <p>
              <strong>Phone:</strong> {selectedDeal.customer?.phone || "N/A"}
            </p>

            <p>
              <strong>Amount:</strong> {formatCurrency(selectedDeal.amount)}
            </p>

            <p>
              <strong>Cost:</strong> {formatCurrency(selectedDeal.cost)}
            </p>

            <p>
              <strong>Profit:</strong>{" "}
              {formatCurrency(selectedDeal.amount - selectedDeal.cost)}
            </p>

            <p>
              <strong>Status:</strong> {selectedDeal.status}
            </p>

            <p>
              <strong>Created By:</strong>{" "}
              {selectedDeal.createdBy?.name || "Unknown"}
            </p>

            <p>
              <strong>Created At:</strong>{" "}
              {selectedDeal.createdAt
                ? new Date(selectedDeal.createdAt).toLocaleString()
                : "N/A"}
            </p>

            <div className="form-buttons">
              <button
                className="secondary-button"
                onClick={() => setSelectedDeal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Deals;
