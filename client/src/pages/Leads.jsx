import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";

function Leads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [assigningLead, setAssigningLead] = useState(null);
  const [employeeId, setEmployeeId] = useState("");

  const [stageHistoryLead, setStageHistoryLead] = useState(null);

  const [editingLead, setEditingLead] = useState(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [editValidationErrors, setEditValidationErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const isManager = user?.role === "manager";

  const showSuccessMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // ==============================
  // FETCH LEADS
  // ==============================

  const fetchLeads = async () => {
    try {
      const response = await API.get("/leads");

      setLeads(response.data.leads || response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ==============================
  // LEAD INPUT
  // ==============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setValidationErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setError("");
  };

  // ==============================
  // LEAD VALIDATION
  // ==============================

  const validateLeadData = (data) => {
    const errors = {
      name: "",
      email: "",
      phone: "",
    };

    const name = data.name.trim();
    const email = data.email.trim();
    const phone = data.phone.trim();

    if (!name) {
      errors.name = "Name is required";
    } else if (!/^[A-Za-z ]{2,50}$/.test(name)) {
      errors.name =
        "Name must contain only letters and spaces and must be 2-50 characters long";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    if (!phone) {
      errors.phone = "Phone is required";
    } else if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      errors.phone = "Please enter a valid phone number";
    }

    return errors;
  };

  const validateForm = () => {
    const errors = validateLeadData(formData);

    setValidationErrors(errors);

    return !errors.name && !errors.email && !errors.phone;
  };

  // ADD LEAD
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const leadData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
      };

      await API.post("/leads", leadData);

      showSuccessMessage("Lead added successfully");

      setFormData({
        name: "",
        email: "",
        phone: "",
      });

      setValidationErrors({
        name: "",
        email: "",
        phone: "",
      });

      await fetchLeads();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add lead");
    } finally {
      setSaving(false);
    }
  };

  // OPEN EDIT LEAD
  const openEditModal = (lead) => {
    setEditingLead(lead);

    setEditFormData({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
    });

    setEditValidationErrors({
      name: "",
      email: "",
      phone: "",
    });

    setError("");
    setMessage("");
  };

  // EDIT INPUT
  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setEditValidationErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setError("");
  };

  // UPDATE LEAD
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const errors = validateLeadData(editFormData);

    setEditValidationErrors(errors);

    if (errors.name || errors.email || errors.phone) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await API.put(`/leads/${editingLead._id}`, {
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim(),
      });

      setEditingLead(null);

      setEditFormData({
        name: "",
        email: "",
        phone: "",
      });

      showSuccessMessage("Lead updated successfully");

      await fetchLeads();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  // UPDATE LEAD STAGE
  const handleStageChange = async (leadId, stage) => {
    try {
      setError("");
      setMessage("");

      await API.put(`/leads/${leadId}/stage`, {
        stage,
      });

      showSuccessMessage("Lead stage updated successfully");

      await fetchLeads();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update lead stage");

      await fetchLeads();
    }
  };

  // OPEN ASSIGN MODAL
  const openAssignModal = (lead) => {
    setAssigningLead(lead);
    setEmployeeId("");

    setError("");
    setMessage("");
  };

  // ASSIGN LEAD
  const handleAssign = async () => {
    if (!employeeId.trim()) {
      setError("Employee ID is required");
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.put(`/leads/${assigningLead._id}/assign`, {
        employeeId: employeeId.trim(),
      });

      setAssigningLead(null);
      setEmployeeId("");

      showSuccessMessage("Lead assigned successfully");

      await fetchLeads();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to assign lead");
    }
  };

  // CONVERT LEAD
  const handleConvert = async (leadId) => {
    const confirmed = window.confirm(
      "Are you sure you want to convert this lead into a customer?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.put(`/leads/${leadId}/convert`);

      showSuccessMessage("Lead converted to customer successfully");

      await fetchLeads();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to convert lead");
    }
  };

  // DELETE LEAD
  const handleDelete = async (leadId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.delete(`/leads/${leadId}`);

      showSuccessMessage("Lead deleted successfully");

      await fetchLeads();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete lead");
    }
  };

  // FILTER LEADS
  const filteredLeads = leads.filter((lead) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      lead.name?.toLowerCase().includes(searchText) ||
      lead.email?.toLowerCase().includes(searchText) ||
      lead.phone?.toLowerCase().includes(searchText);

    const matchesStage = stageFilter === "All" || lead.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Leads</h1>
          <p>Manage, assign and convert leads.</p>
        </div>
      </div>

      {/* ADD LEAD */}
      <div className="form-section">
        <h2>Add Lead</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Name</label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter lead name"
                required
              />

              {validationErrors.name && (
                <p className="error">{validationErrors.name}</p>
              )}
            </div>

            <div className="form-field">
              <label>Email</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter lead email"
                required
              />

              {validationErrors.email && (
                <p className="error">{validationErrors.email}</p>
              )}
            </div>

            <div className="form-field">
              <label>Phone</label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />

              {validationErrors.phone && (
                <p className="error">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Add Lead"}
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}

        {message && <p className="success">{message}</p>}
      </div>

      {/* LEAD LIST */}
      <div className="list-section">
        <div className="list-header">
          <h2>Lead List</h2>

          <div className="lead-list-controls">
            <span className="total-leads">Total Leads: {leads.length}</span>

            <input
              type="text"
              className="search-input"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Lost">Lost</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading leads...</p>
        ) : filteredLeads.length === 0 ? (
          <p>No leads found.</p>
        ) : (
          <table className="lead-data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Stage</th>
                <th>Assigned To</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead._id}>
                  <td>{lead.name}</td>

                  <td>{lead.email}</td>

                  <td>{lead.phone}</td>

                  <td>
                    {lead.stage === "Converted" ? (
                      <span className="lead-status-badge">Converted</span>
                    ) : (
                      <select
                        value={lead.stage}
                        onChange={(e) =>
                          handleStageChange(lead._id, e.target.value)
                        }
                      >
                        {lead.stage === "New" && (
                          <>
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Lost">Lost</option>
                          </>
                        )}

                        {lead.stage === "Contacted" && (
                          <>
                            <option value="Contacted">Contacted</option>
                            <option value="New">New</option>
                            <option value="Lost">Lost</option>
                          </>
                        )}

                        {lead.stage === "Lost" && (
                          <>
                            <option value="Lost">Lost</option>
                            <option value="Contacted">Contacted</option>
                          </>
                        )}
                      </select>
                    )}
                  </td>

                  <td>
                    {lead.assignedTo ? (
                      <>
                        {lead.assignedTo.name}
                        <br />
                        <small>{lead.assignedTo.employeeId}</small>
                      </>
                    ) : (
                      "Not Assigned"
                    )}
                  </td>

                  <td>{lead.createdBy?.name || "Unknown"}</td>

                  <td>
                    <div className="lead-action-buttons">
                      <button
                        className="primary-button"
                        onClick={() => setStageHistoryLead(lead)}
                      >
                        History
                      </button>

                      {/* EDIT */}
                      <button
                        className="edit-button"
                        onClick={() => openEditModal(lead)}
                      >
                        Edit
                      </button>

                      {/* ASSIGN */}
                      {isManager && lead.stage !== "Converted" && (
                        <button
                          className="primary-button"
                          onClick={() => openAssignModal(lead)}
                        >
                          Assign
                        </button>
                      )}

                      {/* CONVERT */}
                      {lead.stage !== "Converted" && lead.stage !== "Lost" && (
                        <button
                          className="primary-button"
                          onClick={() => handleConvert(lead._id)}
                        >
                          Convert
                        </button>
                      )}

                      {/* DELETE */}
                      {isManager && (
                        <button
                          className="delete-button"
                          onClick={() => handleDelete(lead._id)}
                        >
                          Delete
                        </button>
                      )}

                      {lead.stage === "Converted" && (
                        <span className="lead-converted-text">
                          Customer Created
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* EDIT LEAD MODAL */}
      {editingLead && (
        <div className="lead-modal-overlay">
          <div className="lead-modal-card">
            <h3>Edit Lead</h3>

            <form onSubmit={handleEditSubmit}>
              <div className="form-field">
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  placeholder="Enter lead name"
                />

                {editValidationErrors.name && (
                  <p className="error">{editValidationErrors.name}</p>
                )}
              </div>

              <div className="form-field">
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  placeholder="Enter lead email"
                />

                {editValidationErrors.email && (
                  <p className="error">{editValidationErrors.email}</p>
                )}
              </div>

              <div className="form-field">
                <label>Phone</label>

                <input
                  type="text"
                  name="phone"
                  value={editFormData.phone}
                  onChange={handleEditChange}
                  placeholder="Enter phone number"
                />

                {editValidationErrors.phone && (
                  <p className="error">{editValidationErrors.phone}</p>
                )}
              </div>

              {error && <p className="error">{error}</p>}

              <div className="form-buttons">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingLead(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {assigningLead && (
        <div className="lead-modal-overlay">
          <div className="lead-modal-card">
            <h3>Assign Lead</h3>

            <p>
              Assign <strong>{assigningLead.name}</strong> to an employee.
            </p>

            <div className="form-field">
              <label>Employee ID</label>

              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Example: EMP001"
              />
            </div>

            {error && <p className="error">{error}</p>}
            <div className="form-buttons">
              <button
                className="secondary-button"
                onClick={() => setAssigningLead(null)}
              >
                Cancel
              </button>

              <button className="primary-button" onClick={handleAssign}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE HISTORY MODAL */}
      {stageHistoryLead && (
        <div className="lead-modal-overlay">
          <div className="lead-modal-card">
            <h3>Stage History</h3>

            <p>
              <strong>{stageHistoryLead.name}</strong>
            </p>

            <div className="lead-history-list">
              {stageHistoryLead.stageHistory?.map((history, index) => (
                <div className="lead-history-item" key={index}>
                  <strong>{history.stage}</strong>

                  <span>
                    Changed by: {history.changedBy?.name || "Unknown user"}
                  </span>

                  <small>
                    {history.changedAt
                      ? new Date(history.changedAt).toLocaleString()
                      : ""}
                  </small>
                </div>
              ))}
            </div>

            <div className="form-buttons">
              <button
                className="secondary-button"
                onClick={() => setStageHistoryLead(null)}
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

export default Leads;
