import { useEffect, useState } from "react";
import {
  FileText,
  Banknote,
  CreditCard,
  LogOut,
  Plus,
  Search,
  Receipt,
  Eye,
} from "lucide-react";
import api from "./api";

function getField(obj, camel, pascal) {
  return obj?.[camel] ?? obj?.[pascal];
}

function normalizeSale(sale) {
  return {
    ...sale,
    saleId: getField(sale, "saleId", "SaleId") ?? getField(sale, "id", "Id"),
    saleDate: getField(sale, "saleDate", "SaleDate"),
    userId: getField(sale, "userId", "UserId"),
    totalAmount: getField(sale, "totalAmount", "TotalAmount") ?? 0,
    paymentMethod: getField(sale, "paymentMethod", "PaymentMethod") ?? "",
    status: getField(sale, "status", "Status") ?? "Completed",
  };
}

function Sales({ onNewSale, onViewBill }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);

      const response = await api.get("/Sale");
      const rawSales = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? response.data?.items ?? [];

      const normalizedSales = rawSales.map(normalizeSale);
      setSales(normalizedSales);
    } catch (error) {
      console.error("Failed to load sales:", error);
      console.error("Server response:", error.response?.data);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  const formatCurrency = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const filteredSales = sales.filter((sale) =>
    String(sale.saleId ?? "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalSales = sales.reduce(
    (total, sale) => total + Number(sale.totalAmount || 0),
    0
  );

  const cashSales = sales
    .filter((sale) => String(sale.paymentMethod).toLowerCase() === "cash")
    .reduce((total, sale) => total + Number(sale.totalAmount || 0), 0);

  const cardSales = sales
    .filter((sale) => String(sale.paymentMethod).toLowerCase() === "card")
    .reduce((total, sale) => total + Number(sale.totalAmount || 0), 0);

  const iconStyle = {
    width: "22px",
    height: "22px",
    strokeWidth: 2,
  };

  return (
    <div className="medicine-page">
      <div className="medicine-header">
        <div>
          <h1>Sales Management</h1>
          <p>Manage pharmacy sales and billing</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              border: "none",
              background: "#dc3545",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            <LogOut size={18} />
            Logout
          </button>

          <button
            className="add-medicine-btn"
            onClick={onNewSale}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} />
            New Sale
          </button>
        </div>
      </div>

      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <div className="stock-summary-icon total">
            <FileText style={iconStyle} />
          </div>
          <div>
            <span>Total Bills</span>
            <strong>{sales.length}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon value">
            <Banknote style={iconStyle} />
          </div>
          <div>
            <span>Total Sales</span>
            <strong>{formatCurrency(totalSales)}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon total">
            <Receipt style={iconStyle} />
          </div>
          <div>
            <span>Cash Sales</span>
            <strong>{formatCurrency(cashSales)}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon value">
            <CreditCard style={iconStyle} />
          </div>
          <div>
            <span>Card Sales</span>
            <strong>{formatCurrency(cardSales)}</strong>
          </div>
        </div>
      </div>

      <div className="stock-top-section">
        <div className="medicine-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by Sale ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="stock-section-card">
        <div className="stock-section-header">
          <div className="stock-section-title">
            <div className="stock-section-icon medicine-section-icon">
              <Receipt size={22} />
            </div>
            <div>
              <h3>Sales History</h3>
              <p>All recorded pharmacy sales</p>
            </div>
          </div>
        </div>

        <div
          className="stock-table-wrapper"
          style={{
            maxHeight: "420px",
            overflowY: "auto",
            overflowX: "auto",
          }}
        >
          <table className="medicine-table stock-table">
            <thead>
              <tr>
                <th>SALE ID</th>
                <th>DATE</th>
                <th>USER ID</th>
                <th>TOTAL AMOUNT</th>
                <th>PAYMENT METHOD</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                    Loading sales...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                    No sales found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, index) => (
                  <tr key={sale.saleId ?? index}>
                    <td>
                      <span className="stock-type medicine-type">
                        {sale.saleId != null
                          ? `SAL-${String(sale.saleId).padStart(5, "0")}`
                          : "SAL-Unknown"}
                      </span>
                    </td>

                    <td>
                      <span className="stock-detail-text">
                        {formatDate(sale.saleDate)}
                      </span>
                    </td>

                    <td>
                      <span className="stock-detail-text">
                        {sale.userId != null ? `#${sale.userId}` : "-"}
                      </span>
                    </td>

                    <td>
                      <span className="stock-price">
                        {formatCurrency(sale.totalAmount)}
                      </span>
                    </td>

                    <td>
                      <span className="category-badge">
                        {sale.paymentMethod || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="status-badge completed">
                        {sale.status || "Completed"}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        onClick={() => onViewBill(sale.saleId)}
                        disabled={sale.saleId == null}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "7px",
                          border: "none",
                          background: "#e8f5e9",
                          color: "#2e7d32",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor:
                            sale.saleId == null ? "not-allowed" : "pointer",
                          fontWeight: "600",
                        }}
                      >
                        <Eye size={17} />
                        View Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Sales;