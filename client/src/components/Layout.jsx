import { Link, useNavigate } from "react-router-dom";

function Layout({ children }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>CRM System</h2>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/leads">Leads</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/employees">Employees</Link>
          <Link to="/deals">Sales</Link>
        </nav>

        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h3>CRM System</h3>

          <span>
            {user?.name} ({user?.role})
          </span>
        </header>

        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}

export default Layout;
