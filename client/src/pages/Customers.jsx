import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Cutomers.css";

function Customers() {
  // CUSTOMER STATE
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // CUSTOMER DETAILS STATE
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [activities, setActivities] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [detailsLoading, setDetailsLoading] = useState(false);

  // PURCHASE STATE
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);

  const [purchaseForm, setPurchaseForm] = useState({
    productName: "",
    quantity: 1,
    price: "",
  });

  const [purchaseSaving, setPurchaseSaving] = useState(false);

  // ACTIVITY STATE
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState(null);

  const [activityForm, setActivityForm] = useState({
    type: "Call",
    description: "",
  });

  const [activitySaving, setActivitySaving] = useState(false);

  // GENERAL STATE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
  });

  // COMMON MESSAGE FUNCTIONS
  const showSuccessMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  // FETCH CUSTOMERS
  const fetchCustomers = async () => {
    try {
      const response = await API.get("/customers");

      setCustomers(response.data.customers || response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // CUSTOMER INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "name" || name === "email") {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setError("");
  };

  // CUSTOMER VALIDATION
  const validateForm = () => {
    const errors = {
      name: "",
      email: "",
    };

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (name && !/^[A-Za-z ]{2,50}$/.test(name)) {
      errors.name =
        "Name must contain only letters and spaces and must be 2-50 characters long";
    }

    if (
      email &&
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
    ) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);

    return !errors.name && !errors.email;
  };

  // ADD / UPDATE CUSTOMER
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const customerData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      if (editingId) {
        await API.put(`/customers/${editingId}`, customerData);

        showSuccessMessage("Customer updated successfully");
      } else {
        await API.post("/customers", customerData);

        showSuccessMessage("Customer added successfully");
      }

      setFormData({
        name: "",
        email: "",
        phone: "",
      });

      setValidationErrors({
        name: "",
        email: "",
      });

      setEditingId(null);
      setShowCustomerModal(false);

      await fetchCustomers();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  // EDIT CUSTOMER
  const handleEdit = (customer) => {
    setEditingId(customer._id);

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
    });

    setValidationErrors({
      name: "",
      email: "",
    });

    setError("");
    setMessage("");
    setShowCustomerModal(true);
  };

  // DELETE CUSTOMER
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.delete(`/customers/${id}`);

      if (selectedCustomer?._id === id) {
        setSelectedCustomer(null);
        setActivities([]);
        setPurchases([]);
      }

      showSuccessMessage("Customer deleted successfully");

      await fetchCustomers();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete customer");
    }
  };

  // CANCEL CUSTOMER EDIT
  const handleCancel = () => {
    setEditingId(null);
    setShowCustomerModal(false);

    setFormData({
      name: "",
      email: "",
      phone: "",
    });

    setValidationErrors({
      name: "",
      email: "",
    });

    setError("");
    setMessage("");
  };

  // FETCH CUSTOMER DETAILS
  const fetchCustomerDetails = async (customerId) => {
    try {
      setDetailsLoading(true);
      setError("");

      const [activitiesResponse, purchasesResponse] = await Promise.all([
        API.get(`/customers/${customerId}/activities`),
        API.get(`/customers/${customerId}/purchases`),
      ]);

      setActivities(
        activitiesResponse.data.activities ||
          activitiesResponse.data.data ||
          [],
      );

      setPurchases(
        purchasesResponse.data.purchases || purchasesResponse.data.data || [],
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to load customer details",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // VIEW CUSTOMER
  const handleViewCustomer = async (customer) => {
    setSelectedCustomer(customer);

    setActivities([]);
    setPurchases([]);

    setShowPurchaseForm(false);
    setShowActivityForm(false);

    setEditingPurchaseId(null);
    setEditingActivityId(null);

    setPurchaseForm({
      productName: "",
      quantity: 1,
      price: "",
    });

    setActivityForm({
      type: "Call",
      description: "",
    });

    setError("");
    setMessage("");

    await fetchCustomerDetails(customer._id);
  };

  // CLOSE CUSTOMER DETAILS
  const handleCloseDetails = () => {
    setSelectedCustomer(null);

    setActivities([]);
    setPurchases([]);

    setShowPurchaseForm(false);
    setShowActivityForm(false);

    setEditingPurchaseId(null);
    setEditingActivityId(null);

    setPurchaseForm({
      productName: "",
      quantity: 1,
      price: "",
    });

    setActivityForm({
      type: "Call",
      description: "",
    });

    setError("");
  };

  // PURCHASE INPUT
  const handlePurchaseChange = (e) => {
    const { name, value } = e.target;

    setPurchaseForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // START ADD PURCHASE
  const handleStartAddPurchase = () => {
    setEditingPurchaseId(null);

    setPurchaseForm({
      productName: "",
      quantity: 1,
      price: "",
    });

    setShowPurchaseForm(true);

    setError("");
    setMessage("");
  };

  // EDIT PURCHASE
  const handleEditPurchase = (purchase) => {
    setEditingPurchaseId(purchase._id);

    setPurchaseForm({
      productName: purchase.productName || "",
      quantity: purchase.quantity || 1,
      price:
        purchase.price !== undefined && purchase.price !== null
          ? purchase.price
          : "",
    });

    setShowPurchaseForm(true);

    setError("");
    setMessage("");
  };

  // ==================================================
  // ADD / UPDATE PURCHASE
  // ==================================================

  const handleAddPurchase = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Please select a customer first");
      return;
    }

    setError("");
    setMessage("");

    if (!purchaseForm.productName.trim()) {
      setError("Product name is required");
      return;
    }

    if (purchaseForm.quantity === "" || Number(purchaseForm.quantity) < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    if (purchaseForm.price === "" || Number(purchaseForm.price) < 0) {
      setError("Price must be 0 or greater");
      return;
    }

    setPurchaseSaving(true);

    try {
      const purchaseData = {
        productName: purchaseForm.productName.trim(),
        quantity: Number(purchaseForm.quantity),
        price: Number(purchaseForm.price),
      };

      if (editingPurchaseId) {
        await API.put(
          `/customers/${selectedCustomer._id}/purchases/${editingPurchaseId}`,
          purchaseData,
        );

        showSuccessMessage("Purchase updated successfully");
      } else {
        await API.post(
          `/customers/${selectedCustomer._id}/purchases`,
          purchaseData,
        );

        showSuccessMessage("Purchase added successfully");
      }

      await fetchCustomerDetails(selectedCustomer._id);

      setPurchaseForm({
        productName: "",
        quantity: 1,
        price: "",
      });

      setEditingPurchaseId(null);
      setShowPurchaseForm(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save purchase");
    } finally {
      setPurchaseSaving(false);
    }
  };

  // DELETE PURCHASE
  const handleDeletePurchase = async (purchaseId) => {
    if (!selectedCustomer) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.delete(
        `/customers/${selectedCustomer._id}/purchases/${purchaseId}`,
      );

      showSuccessMessage("Purchase deleted successfully");

      await fetchCustomerDetails(selectedCustomer._id);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete purchase");
    }
  };

  // CANCEL PURCHASE
  const handleCancelPurchase = () => {
    setShowPurchaseForm(false);
    setEditingPurchaseId(null);

    setPurchaseForm({
      productName: "",
      quantity: 1,
      price: "",
    });

    setError("");
  };

  // ACTIVITY INPUT
  const handleActivityChange = (e) => {
    const { name, value } = e.target;

    setActivityForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // START ADD ACTIVITY
  const handleStartAddActivity = () => {
    setEditingActivityId(null);

    setActivityForm({
      type: "Call",
      description: "",
    });

    setShowActivityForm(true);

    setError("");
    setMessage("");
  };

  // EDIT ACTIVITY
  const handleEditActivity = (activity) => {
    setEditingActivityId(activity._id);

    setActivityForm({
      type: activity.type || "Call",
      description: activity.description || "",
    });

    setShowActivityForm(true);

    setError("");
    setMessage("");
  };

  // ADD / UPDATE ACTIVITY
  const handleAddActivity = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      setError("Please select a customer first");
      return;
    }

    setError("");
    setMessage("");

    setActivitySaving(true);

    try {
      const activityData = {
        type: activityForm.type,
        description: activityForm.description.trim(),
      };

      if (editingActivityId) {
        await API.put(
          `/customers/${selectedCustomer._id}/activities/${editingActivityId}`,
          activityData,
        );

        showSuccessMessage("Activity updated successfully");
      } else {
        await API.post(
          `/customers/${selectedCustomer._id}/activities`,
          activityData,
        );

        showSuccessMessage("Activity added successfully");
      }

      await fetchCustomerDetails(selectedCustomer._id);

      setActivityForm({
        type: "Call",
        description: "",
      });

      setEditingActivityId(null);
      setShowActivityForm(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save activity");
    } finally {
      setActivitySaving(false);
    }
  };

  // DELETE ACTIVITY
  const handleDeleteActivity = async (activityId) => {
    if (!selectedCustomer) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this activity?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await API.delete(
        `/customers/${selectedCustomer._id}/activities/${activityId}`,
      );

      showSuccessMessage("Activity deleted successfully");

      await fetchCustomerDetails(selectedCustomer._id);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete activity");
    }
  };

  // CANCEL ACTIVITY
  const handleCancelActivity = () => {
    setShowActivityForm(false);
    setEditingActivityId(null);

    setActivityForm({
      type: "Call",
      description: "",
    });

    setError("");
  };

  // SEARCH CUSTOMERS
  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase();

    return (
      customer.name?.toLowerCase().includes(searchText) ||
      customer.email?.toLowerCase().includes(searchText) ||
      customer.phone?.toLowerCase().includes(searchText)
    );
  });

  // UI
  return (
    <Layout>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>Manage your customers</p>
        </div>
      </div>

      {/* ADD CUSTOMER */}
      <div className="form-section">
        <h2>Add Customer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter customer email"
                required
              />
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
            </div>
          </div>
          <div className="form-buttons">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : "Add Customer"}
            </button>
          </div>
        </form>
        {validationErrors.name && (
          <p className="error">{validationErrors.name}</p>
        )}
        {validationErrors.email && (
          <p className="error">{validationErrors.email}</p>
        )}
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
      </div>

      {/* EDIT CUSTOMER MODAL */}
      {showCustomerModal && (
        <div className="customer-modal-overlay" onClick={handleCancel}>
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="list-header">
              <h2>Edit Customer</h2>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
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
                  placeholder="Enter customer email"
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
              </div>
              {error && <p className="error">{error}</p>}
              <div className="form-buttons">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Customer"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER LIST */}
      <div className="list-section">
        <div className="list-header">
          <h2>Customer List</h2>

          <input
            type="text"
            className="search-input"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="primary-button"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        View
                      </button>

                      <button
                        className="edit-button"
                        onClick={() => handleEdit(customer)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(customer._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CUSTOMER DETAILS */}
      {selectedCustomer && (
        <div className="list-section">
          <div className="list-header">
            <h2>Customer Details</h2>

            <button className="secondary-button" onClick={handleCloseDetails}>
              Close
            </button>
          </div>

          {/* BASIC INFORMATION */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <p>
              <strong>Name:</strong> {selectedCustomer.name}
            </p>

            <p>
              <strong>Email:</strong> {selectedCustomer.email}
            </p>

            <p>
              <strong>Phone:</strong> {selectedCustomer.phone}
            </p>
          </div>

          {detailsLoading ? (
            <p>Loading customer details...</p>
          ) : (
            <>
              {/* PURCHASE HISTORY */}
              <div className="list-section">
                <div className="list-header">
                  <h2>Purchase History</h2>

                  <button
                    className="primary-button"
                    onClick={
                      showPurchaseForm
                        ? handleCancelPurchase
                        : handleStartAddPurchase
                    }
                  >
                    {showPurchaseForm ? "Cancel" : "Add Purchase"}
                  </button>
                </div>

                {/* PURCHASE FORM */}

                {showPurchaseForm && (
                  <div className="form-section">
                    <h2>
                      {editingPurchaseId ? "Edit Purchase" : "Add Purchase"}
                    </h2>

                    <form onSubmit={handleAddPurchase}>
                      <div className="form-row">
                        <div className="form-field">
                          <label>Product Name</label>

                          <input
                            type="text"
                            name="productName"
                            value={purchaseForm.productName}
                            onChange={handlePurchaseChange}
                            placeholder="Enter product name"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label>Quantity</label>

                          <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={purchaseForm.quantity}
                            onChange={handlePurchaseChange}
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label>Price</label>

                          <input
                            type="number"
                            name="price"
                            min="0"
                            step="0.01"
                            value={purchaseForm.price}
                            onChange={handlePurchaseChange}
                            placeholder="Enter price"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-buttons">
                        <button
                          type="submit"
                          className="primary-button"
                          disabled={purchaseSaving}
                        >
                          {purchaseSaving
                            ? "Saving..."
                            : editingPurchaseId
                              ? "Update Purchase"
                              : "Add Purchase"}
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={handleCancelPurchase}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* PURCHASE LIST */}

                {purchases.length === 0 ? (
                  <p>No purchases recorded.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Purchase Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase._id}>
                          <td>{purchase.productName}</td>

                          <td>{purchase.quantity}</td>

                          <td>₹{purchase.price}</td>

                          <td>
                            {purchase.purchaseDate
                              ? new Date(
                                  purchase.purchaseDate,
                                ).toLocaleDateString()
                              : purchase.createdAt
                                ? new Date(
                                    purchase.createdAt,
                                  ).toLocaleDateString()
                                : "-"}
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() => handleEditPurchase(purchase)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDeletePurchase(purchase._id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/* ACTIVITY HISTORY */}
              <div className="list-section">
                <div className="list-header">
                  <h2>Activity History</h2>

                  <button
                    className="primary-button"
                    onClick={
                      showActivityForm
                        ? handleCancelActivity
                        : handleStartAddActivity
                    }
                  >
                    {showActivityForm ? "Cancel" : "Add Activity"}
                  </button>
                </div>

                {/* ACTIVITY FORM */}

                {showActivityForm && (
                  <div className="form-section">
                    <h2>
                      {editingActivityId ? "Edit Activity" : "Add Activity"}
                    </h2>

                    <form onSubmit={handleAddActivity}>
                      <div className="form-row">
                        <div className="form-field">
                          <label>Activity Type</label>

                          <select
                            name="type"
                            value={activityForm.type}
                            onChange={handleActivityChange}
                          >
                            <option value="Call">Call</option>
                            <option value="Meeting">Meeting</option>
                            <option value="Email">Email</option>
                            <option value="Note">Note</option>
                          </select>
                        </div>

                        <div className="form-field">
                          <label>Description</label>

                          <input
                            type="text"
                            name="description"
                            value={activityForm.description}
                            onChange={handleActivityChange}
                            placeholder="Enter description (optional)"
                          />
                        </div>
                      </div>

                      <div className="form-buttons">
                        <button
                          type="submit"
                          className="primary-button"
                          disabled={activitySaving}
                        >
                          {activitySaving
                            ? "Saving..."
                            : editingActivityId
                              ? "Update Activity"
                              : "Add Activity"}
                        </button>

                        <button
                          type="button"
                          className="secondary-button"
                          onClick={handleCancelActivity}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ACTIVITY LIST */}

                {activities.length === 0 ? (
                  <p>No activities recorded.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Created By</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {activities.map((activity) => (
                        <tr key={activity._id}>
                          <td>{activity.type}</td>

                          <td>
                            {activity.description?.trim()
                              ? activity.description
                              : "-"}
                          </td>

                          <td>{activity.createdBy?.name || "Unknown"}</td>

                          <td>
                            {activity.createdAt
                              ? new Date(
                                  activity.createdAt,
                                ).toLocaleDateString()
                              : "-"}
                          </td>

                          <td>
                            <div className="action-buttons">
                              <button
                                type="button"
                                className="edit-button"
                                onClick={() => handleEditActivity(activity)}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDeleteActivity(activity._id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}

export default Customers;
