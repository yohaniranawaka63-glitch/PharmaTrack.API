
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import Medicine from "./Medicine";
import OtherItem from "./OtherItem";
import Stock from "./Stock";
import Sales from "./Sales";
import NewSale from "./NewSale";
import Bill from "./Bill";
import Supplier from "./Supplier";
import User from "./User";
import Reports from "./Reports";
import Settings from "./Settings";
import Help from "./Help";
import SupportRequests from "./SupportRequests";
import Login from "./Login";

const API = "https://pharmatrack-api-b0035.containers.snapdeploy.app/api";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [medicineBatches, setMedicineBatches] = useState([]);
  const [otherItems, setOtherItems] = useState([]);

  const [expiryAlerts, setExpiryAlerts] = useState({
    expiredCount: 0,
    expiringSoonCount: 0,
    expired: [],
    expiringSoon: [],
  });

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const roleId = Number(loggedInUser?.roleId);

  const isAdmin = roleId === 1;
  const isPharmacist = roleId === 2;
  const isCashier = roleId === 3;

  // Prevent browser back navigation from leaving the logged-in app.
  useEffect(() => {
    if (!loggedInUser) return;

    window.history.pushState(
      { pharmaTrackLoggedIn: true },
      "",
      window.location.href
    );

    const handlePopState = () => {
      window.history.pushState(
        { pharmaTrackLoggedIn: true },
        "",
        window.location.href
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loggedInUser]);

  // Load dashboard data after login.
  useEffect(() => {
    if (!loggedInUser) return;

    let cancelled = false;

    const loadDashboardData = async () => {
      setDashboardLoading(true);

      const results = await Promise.allSettled([
        axios.get(`${API}/Medicine`),
        axios.get(`${API}/Sale`),
        axios.get(`${API}/MedicineBatch`),
        axios.get(`${API}/OtherItem`),
        axios.get(`${API}/MedicineBatch/ExpiryAlerts`),
      ]);

      if (cancelled) return;

      if (results[0].status === "fulfilled") {
        setMedicines(Array.isArray(results[0].value.data)
          ? results[0].value.data
          : []);
      } else {
        console.error("Failed to load medicines:", results[0].reason);
      }

      if (results[1].status === "fulfilled") {
        setSales(Array.isArray(results[1].value.data)
          ? results[1].value.data
          : []);
      } else {
        console.error("Failed to load sales:", results[1].reason);
      }

      if (results[2].status === "fulfilled") {
        setMedicineBatches(Array.isArray(results[2].value.data)
          ? results[2].value.data
          : []);
      } else {
        console.error("Failed to load medicine batches:", results[2].reason);
      }

      if (results[3].status === "fulfilled") {
        setOtherItems(Array.isArray(results[3].value.data)
          ? results[3].value.data
          : []);
      } else {
        console.error("Failed to load other items:", results[3].reason);
      }

      if (results[4].status === "fulfilled") {
        setExpiryAlerts({
          expiredCount: results[4].value.data?.expiredCount ?? 0,
          expiringSoonCount:
            results[4].value.data?.expiringSoonCount ?? 0,
          expired: results[4].value.data?.expired ?? [],
          expiringSoon: results[4].value.data?.expiringSoon ?? [],
        });
      } else {
        console.error("Failed to load expiry alerts:", results[4].reason);
      }

      setDashboardLoading(false);
    };

    loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [loggedInUser]);

  // Login
  const handleLogin = (user) => {
    setLoggedInUser(user);
    setSelectedSaleId(null);

    const loginRoleId = Number(user?.roleId);

    if (loginRoleId === 3) {
      setCurrentPage("sales");
    } else {
      setCurrentPage("dashboard");
    }
  };

  // Logout
  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentPage("dashboard");
    setSelectedSaleId(null);
    setMedicines([]);
    setSales([]);
    setMedicineBatches([]);
    setOtherItems([]);
    setExpiryAlerts({
      expiredCount: 0,
      expiringSoonCount: 0,
      expired: [],
      expiringSoon: [],
    });
  };

  // Role name
  const getRoleName = () => {
    if (isAdmin) return "Administrator";
    if (isPharmacist) return "Pharmacist";
    if (isCashier) return "Cashier";
    return "User";
  };

  // Page access
  const canAccessPage = (page) => {
    if (isAdmin) return true;

    if (isPharmacist) {
      return [
        "dashboard",
        "medicine",
        "stock",
        "otherItem",
        "sales",
        "newSale",
        "bill",
        "suppliers",
        "reports",
        "help",
      ].includes(page);
    }

    if (isCashier) {
      return ["sales", "newSale", "bill", "help"].includes(page);
    }

    return false;
  };

  // Safe navigation
  const navigateTo = (page) => {
    if (canAccessPage(page)) {
      setCurrentPage(page);
    } else {
      setCurrentPage(isCashier ? "sales" : "dashboard");
    }
  };

  // Dashboard calculations
  const totalSales = sales.reduce(
    (total, sale) => total + Number(sale.totalAmount ?? sale.TotalAmount ?? 0),
    0
  );

  const totalBills = sales.length;

  const cashSales = sales
    .filter(
      (sale) =>
        String(sale.paymentMethod ?? sale.PaymentMethod ?? "").toLowerCase() ===
        "cash"
    )
    .reduce(
      (total, sale) => total + Number(sale.totalAmount ?? sale.TotalAmount ?? 0),
      0
    );

  const cardSales = sales
    .filter(
      (sale) =>
        String(sale.paymentMethod ?? sale.PaymentMethod ?? "").toLowerCase() ===
        "card"
    )
    .reduce(
      (total, sale) => total + Number(sale.totalAmount ?? sale.TotalAmount ?? 0),
      0
    );

  const getValue = (object, lowerKey, upperKey) =>
    object?.[lowerKey] ?? object?.[upperKey];

  // Only count active medicine batches.
  const activeBatches = medicineBatches.filter(
    (batch) =>
      getValue(batch, "isActive", "IsActive") !== false
  );

  // Only count active other items.
  const activeOtherItems = otherItems.filter(
    (item) => getValue(item, "status", "Status") !== false
  );

  // Calculate total medicine stock across batches for each medicine.
  const medicineStock = Object.values(
    activeBatches.reduce((groups, batch) => {
      const medicineId = getValue(batch, "medicineId", "MedicineId");
      const quantity = Number(
        getValue(batch, "quantity", "Quantity") ?? 0
      );

      if (medicineId == null) return groups;

      if (!groups[medicineId]) {
        groups[medicineId] = {
          quantity: 0,
        };
      }

      groups[medicineId].quantity += quantity;
      return groups;
    }, {})
  );

  // Medicine stock threshold: 10 or fewer units.
  const lowStockMedicines = medicineStock.filter(
    (item) => item.quantity > 0 && item.quantity <= 10
  );

  const outOfStockMedicines = medicineStock.filter(
    (item) => item.quantity <= 0
  );

  // Other item threshold uses its configured ReorderLevel.
  const lowStockOtherItems = activeOtherItems.filter((item) => {
    const quantity = Number(getValue(item, "quantity", "Quantity") ?? 0);
    const reorderLevel = Number(
      getValue(item, "reorderLevel", "ReorderLevel") ?? 10
    );

    return quantity > 0 && quantity <= reorderLevel;
  });

  const outOfStockOtherItems = activeOtherItems.filter((item) => {
    const quantity = Number(getValue(item, "quantity", "Quantity") ?? 0);
    return quantity <= 0;
  });

  const lowStockCount =
    lowStockMedicines.length + lowStockOtherItems.length;

  const outOfStockCount =
    outOfStockMedicines.length + outOfStockOtherItems.length;

  // Format currency
  const formatCurrency = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  // Prepare expiry alert rows.
  const expiryRows = [
    ...(expiryAlerts.expired || []).map((item) => ({
      ...item,
      alertType: "Expired",
    })),
    ...(expiryAlerts.expiringSoon || []).map((item) => ({
      ...item,
      alertType: "Expiring Soon",
    })),
  ];

  if (!loggedInUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="dashboard">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">+</div>
          <div>
            <h2>PharmaTrack</h2>
            <span>Pharmacy Management</span>
          </div>
        </div>

        <nav className="sidebar-menu">
          <p className="menu-title">MAIN MENU</p>

          {canAccessPage("dashboard") && (
            <a
              className={`menu-item ${currentPage === "dashboard" ? "active" : ""}`}
              onClick={() => navigateTo("dashboard")}
            >
              <span>▦</span> Dashboard
            </a>
          )}

          {canAccessPage("medicine") && (
            <a
              className={`menu-item ${currentPage === "medicine" ? "active" : ""}`}
              onClick={() => navigateTo("medicine")}
            >
              <span>💊</span> Medicines
            </a>
          )}

          {canAccessPage("stock") && (
            <a
              className={`menu-item ${currentPage === "stock" ? "active" : ""}`}
              onClick={() => navigateTo("stock")}
            >
              <span>📦</span> Stock
            </a>
          )}

          {canAccessPage("otherItem") && (
            <a
              className={`menu-item ${currentPage === "otherItem" ? "active" : ""}`}
              onClick={() => navigateTo("otherItem")}
            >
              <span>🛍️</span> Other Items
            </a>
          )}

          {canAccessPage("sales") && (
            <a
              className={`menu-item ${
                ["sales", "newSale", "bill"].includes(currentPage)
                  ? "active"
                  : ""
              }`}
              onClick={() => navigateTo("sales")}
            >
              <span>🧾</span> Sales
            </a>
          )}

          {canAccessPage("suppliers") && (
            <a
              className={`menu-item ${currentPage === "suppliers" ? "active" : ""}`}
              onClick={() => navigateTo("suppliers")}
            >
              <span>🚚</span> Suppliers
            </a>
          )}

          {(isAdmin || isPharmacist) && (
            <p className="menu-title">MANAGEMENT</p>
          )}

          {isAdmin && (
            <a
              className={`menu-item ${currentPage === "users" ? "active" : ""}`}
              onClick={() => navigateTo("users")}
            >
              <span>👥</span> Users
            </a>
          )}

          {canAccessPage("reports") && (
            <a
              className={`menu-item ${currentPage === "reports" ? "active" : ""}`}
              onClick={() => navigateTo("reports")}
            >
              <span>📊</span> Reports
            </a>
          )}

          {isAdmin && (
            <a
              className={`menu-item ${
                currentPage === "supportRequests" ? "active" : ""
              }`}
              onClick={() => navigateTo("supportRequests")}
            >
              <span>🛠️</span> Support Requests
            </a>
          )}

          {isAdmin && (
            <a
              className={`menu-item ${currentPage === "settings" ? "active" : ""}`}
              onClick={() => navigateTo("settings")}
            >
              <span>⚙</span> Settings
            </a>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div
            className="help-box"
            onClick={() => navigateTo("help")}
            style={{ cursor: "pointer" }}
          >
            <div className="help-icon">?</div>
            <div>
              <strong>Need Help?</strong>
              <small>Contact support</small>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {currentPage === "medicine" ? (
          <Medicine />
        ) : currentPage === "otherItem" ? (
          <OtherItem />
        ) : currentPage === "stock" ? (
          <Stock />
        ) : currentPage === "sales" ? (
          <Sales
            onNewSale={() => navigateTo("newSale")}
            onViewBill={(saleId) => {
              setSelectedSaleId(saleId);
              navigateTo("bill");
            }}
          />
        ) : currentPage === "newSale" ? (
          <NewSale
            onBack={() => navigateTo("sales")}
            onSaleCreated={(saleId) => {
              setSelectedSaleId(saleId);
              navigateTo("bill");
            }}
          />
        ) : currentPage === "bill" ? (
          <Bill
            saleId={selectedSaleId}
            onBack={() => navigateTo("sales")}
          />
        ) : currentPage === "suppliers" ? (
          <Supplier />
        ) : currentPage === "users" ? (
          <User />
        ) : currentPage === "reports" ? (
          <Reports />
        ) : currentPage === "supportRequests" ? (
          <SupportRequests />
        ) : currentPage === "settings" ? (
          <Settings onNeedHelp={() => navigateTo("help")} />
        ) : currentPage === "help" ? (
          <Help />
        ) : (
          <>
            {/* HEADER */}
            <header className="top-header">
              <div className="page-heading">
                <h1>Dashboard</h1>
                <p>Welcome back! Here's what's happening today.</p>
              </div>

              <div className="header-right">
                <div className="search-box">
                  <span>⌕</span>
                  <input type="text" placeholder="Search anything..." />
                </div>

                <button
                  className="notification-btn"
                  type="button"
                  title="Expiry notifications"
                  onClick={() =>
                    document
                      .getElementById("expiry-alerts")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  🔔
                  {(expiryAlerts.expiredCount +
                    expiryAlerts.expiringSoonCount) > 0 && (
                    <span className="notification-dot"></span>
                  )}
                </button>

                <div className="profile">
                  <div className="profile-avatar">
                    {loggedInUser?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>

                  <div className="profile-info">
                    <strong>{loggedInUser?.name || "User"}</strong>
                    <span>{getRoleName()}</span>
                  </div>

                  <button
                    className="profile-arrow"
                    onClick={handleLogout}
                    title="Logout"
                    type="button"
                  >
                    ↪
                  </button>
                </div>
              </div>
            </header>

            {/* SUMMARY CARDS */}
            <section className="summary-grid">
              <div className="summary-card">
                <div className="card-top">
                  <div className="card-icon green">💰</div>
                  <span className="growth positive">Sales</span>
                </div>
                <p>Total Sales</p>
                <h2>{formatCurrency(totalSales)}</h2>
                <span className="card-note">From all recorded sales</span>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <div className="card-icon blue">🧾</div>
                  <span className="growth positive">Bills</span>
                </div>
                <p>Total Bills</p>
                <h2>{totalBills}</h2>
                <span className="card-note">Total completed sales</span>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <div className="card-icon orange">💵</div>
                  <span className="growth positive">Cash</span>
                </div>
                <p>Cash Sales</p>
                <h2>{formatCurrency(cashSales)}</h2>
                <span className="card-note">Sales paid by cash</span>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <div className="card-icon red">💳</div>
                  <span className="growth positive">Card</span>
                </div>
                <p>Card Sales</p>
                <h2>{formatCurrency(cardSales)}</h2>
                <span className="card-note">Sales paid by card</span>
              </div>
            </section>

            {/* DASHBOARD GRID */}
            <section className="dashboard-grid">
              <div className="panel sales-panel">
                <div className="panel-header">
                  <div>
                    <h3>Sales Overview</h3>
                    <p>Recorded sales performance</p>
                  </div>
                  <select className="period-select" defaultValue="All Sales">
                    <option>All Sales</option>
                    <option>Last 30 days</option>
                    <option>This year</option>
                  </select>
                </div>

                <div className="chart-area">
                  <div className="chart-y-axis">
                    <span>40K</span>
                    <span>30K</span>
                    <span>20K</span>
                    <span>10K</span>
                    <span>0</span>
                  </div>

                  <div className="chart">
                    <div className="grid-line line-1"></div>
                    <div className="grid-line line-2"></div>
                    <div className="grid-line line-3"></div>
                    <div className="grid-line line-4"></div>
                    <div className="grid-line line-5"></div>

                    <div className="bars">
                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: totalSales > 0 ? "25%" : "5%" }}
                        ></div>
                        <span>Sales</span>
                      </div>

                      <div className="bar-wrapper">
                        <div
                          className="bar active-bar"
                          style={{ height: totalBills > 0 ? "45%" : "5%" }}
                        ></div>
                        <span>Bills</span>
                      </div>

                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: cashSales > 0 ? "35%" : "5%" }}
                        ></div>
                        <span>Cash</span>
                      </div>

                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{ height: cardSales > 0 ? "40%" : "5%" }}
                        ></div>
                        <span>Card</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* INVENTORY STATUS */}
              <div className="panel quick-panel">
                <div className="panel-header">
                  <div>
                    <h3>Inventory Status</h3>
                    <p>Current stock overview</p>
                  </div>
                </div>

                <div className="inventory-status">
                  <div className="status-row">
                    <div className="status-left">
                      <div className="status-icon available">✓</div>
                      <div>
                        <strong>Registered Medicines</strong>
                        <span>Current medicine records</span>
                      </div>
                    </div>
                    <strong className="status-number">
                      {medicines.length}
                    </strong>
                  </div>

                  <div className="status-row">
                    <div className="status-left">
                      <div className="status-icon low">!</div>
                      <div>
                        <strong>Low Stock</strong>
                        <span>Needs restocking</span>
                      </div>
                    </div>
                    <strong className="status-number">{lowStockCount}</strong>
                  </div>

                  <div className="status-row">
                    <div className="status-left">
                      <div className="status-icon out">×</div>
                      <div>
                        <strong>Out of Stock</strong>
                        <span>Currently unavailable</span>
                      </div>
                    </div>
                    <strong className="status-number">{outOfStockCount}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* EXPIRY ALERTS */}
            <section className="panel recent-sales" id="expiry-alerts">
              <div className="panel-header">
                <div>
                  <h3>Expiry Alerts</h3>
                  <p>Expired medicines and batches expiring within 30 days</p>
                </div>
              </div>

              <div className="inventory-status">
                <div className="status-row">
                  <div className="status-left">
                    <div className="status-icon out">!</div>
                    <div>
                      <strong>Expired Medicines</strong>
                      <span>Check these batches immediately</span>
                    </div>
                  </div>
                  <strong className="status-number">
                    {expiryAlerts.expiredCount}
                  </strong>
                </div>

                <div className="status-row">
                  <div className="status-left">
                    <div className="status-icon low">!</div>
                    <div>
                      <strong>Expiring Soon</strong>
                      <span>Expiry within the next 30 days</span>
                    </div>
                  </div>
                  <strong className="status-number">
                    {expiryAlerts.expiringSoonCount}
                  </strong>
                </div>
              </div>

              {expiryRows.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>MEDICINE</th>
                        <th>BATCH</th>
                        <th>EXPIRY DATE</th>
                        <th>QUANTITY</th>
                        <th>ALERT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiryRows.map((item) => (
                        <tr key={`${item.batchId}-${item.alertType}`}>
                          <td>{item.medicineName}</td>
                          <td>{item.batchName}</td>
                          <td>{formatDate(item.expiryDate)}</td>
                          <td>{item.quantity}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                item.alertType === "Expired"
                                  ? "expired"
                                  : "expiring-soon"
                              }`}
                            >
                              {item.alertType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ padding: "16px" }}>
                  {dashboardLoading
                    ? "Loading expiry alerts..."
                    : "No expired or soon-to-expire batches found."}
                </p>
              )}
            </section>

            {/* RECENT SALES */}
            <section className="panel recent-sales">
              <div className="panel-header">
                <div>
                  <h3>Recent Sales</h3>
                  <p>Latest transactions from your pharmacy</p>
                </div>

                <button
                  className="view-all-btn"
                  onClick={() => navigateTo("sales")}
                >
                  View All →
                </button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>SALE ID</th>
                      <th>DATE</th>
                      <th>AMOUNT</th>
                      <th>PAYMENT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          {dashboardLoading ? "Loading sales..." : "No sales found."}
                        </td>
                      </tr>
                    ) : (
                      sales.map((sale) => {
                        const saleId = getValue(sale, "saleId", "SaleId");

                        return (
                          <tr key={saleId}>
                            <td className="sale-id">
                              #SAL-{String(saleId).padStart(5, "0")}
                            </td>
                            <td>
                              {formatDate(
                                getValue(sale, "saleDate", "SaleDate")
                              )}
                            </td>
                            <td className="amount">
                              {formatCurrency(
                                getValue(sale, "totalAmount", "TotalAmount")
                              )}
                            </td>
                            <td>
                              {getValue(sale, "paymentMethod", "PaymentMethod")}
                            </td>
                            <td>
                              <span className="status-badge completed">
                                Completed
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* MEDICINE LIST */}
            <section className="panel medicine-panel">
              <div className="panel-header">
                <div>
                  <h3>Medicine List</h3>
                  <p>Medicines currently registered in PharmaTrack</p>
                </div>

                <button
                  className="add-btn"
                  onClick={() => navigateTo("medicine")}
                >
                  + Add Medicine
                </button>
              </div>

              <div className="medicine-scroll">
                {medicines.length === 0 ? (
                  <div className="empty-medicine">
                    {dashboardLoading
                      ? "Loading medicines..."
                      : "No medicines found."}
                  </div>
                ) : (
                  medicines.map((medicine) => {
                    const medicineId = getValue(
                      medicine,
                      "medicineId",
                      "MedicineId"
                    );

                    return (
                      <div className="medicine-row" key={medicineId}>
                        <div className="medicine-main">
                          <div className="medicine-icon">💊</div>
                          <div>
                            <strong>
                              {getValue(medicine, "name", "Name")}
                            </strong>
                            <span>
                              {getValue(
                                medicine,
                                "genericName",
                                "GenericName"
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="medicine-detail">
                          <span>Category</span>
                          <strong>
                            {getValue(medicine, "category", "Category")}
                          </strong>
                        </div>

                        <div className="medicine-detail">
                          <span>Unit</span>
                          <strong>
                            {getValue(medicine, "unit", "Unit")}
                          </strong>
                        </div>

                        <div className="medicine-detail">
                          <span>Strength</span>
                          <strong>
                            {getValue(medicine, "strength", "Strength")}
                          </strong>
                        </div>

                        <button className="more-btn" type="button">
                          •••
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
