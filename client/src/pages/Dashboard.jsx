import { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import "./Dashboard.css";

//convert number to currency format
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

//convert month number to short month name
const monthName = (month) =>
  new Date(2000, month - 1).toLocaleString("en-IN", {
    month: "short",
  });

function Dashboard() {
  //summary state to hold the dashboard data
  const [summary, setSummary] = useState(null);
  //loading state to show loading spinner
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await API.get("/dashboard/summary");
        setSummary(response.data.summary);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="dashboard-message">Loading dashboard...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="dashboard-message dashboard-error">{error}</div>
      </Layout>
    );
  }

  if (!summary) return null;

  const cards = [
    {
      title: "Total Customers",
      value: summary.totalCustomers,
      icon: "👥",
      color: "blue",
    },
    {
      title: "Total Leads",
      value: summary.totalLeads,
      icon: "🎯",
      color: "purple",
    },
    {
      title: "Total Deals",
      value: summary.totalDeals,
      icon: "🤝",
      color: "orange",
    },
    {
      title: "Revenue",
      value: formatCurrency(summary.totalRevenue),
      icon: "💰",
      color: "green",
    },
    {
      title: "Profit",
      value: formatCurrency(summary.totalProfit),
      icon: "📈",
      color: "teal",
    },
    {
      title: "Pending Tasks",
      value: summary.pendingTasks,
      icon: "📋",
      color: "red",
    },
  ];

  const leadStages = [
    { label: "New", value: summary.leadsByStage.New, color: "#3b82f6" },
    {
      label: "Contacted",
      value: summary.leadsByStage.Contacted,
      color: "#8b5cf6",
    },
    {
      label: "Converted",
      value: summary.leadsByStage.Converted,
      color: "#10b981",
    },
    { label: "Lost", value: summary.leadsByStage.Lost, color: "#ef4444" },
  ];

  const dealStatuses = [
    { label: "Open", value: summary.dealsByStatus.Open, color: "#3b82f6" },
    { label: "Won", value: summary.dealsByStatus.Won, color: "#10b981" },
    { label: "Lost", value: summary.dealsByStatus.Lost, color: "#ef4444" },
  ];

  const maxLead = Math.max(...leadStages.map((item) => item.value), 1);
  const maxDeal = Math.max(...dealStatuses.map((item) => item.value), 1);

  const maxRevenue = Math.max(
    ...summary.monthlyRevenue.map((item) => item.revenue),
    1,
  );

  const maxProfit = Math.max(
    ...summary.monthlyRevenue.map((item) => item.profit),
    1,
  );

  const taskTotal = summary.totalTasks || 0;

  const taskStatuses = [
    {
      label: "Pending",
      value: summary.pendingTasks,
      color: "#f59e0b",
    },
    {
      label: "In Progress",
      value: summary.inProgressTasks,
      color: "#3b82f6",
    },
    {
      label: "Completed",
      value: summary.completedTasks,
      color: "#10b981",
    },
  ];

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Overview of your CRM performance</p>
          </div>
        </div>
        {/*-- Dashboard Cards Section(customers, leads, deals, revenue, profit, pending tasks) */}
        <div className="dashboard-cards">
          {cards.map((card) => (
            <div
              className={`dashboard-card card-${card.color}`}
              key={card.title}
            >
              <div className="card-top">
                <span className="card-icon">{card.icon}</span>
                <span className="card-title">{card.title}</span>
              </div>
              <h2>{card.value}</h2>
            </div>
          ))}
        </div>

        {/*-- Dashboard Charts Section(leads by stage, deals by status) */}
        <div className="dashboard-grid">
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Leads by Stage</h2>
                <p>Distribution of your leads</p>
              </div>
            </div>

            <div className="chart-list">
              {leadStages.map((item) => (
                <div className="chart-item" key={item.label}>
                  <div className="chart-label">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="chart-track">
                    <div
                      className="chart-fill"
                      style={{
                        width: `${(item.value / maxLead) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Deals by Status</h2>
                <p>Current deal pipeline</p>
              </div>
            </div>

            <div className="chart-list">
              {dealStatuses.map((item) => (
                <div className="chart-item" key={item.label}>
                  <div className="chart-label">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <div className="chart-track">
                    <div
                      className="chart-fill"
                      style={{
                        width: `${(item.value / maxDeal) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/*-- Task Progress Section */}
        <div className="dashboard-grid">
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Task Progress</h2>
                <p>
                  {summary.completedTasks} of {taskTotal} tasks completed
                </p>
              </div>
            </div>

            <div className="task-progress">
              <div className="task-progress-track">
                {taskStatuses.map((item) => (
                  <div
                    key={item.label}
                    title={`${item.label}: ${item.value}`}
                    style={{
                      width: `${
                        taskTotal ? (item.value / taskTotal) * 100 : 0
                      }%`,
                      backgroundColor: item.color,
                    }}
                  />
                ))}
              </div>

              <div className="task-legend">
                {taskStatuses.map((item) => (
                  <div className="legend-item" key={item.label}>
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Monthly Performance</h2>
                <p>Revenue and profit by deal creation month</p>
              </div>
            </div>

            {summary.monthlyRevenue.length === 0 ? (
              <p className="empty-state">No revenue data available.</p>
            ) : (
              <div className="monthly-chart">
                {summary.monthlyRevenue.map((item) => (
                  <div
                    className="monthly-row"
                    key={`${item._id.year}-${item._id.month}`}
                  >
                    <div className="monthly-label">
                      {monthName(item._id.month)} {item._id.year}
                    </div>

                    <div className="monthly-bars">
                      <div className="monthly-bar-group">
                        <span className="bar-value">
                          {formatCurrency(item.revenue)}
                        </span>
                        <div className="monthly-track">
                          <div
                            className="monthly-fill revenue-fill"
                            style={{
                              width: `${(item.revenue / maxRevenue) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="monthly-bar-group">
                        <span className="bar-value">
                          {formatCurrency(item.profit)}
                        </span>
                        <div className="monthly-track">
                          <div
                            className="monthly-fill profit-fill"
                            style={{
                              width: `${
                                (Math.max(item.profit, 0) / maxProfit) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="monthly-legend">
                  <span>
                    <i className="legend-dot revenue-dot" />
                    Revenue
                  </span>
                  <span>
                    <i className="legend-dot profit-dot" />
                    Profit
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;
