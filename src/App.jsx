import { useState } from "react";
import "./App.css";
import Login from "./components/Login.jsx";
import SubscriptionDashboard from "./components/SubsscriptionDashboard.jsx";
import Venues from "./components/Venues.jsx";
import Customers from "./components/Customers.jsx";
import Bookings from "./components/Bookings.jsx";


function getStoredUser() {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Unable to load stored user:", error);
    localStorage.removeItem("user");
    return null;
  }
}

console.log("UPGRADED SUBSCRIPTION DASHBOARD LOADED");
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  const [activePage, setActivePage] = useState("dashboard");

  const user = getStoredUser();

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("business");

    setIsAuthenticated(false);
    setActivePage("dashboard");
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <SubscriptionDashboard />;

      case "venues":
  return <Venues />;

      case "customers":
  return <Customers />;

           case "bookings":
  return <Bookings />;

      case "subscription":
        return <SubscriptionDashboard />;

      default:
        return <SubscriptionDashboard />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <h1>Thelle Mogoerane: Venue Booking System</h1>
          <span>SaaS</span>
        </div>

        <div className="app-user">
          <div>
            <strong>
              {user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : "User"}
            </strong>

            {user?.role && (
              <small>{user.role.replaceAll("_", " ")}</small>
            )}
          </div>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <nav>
            <button
              type="button"
              className={activePage === "dashboard" ? "active" : ""}
              onClick={() => setActivePage("dashboard")}
            >
              Dashboard
            </button>

            <button
              type="button"
              className={activePage === "venues" ? "active" : ""}
              onClick={() => setActivePage("venues")}
            >
              Venues
            </button>

            <button
              type="button"
              className={activePage === "customers" ? "active" : ""}
              onClick={() => setActivePage("customers")}
            >
              Customers
            </button>

            <button
              type="button"
              className={activePage === "bookings" ? "active" : ""}
              onClick={() => setActivePage("bookings")}
            >
              Bookings
            </button>

            <button
              type="button"
              className={activePage === "subscription" ? "active" : ""}
              onClick={() => setActivePage("subscription")}
            >
              Subscription
            </button>
          </nav>
        </aside>

        <main className="app-content">{renderPage()}</main>
      </div>
    </div>
  );
}

export default App;