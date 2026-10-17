import React, { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Tasks.css";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [reminders, setReminders] = useState({
    overdue: [],
    dueToday: [],
    upcoming: [],
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    employeeId: "",
    dueDate: "",
  });

  const [editTaskId, setEditTaskId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    employeeId: "",
    dueDate: "",
  });

  const user = JSON.parse(localStorage.getItem("user"));
  const isManager = user?.role === "manager";

  const fetchTasks = async () => {
    try {
      setError("");

      const response = await API.get("/tasks");

      setTasks(response.data.tasks || []);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch tasks");
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await API.get("/tasks/reminders");

      setReminders(
        //js fallback to empty arrays if response.data.reminders is undefined or null
        response.data.reminders || {
          overdue: [],
          dueToday: [],
          upcoming: [],
        },
      );
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to fetch task reminders",
      );
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchReminders();
  }, []);

  const showSuccessMessage = (text) => {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2000);
  };

  const handleChange = (e) => {
    //bellow is a destructuring assignment that extracts the name and value properties from the event target
    //  This allows us to easily access the name and value of the input field without having to reference e.target.name and e.target.value multiple times.
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await API.post("/tasks", {
        title: formData.title,
        description: formData.description,
        employeeId: formData.employeeId,
        dueDate: formData.dueDate,
      });

      showSuccessMessage(response.data.message || "Task created successfully");

      setFormData({
        title: "",
        description: "",
        employeeId: "",
        dueDate: "",
      });

      await fetchTasks();
      await fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create task");
    }
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      setError("");
      setMessage("");

      const response = await API.put(`/tasks/${taskId}/status`, {
        status,
      });

      showSuccessMessage(
        response.data.message || "Task status updated successfully",
      );

      await fetchTasks();
      await fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update task status");
    }
  };

  const getNextStatus = (status) => {
    if (status === "Pending") {
      return "In Progress";
    }

    if (status === "In Progress") {
      return "Completed";
    }

    return null;
  };

  const handleEditClick = (task) => {
    setError("");
    setMessage("");

    setEditTaskId(task._id);

    setEditFormData({
      title: task.title || "",
      description: task.description || "",
      employeeId: task.assignedTo?.employeeId || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();

    try {
      setError("");
      setMessage("");

      const response = await API.put(`/tasks/${editTaskId}`, {
        title: editFormData.title,
        description: editFormData.description,
        employeeId: editFormData.employeeId,
        dueDate: editFormData.dueDate,
      });

      showSuccessMessage(response.data.message || "Task updated successfully");

      setEditTaskId(null);

      setEditFormData({
        title: "",
        description: "",
        employeeId: "",
        dueDate: "",
      });

      await fetchTasks();
      await fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await API.delete(`/tasks/${taskId}`);

      showSuccessMessage(response.data.message || "Task deleted successfully");

      await fetchTasks();
      await fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete task");
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  const filteredTasks = tasks.filter((task) => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      task.title?.toLowerCase().includes(search) ||
      task.description?.toLowerCase().includes(search) ||
      task.status?.toLowerCase().includes(search) ||
      task.assignedTo?.name?.toLowerCase().includes(search) ||
      task.assignedTo?.employeeId?.toLowerCase().includes(search)
    );
  });

  // Function to render a single reminder tasknext
  const renderReminderTask = (task) => {
    return (
      <div className="reminder-task" key={task._id}>
        <div className="reminder-task-title">{task.title}</div>

        <div className="reminder-task-info">
          <span>{task.status}</span>
          <span>{formatDate(task.dueDate)}</span>
        </div>

        <p>{task.assignedTo?.name || "Unknown"}</p>
      </div>
    );
  };

  return (
    <Layout>
      <div className="tasks-page">
        <div className="page-header">
          <div>
            <h1>Task Management</h1>
            <p>Manage tasks, assignments and progress</p>
          </div>

          <div className="task-count">
            <span>{tasks.length}</span>
            <small>Total Tasks</small>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        {isManager && (
          <section className="task-section create-task-section">
            <div className="section-title">
              <h2>Create Task</h2>
              <p>Assign a new task to an employee</p>
            </div>

            <form className="task-form" onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Example: EMP001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-actions full-width">
                <button type="submit" className="primary-button">
                  Create Task
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="task-section">
          <div className="section-title">
            <h2>Task Reminders</h2>
            <p>Tasks that need attention</p>
          </div>

          <div className="reminder-grid">
            <div className="reminder-card overdue-card">
              <div className="reminder-header">
                <h3>Overdue</h3>
                <span>{reminders.overdue.length}</span>
              </div>

              {reminders.overdue.length === 0 ? (
                <p className="empty-text">No overdue tasks.</p>
              ) : (
                reminders.overdue.map(renderReminderTask)
              )}
            </div>

            <div className="reminder-card today-card">
              <div className="reminder-header">
                <h3>Due Today</h3>
                <span>{reminders.dueToday.length}</span>
              </div>

              {reminders.dueToday.length === 0 ? (
                <p className="empty-text">No tasks due today.</p>
              ) : (
                reminders.dueToday.map(renderReminderTask)
              )}
            </div>

            <div className="reminder-card upcoming-card">
              <div className="reminder-header">
                <h3>Upcoming</h3>
                <span>{reminders.upcoming.length}</span>
              </div>

              {reminders.upcoming.length === 0 ? (
                <p className="empty-text">No upcoming tasks.</p>
              ) : (
                reminders.upcoming.map(renderReminderTask)
              )}
            </div>
          </div>
        </section>

        <section className="task-section">
          <div className="task-list-header">
            <div className="section-title">
              <h2>Task List</h2>
              <p>
                {isManager
                  ? "View and manage all assigned tasks"
                  : "Tasks assigned to you"}
              </p>
            </div>

            <div className="task-search">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {searchTerm && (
            <p className="search-result-count">
              Showing {filteredTasks.length} of {tasks.length} tasks
            </p>
          )}

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>
                {searchTerm
                  ? "No tasks match your search."
                  : "There are currently no tasks to display."}
              </p>
            </div>
          ) : (
            <div className="task-grid">
              {filteredTasks.map((task) => {
                const nextStatus = getNextStatus(task.status);

                return (
                  <div className="task-card" key={task._id}>
                    <div className="task-card-header">
                      <h3>{task.title}</h3>

                      <span
                        className={`status-badge ${task.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <p className="task-description">
                      {task.description || "No description provided"}
                    </p>

                    <div className="task-details">
                      <div>
                        <span>Due Date</span>
                        <strong>{formatDate(task.dueDate)}</strong>
                      </div>

                      <div>
                        <span>Assigned To</span>
                        <strong>{task.assignedTo?.name || "Unknown"}</strong>
                      </div>

                      {isManager && (
                        <div>
                          <span>Employee ID</span>
                          <strong>
                            {task.assignedTo?.employeeId || "N/A"}
                          </strong>
                        </div>
                      )}
                    </div>

                    <div className="task-actions">
                      {nextStatus && (
                        <button
                          className="progress-button"
                          onClick={() =>
                            handleStatusChange(task._id, nextStatus)
                          }
                        >
                          Mark as {nextStatus}
                        </button>
                      )}

                      {isManager && (
                        <>
                          <button
                            className="edit-button"
                            onClick={() => handleEditClick(task)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDeleteTask(task._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    {isManager && editTaskId === task._id && (
                      <div className="edit-task-box">
                        <h3>Edit Task</h3>

                        <form onSubmit={handleUpdateTask}>
                          <div className="form-group">
                            <label>Task Title</label>
                            <input
                              type="text"
                              name="title"
                              value={editFormData.title}
                              onChange={handleEditChange}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              name="description"
                              value={editFormData.description}
                              onChange={handleEditChange}
                              rows="3"
                            />
                          </div>

                          <div className="form-group">
                            <label>Employee ID</label>
                            <input
                              type="text"
                              name="employeeId"
                              value={editFormData.employeeId}
                              onChange={handleEditChange}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Due Date</label>
                            <input
                              type="date"
                              name="dueDate"
                              value={editFormData.dueDate}
                              onChange={handleEditChange}
                              required
                            />
                          </div>

                          <div className="task-actions">
                            <button type="submit" className="primary-button">
                              Update Task
                            </button>

                            <button
                              type="button"
                              className="cancel-button"
                              onClick={() => setEditTaskId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default Tasks;
