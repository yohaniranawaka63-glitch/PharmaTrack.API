import { useEffect, useState } from "react";
import axios from "axios";

function Sales({ onNewSale, onViewBill }) {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const response = await axios.get(
        "http://https://pharmatrack-api-b0035.containers.snapdeploy.app/api/api/Sale"
      );

      setSales(response.data);
    } catch (error) {
      console.error("Failed to load sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  const formatCurrency = (amount) => {
    return `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const filteredSales = sales.filter((sale) =>
    String(sale.saleId)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalSales = sales.reduce(
    (total, sale) =>
      total + Number(sale.totalAmount || 0),
    0
  );

  const cashSales = sales
    .filter(
      (sale) =>
        sale.paymentMethod?.toLowerCase() === "cash"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount || 0),
      0
    );

  const cardSales = sales
    .filter(
      (sale) =>
        sale.paymentMethod?.toLowerCase() === "card"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount || 0),
      0
    );

  return (
    <div className="medicine-page">

      {/* PAGE HEADER */}
      <div className="medicine-header">

        <div>
          <h1>Sales Management</h1>

          <p>
            Manage pharmacy sales and billing
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "none",
              background: "#dc3545",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            ↪ Logout
          </button>

          <button
            className="add-medicine-btn"
            onClick={onNewSale}
          >
            + New Sale
          </button>

        </div>

      </div>


      {/* SUMMARY CARDS */}
      <div className="stock-summary-grid">

        <div className="stock-summary-card">

          <div className="stock-summary-icon total">
            🧾
          </div>

          <div>
            <span>Total Bills</span>

            <strong>
              {sales.length}
            </strong>
          </div>

        </div>


        <div className="stock-summary-card">

          <div className="stock-summary-icon value">
            💰
          </div>

          <div>
            <span>Total Sales</span>

            <strong>
              {formatCurrency(totalSales)}
            </strong>
          </div>

        </div>


        <div className="stock-summary-card">

          <div className="stock-summary-icon total">
            💵
          </div>

          <div>
            <span>Cash Sales</span>

            <strong>
              {formatCurrency(cashSales)}
            </strong>
          </div>

        </div>


        <div className="stock-summary-card">

          <div className="stock-summary-icon value">
            💳
          </div>

          <div>
            <span>Card Sales</span>

            <strong>
              {formatCurrency(cardSales)}
            </strong>
          </div>

        </div>

      </div>


      {/* SEARCH SECTION */}
      <div className="stock-top-section">

        <div className="medicine-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by Sale ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

      </div>


      {/* SALES HISTORY */}
      <div className="stock-section-card">

        <div className="stock-section-header">

          <div className="stock-section-title">

            <div className="stock-section-icon medicine-section-icon">
              🧾
            </div>

            <div>

              <h3>Sales History</h3>

              <p>
                All recorded pharmacy sales
              </p>

            </div>

          </div>

        </div>


        {/* SCROLLABLE TABLE */}
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

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    Loading sales...
                  </td>

                </tr>

              ) : filteredSales.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    No sales found.
                  </td>

                </tr>

              ) : (

                filteredSales.map((sale) => (

                  <tr key={sale.saleId}>

                    <td>

                      <span className="stock-type medicine-type">

                        #SAL-
                        {String(
                          sale.saleId
                        ).padStart(5, "0")}

                      </span>

                    </td>


                    <td>

                      <span className="stock-detail-text">

                        {formatDate(
                          sale.saleDate
                        )}

                      </span>

                    </td>


                    <td>

                      <span className="stock-detail-text">

                        #{sale.userId}

                      </span>

                    </td>


                    <td>

                      <span className="stock-price">

                        {formatCurrency(
                          sale.totalAmount
                        )}

                      </span>

                    </td>


                    <td>

                      <span className="category-badge">

                        {sale.paymentMethod}

                      </span>

                    </td>


                    <td>

                      <span className="status-badge completed">

                        Completed

                      </span>

                    </td>


                    {/* VIEW BILL BUTTON */}
                    <td>

                      <button
                        onClick={() =>
                          onViewBill(sale.saleId)
                        }
                        style={{
                          border: "none",
                          background: "#e8f5e9",
                          color: "#2e7d32",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        👁 View Bill
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