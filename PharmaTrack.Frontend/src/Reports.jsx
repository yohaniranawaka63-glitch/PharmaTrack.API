import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:5275/api";

function Reports() {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [otherItems, setOtherItems] = useState([]);

  const [period, setPeriod] = useState("Today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // LOAD REPORT DATA
  const loadReportData = async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        { key: "sales", url: `${API}/Sale` },
        { key: "saleItems", url: `${API}/SaleItem` },
        { key: "batches", url: `${API}/MedicineBatch` },
        { key: "medicines", url: `${API}/Medicine` },
        { key: "otherItems", url: `${API}/OtherItem` },
      ];

      const results = await Promise.allSettled(
        endpoints.map((endpoint) => axios.get(endpoint.url))
      );

      const data = {};
      const failed = [];

      results.forEach((result, index) => {
        const key = endpoints[index].key;

        if (result.status === "fulfilled") {
          data[key] = Array.isArray(result.value.data)
            ? result.value.data
            : [];
        } else {
          console.error(`Failed to load ${key}:`, result.reason);
          data[key] = [];
          failed.push(key);
        }
      });

      const activeOtherItems = data.otherItems || [];
      const saleItemsData = data.saleItems || [];

      const activeOtherItemIds = new Set(
        activeOtherItems.map((item) => Number(item.otherItemId))
      );

      const historicalOtherItemIds = [
        ...new Set(
          saleItemsData
            .filter((item) => item.otherItemId != null)
            .map((item) => Number(item.otherItemId))
            .filter((id) => !activeOtherItemIds.has(id))
        ),
      ];

      const historicalResults = await Promise.allSettled(
        historicalOtherItemIds.map((id) =>
          axios.get(`${API}/OtherItem/${id}/CostDetails`)
        )
      );

      const historicalItems = [];

      historicalResults.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value.data) {
          historicalItems.push(result.value.data);
        } else {
          console.error(
            `Failed to load historical item ${historicalOtherItemIds[index]}:`,
            result.status === "rejected"
              ? result.reason
              : "No data"
          );
        }
      });

      const combinedOtherItems = [
        ...activeOtherItems,
        ...historicalItems.filter(
          (item) =>
            !activeOtherItemIds.has(Number(item.otherItemId))
        ),
      ];

      setSales(data.sales);
      setSaleItems(saleItemsData);
      setBatches(data.batches);
      setMedicines(data.medicines);
      setOtherItems(combinedOtherItems);

      if (failed.length > 0) {
        setError(
          `Some report data could not be loaded: ${failed.join(
            ", "
          )}. Check the API endpoints.`
        );
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(
        "Could not load report data. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // DATE AND MONEY HELPERS
  const today = useMemo(() => {
    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  }, []);

  const getDateOnly = (value) => {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
  };

  const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-GB");
  };

  const formatMoney = (value) =>
    Number(value ?? 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const money = (value) => `Rs. ${formatMoney(value)}`;

  // LOOKUP MAPS
  const medicineById = useMemo(() => {
    const map = new Map();

    medicines.forEach((medicine) => {
      map.set(
        Number(medicine.medicineId),
        medicine.name || medicine.medicineName || "Medicine"
      );
    });

    return map;
  }, [medicines]);

  const batchById = useMemo(() => {
    const map = new Map();

    batches.forEach((batch) => {
      map.set(Number(batch.batchId), batch);
    });

    return map;
  }, [batches]);

  const otherItemById = useMemo(() => {
    const map = new Map();

    otherItems.forEach((item) => {
      map.set(Number(item.otherItemId), item);
    });

    return map;
  }, [otherItems]);

  const getSaleItemName = (item) => {
    if (item.batchId != null) {
      const batch = batchById.get(Number(item.batchId));

      if (batch) {
        return (
          medicineById.get(Number(batch.medicineId)) ||
          `Medicine #${batch.medicineId}`
        );
      }

      return `Medicine batch #${item.batchId}`;
    }

    if (item.otherItemId != null) {
      const otherItem = otherItemById.get(
        Number(item.otherItemId)
      );

      return (
        otherItem?.itemName ||
        `Other item #${item.otherItemId} (unavailable)`
      );
    }

    return "Unknown item";
  };

  // FILTER SALES BY PERIOD
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const date = getDateOnly(sale.saleDate);

      if (!date) return false;

      if (period === "Today") {
        return date.getTime() === today.getTime();
      }

      if (period === "This Month") {
        return (
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      }

      if (period === "This Year") {
        return date.getFullYear() === today.getFullYear();
      }

      return true;
    });
  }, [sales, period, today]);

  const filteredSaleIds = useMemo(
    () =>
      new Set(
        filteredSales.map((sale) => Number(sale.saleId))
      ),
    [filteredSales]
  );

  const filteredSaleItems = useMemo(
    () =>
      saleItems.filter((item) =>
        filteredSaleIds.has(Number(item.saleId))
      ),
    [saleItems, filteredSaleIds]
  );

  // SALES TOTALS
  const totalSales = useMemo(
    () =>
      filteredSales.reduce(
        (sum, sale) => sum + Number(sale.totalAmount ?? 0),
        0
      ),
    [filteredSales]
  );

  const totalBills = filteredSales.length;

  const cashBills = filteredSales.filter(
    (sale) =>
      String(sale.paymentMethod ?? "").trim().toLowerCase() ===
      "cash"
  );

  const cardBills = filteredSales.filter(
    (sale) =>
      String(sale.paymentMethod ?? "").trim().toLowerCase() ===
      "card"
  );

  const cashSales = cashBills.reduce(
    (sum, sale) => sum + Number(sale.totalAmount ?? 0),
    0
  );

  const cardSales = cardBills.reduce(
    (sum, sale) => sum + Number(sale.totalAmount ?? 0),
    0
  );

  // REPORT TITLES
  const reportTitle =
    period === "Today"
      ? "Daily Sales Report"
      : period === "This Month"
        ? "Monthly Sales Report"
        : "Yearly Sales Report";

  const reportPeriod =
    period === "Today"
      ? formatDate(today)
      : period === "This Month"
        ? today.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : String(today.getFullYear());

  const sortedSales = useMemo(
    () =>
      [...filteredSales].sort(
        (a, b) =>
          new Date(b.saleDate).getTime() -
          new Date(a.saleDate).getTime()
      ),
    [filteredSales]
  );

  // DAILY BREAKDOWN
  const dailyBreakdown = useMemo(() => {
    if (period !== "This Month") return [];

    const days = {};

    filteredSales.forEach((sale) => {
      const date = getDateOnly(sale.saleDate);

      if (!date) return;

      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");

      if (!days[key]) {
        days[key] = {
          key,
          date,
          bills: 0,
          cash: 0,
          card: 0,
          total: 0,
        };
      }

      const amount = Number(sale.totalAmount ?? 0);
      const payment = String(sale.paymentMethod ?? "")
        .trim()
        .toLowerCase();

      days[key].bills += 1;
      days[key].total += amount;

      if (payment === "cash") days[key].cash += amount;
      if (payment === "card") days[key].card += amount;
    });

    return Object.values(days).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [filteredSales, period]);

  // MONTHLY BREAKDOWN
  const monthlyBreakdown = useMemo(() => {
    if (period !== "This Year") return [];

    const months = {};

    filteredSales.forEach((sale) => {
      const date = getDateOnly(sale.saleDate);

      if (!date) return;

      const monthNumber = date.getMonth();

      if (!months[monthNumber]) {
        months[monthNumber] = {
          monthNumber,
          month: date.toLocaleDateString("en-US", {
            month: "long",
          }),
          bills: 0,
          cash: 0,
          card: 0,
          total: 0,
        };
      }

      const amount = Number(sale.totalAmount ?? 0);
      const payment = String(sale.paymentMethod ?? "")
        .trim()
        .toLowerCase();

      months[monthNumber].bills += 1;
      months[monthNumber].total += amount;

      if (payment === "cash") months[monthNumber].cash += amount;
      if (payment === "card") months[monthNumber].card += amount;
    });

    return Object.values(months).sort(
      (a, b) => a.monthNumber - b.monthNumber
    );
  }, [filteredSales, period]);

  // BEST SELLERS AND GROSS PROFIT
  const itemPerformance = useMemo(() => {
    const map = new Map();

    filteredSaleItems.forEach((item) => {
      const isMedicine = item.batchId != null;

      const batch = isMedicine
        ? batchById.get(Number(item.batchId))
        : null;

      const otherItem =
        item.otherItemId != null
          ? otherItemById.get(Number(item.otherItemId))
          : null;

      const itemKey = isMedicine
        ? `medicine-${batch?.medicineId ?? item.batchId}`
        : `other-${item.otherItemId}`;

      const name = getSaleItemName(item);
      const quantity = Number(item.quantity ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      const revenue = Number(
        item.subTotal ?? quantity * unitPrice
      );

      let unitCost = null;
      let costSource = "missing";

      const historicalCost = item.purchasePriceAtSale;

      if (
        historicalCost !== null &&
        historicalCost !== undefined &&
        historicalCost !== "" &&
        Number.isFinite(Number(historicalCost)) &&
        Number(historicalCost) >= 0
      ) {
        unitCost = Number(historicalCost);
        costSource = "recorded";
      } else {
        let currentCost = null;

        if (isMedicine && batch?.purchasePrice != null) {
          currentCost = Number(batch.purchasePrice);
        } else if (
          !isMedicine &&
          otherItem?.purchasePrice != null
        ) {
          currentCost = Number(otherItem.purchasePrice);
        }

        if (
          currentCost !== null &&
          Number.isFinite(currentCost) &&
          currentCost >= 0
        ) {
          unitCost = currentCost;
          costSource = "estimated";
        }
      }

      if (!map.has(itemKey)) {
        map.set(itemKey, {
          itemKey,
          name,
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          recordedProfit: 0,
          estimatedProfit: 0,
          recordedCost: 0,
          estimatedCost: 0,
          recordedQuantity: 0,
          estimatedQuantity: 0,
          missingCostQuantity: 0,
        });
      }

      const row = map.get(itemKey);

      row.quantity += quantity;
      row.revenue += revenue;

      if (unitCost === null) {
        row.missingCostQuantity += quantity;
        return;
      }

      const cost = unitCost * quantity;
      const profit = revenue - cost;

      row.cost += cost;
      row.profit += profit;

      if (costSource === "recorded") {
        row.recordedCost += cost;
        row.recordedProfit += profit;
        row.recordedQuantity += quantity;
      } else {
        row.estimatedCost += cost;
        row.estimatedProfit += profit;
        row.estimatedQuantity += quantity;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.quantity - a.quantity
    );
  }, [
    filteredSaleItems,
    batchById,
    otherItemById,
    medicineById,
  ]);

  const confirmedGrossProfit = itemPerformance.reduce(
    (sum, item) => sum + item.recordedProfit,
    0
  );

  const estimatedGrossProfit = itemPerformance.reduce(
    (sum, item) => sum + item.estimatedProfit,
    0
  );

  const knownGrossProfit =
    confirmedGrossProfit + estimatedGrossProfit;

  const totalKnownCost = itemPerformance.reduce(
    (sum, item) => sum + item.cost,
    0
  );

  const itemsMissingCost = itemPerformance.filter(
    (item) => item.missingCostQuantity > 0
  );

  // STOCK REPORTS
  const stockReport = useMemo(() => {
    const medicineStock = new Map();

    batches
      .filter((batch) => batch.isActive !== false)
      .forEach((batch) => {
        const medicineId = Number(batch.medicineId);

        if (!medicineStock.has(medicineId)) {
          medicineStock.set(medicineId, {
            id: medicineId,
            name:
              medicineById.get(medicineId) ||
              `Medicine #${medicineId}`,
            quantity: 0,
            reorderLevel: 0,
            type: "Medicine",
          });
        }

        medicineStock.get(medicineId).quantity += Number(
          batch.quantity ?? 0
        );
      });

    const medicineRows = Array.from(medicineStock.values());

    const otherRows = otherItems
      .filter((item) => item.status !== false)
      .map((item) => ({
        id: item.otherItemId,
        name: item.itemName || "Other item",
        quantity: Number(item.quantity ?? 0),
        reorderLevel: Number(item.reorderLevel ?? 0),
        type: "Other Item",
      }));

    const all = [...medicineRows, ...otherRows];

    return {
      all,
      outOfStock: all.filter((item) => item.quantity <= 0),
      lowStock: all.filter(
        (item) =>
          item.quantity > 0 &&
          item.reorderLevel > 0 &&
          item.quantity <= item.reorderLevel
      ),
    };
  }, [batches, medicineById, otherItems]);

  // PRINT / LOGOUT
  const handlePrint = () => window.print();

  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // RENDER
  return (
    <div className="reports-page">
      <div className="reports-screen-header no-print">
        <div>
          <h1>Reports</h1>
          <p>View and print pharmacy business reports</p>
        </div>

        <div className="reports-header-actions">
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
            type="button"
            className="reports-refresh-btn"
            onClick={loadReportData}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="reports-print-btn"
            onClick={handlePrint}
          >
            🖨 Print Report
          </button>
        </div>
      </div>

      <div className="reports-type-card no-print">
        <div>
          <span className="reports-type-label">Report Type</span>
          <p>Select the report period you want to view.</p>
        </div>

        <div className="reports-period-buttons">
          {["Today", "This Month", "This Year"].map((value) => (
            <button
              key={value}
              type="button"
              className={period === value ? "active" : ""}
              onClick={() => setPeriod(value)}
            >
              {value === "Today"
                ? "Daily"
                : value === "This Month"
                  ? "Monthly"
                  : "Yearly"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            margin: "12px 0",
            padding: "12px",
            borderRadius: "8px",
            background: "#fff3cd",
            color: "#664d03",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="reports-loading">Loading report...</div>
      ) : (
        <div className="report-document">
          <div className="report-document-header">
            <div className="report-company">
              <div className="report-logo">+</div>
              <div>
                <h1>PHARMATRACK</h1>
                <p>Pharmacy Management System</p>
              </div>
            </div>

            <div className="report-heading">
              <h2>{reportTitle}</h2>
              <p>
                Report Period: <strong>{reportPeriod}</strong>
              </p>
              <p>Generated: {formatDate(new Date())}</p>
              {lastUpdated && (
                <p className="no-print">
                  Last refreshed: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* BUSINESS OVERVIEW */}
          <div className="report-summary-title">
            <h3>Business Overview</h3>
          </div>

          <div className="report-summary-grid">
            <div className="report-summary-box">
              <span>Total Sales</span>
              <strong>{money(totalSales)}</strong>
            </div>
            <div className="report-summary-box">
              <span>Total Bills</span>
              <strong>{totalBills}</strong>
            </div>
            <div className="report-summary-box">
              <span>Cash Sales</span>
              <strong>{money(cashSales)}</strong>
            </div>
            <div className="report-summary-box">
              <span>Card Sales</span>
              <strong>{money(cardSales)}</strong>
            </div>
          </div>

          {/* PAYMENT SUMMARY */}
          <section className="report-section">
            <div className="report-section-header">
              <div>
                <h3>Payment Summary</h3>
                <p>Sales amount by payment method</p>
              </div>
            </div>

            <table className="business-report-table">
              <thead>
                <tr>
                  <th>Payment Method</th>
                  <th>No. of Bills</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Cash</td>
                  <td>{cashBills.length}</td>
                  <td className="money-cell">{money(cashSales)}</td>
                </tr>
                <tr>
                  <td>Card</td>
                  <td>{cardBills.length}</td>
                  <td className="money-cell">{money(cardSales)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{totalBills}</strong></td>
                  <td className="money-cell">
                    <strong>{money(totalSales)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          {/* GROSS PROFIT */}
          <section className="report-section">
            <div className="report-section-header">
              <div>
                <h3>Gross Profit Report</h3>
                <p>
                  Historical costs are used when recorded; older
                  sales may use estimated costs.
                </p>
              </div>
            </div>

            <div className="report-summary-grid">
              <div className="report-summary-box">
                <span>Gross Profit (Total Known)</span>
                <strong>{money(knownGrossProfit)}</strong>
              </div>

              <div className="report-summary-box">
                <span>Recorded-Cost Profit</span>
                <strong>{money(confirmedGrossProfit)}</strong>
              </div>

              <div className="report-summary-box">
                <span>Estimated-Cost Profit</span>
                <strong>{money(estimatedGrossProfit)}</strong>
              </div>

              <div className="report-summary-box">
                <span>Total Known Cost</span>
                <strong>{money(totalKnownCost)}</strong>
              </div>

              <div className="report-summary-box">
                <span>Items With Missing Cost</span>
                <strong>{itemsMissingCost.length}</strong>
              </div>
            </div>

            {itemsMissingCost.length > 0 && (
              <p style={{ margin: "10px 0", color: "#8a5a00" }}>
                Purchase cost is unavailable for:{" "}
                {itemsMissingCost.map((item) => item.name).join(", ")}.
                These quantities are excluded from the gross profit
                calculation.
              </p>
            )}

            {itemPerformance.length === 0 ? (
              <div className="report-empty">
                No sale item details are available for this period.
              </div>
            ) : (
              <table className="business-report-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantity Sold</th>
                    <th>Sales Amount</th>
                    <th>Known Cost</th>
                    <th>Gross Profit</th>
                  </tr>
                </thead>

                <tbody>
                  {itemPerformance.map((item) => (
                    <tr key={item.itemKey}>
                      <td>{item.name}</td>

                      <td>{item.quantity}</td>

                      <td className="money-cell">
                        {money(item.revenue)}
                      </td>

                      <td className="money-cell">
                        <strong>{money(item.cost)}</strong>

                        {item.recordedQuantity > 0 && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#198754",
                            }}
                          >
                            Recorded: {item.recordedQuantity} units
                          </div>
                        )}

                        {item.estimatedQuantity > 0 && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#8a5a00",
                            }}
                          >
                            Estimated: {item.estimatedQuantity} units
                          </div>
                        )}

                        {item.missingCostQuantity > 0 && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#b02a37",
                            }}
                          >
                            Missing: {item.missingCostQuantity} units
                          </div>
                        )}
                      </td>

                      <td className="money-cell">
                        <strong>{money(item.profit)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p style={{ marginTop: "8px", fontSize: "12px" }}>
              Recorded-cost profit uses the purchase price saved
              at the time of sale. Estimated-cost profit uses the
              current purchase price for older sales without a
              saved historical cost. Items with no available cost
              are excluded from known cost and profit totals.
              Gross profit excludes operating expenses and is not
              net profit.
            </p>
          </section>

          {/* BEST SELLERS */}
          <section className="report-section">
            <div className="report-section-header">
              <div>
                <h3>Best-Selling Items</h3>
                <p>Ranked by quantity sold in the selected period</p>
              </div>
            </div>

            {itemPerformance.length === 0 ? (
              <div className="report-empty">No sold items found.</div>
            ) : (
              <table className="business-report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Item</th>
                    <th>Quantity Sold</th>
                    <th>Sales Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemPerformance.slice(0, 10).map((item, index) => (
                    <tr key={item.itemKey}>
                      <td>{index + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td className="money-cell">
                        {money(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* STOCK ALERTS */}
          <section className="report-section">
            <div className="report-section-header">
              <div>
                <h3>Low Stock and Out of Stock</h3>
                <p>Current stock based on active inventory records</p>
              </div>
            </div>

            <div className="report-summary-grid">
              <div className="report-summary-box">
                <span>Out of Stock Items</span>
                <strong>{stockReport.outOfStock.length}</strong>
              </div>
              <div className="report-summary-box">
                <span>Low Stock Items</span>
                <strong>{stockReport.lowStock.length}</strong>
              </div>
            </div>

            {stockReport.outOfStock.length === 0 &&
            stockReport.lowStock.length === 0 ? (
              <div className="report-empty">
                No low-stock or out-of-stock items were found using
                the current reorder levels.
              </div>
            ) : (
              <table className="business-report-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Current Quantity</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ...stockReport.outOfStock,
                    ...stockReport.lowStock,
                  ].map((item) => (
                    <tr key={`${item.type}-${item.id}`}>
                      <td>{item.name}</td>
                      <td>{item.type}</td>
                      <td>{item.quantity}</td>
                      <td>{item.reorderLevel || "-"}</td>
                      <td>
                        {item.quantity <= 0
                          ? "Out of Stock"
                          : "Low Stock"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* DAILY BREAKDOWN */}
          {period === "This Month" && (
            <section className="report-section">
              <div className="report-section-header">
                <div>
                  <h3>Daily Sales Breakdown</h3>
                  <p>Daily sales performance for {reportPeriod}</p>
                </div>
              </div>

              {dailyBreakdown.length === 0 ? (
                <div className="report-empty">
                  No sales found for this month.
                </div>
              ) : (
                <table className="business-report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bills</th>
                      <th>Cash</th>
                      <th>Card</th>
                      <th>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyBreakdown.map((day) => (
                      <tr key={day.key}>
                        <td>{formatDate(day.date)}</td>
                        <td>{day.bills}</td>
                        <td className="money-cell">{money(day.cash)}</td>
                        <td className="money-cell">{money(day.card)}</td>
                        <td className="money-cell">
                          <strong>{money(day.total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Monthly Total</strong></td>
                      <td><strong>{totalBills}</strong></td>
                      <td className="money-cell">
                        <strong>{money(cashSales)}</strong>
                      </td>
                      <td className="money-cell">
                        <strong>{money(cardSales)}</strong>
                      </td>
                      <td className="money-cell">
                        <strong>{money(totalSales)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </section>
          )}

          {/* YEARLY BREAKDOWN */}
          {period === "This Year" && (
            <section className="report-section">
              <div className="report-section-header">
                <div>
                  <h3>Monthly Sales Breakdown</h3>
                  <p>Monthly sales performance for {reportPeriod}</p>
                </div>
              </div>

              {monthlyBreakdown.length === 0 ? (
                <div className="report-empty">
                  No sales found for this year.
                </div>
              ) : (
                <table className="business-report-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Bills</th>
                      <th>Cash</th>
                      <th>Card</th>
                      <th>Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyBreakdown.map((month) => (
                      <tr key={month.monthNumber}>
                        <td>{month.month}</td>
                        <td>{month.bills}</td>
                        <td className="money-cell">{money(month.cash)}</td>
                        <td className="money-cell">{money(month.card)}</td>
                        <td className="money-cell">
                          <strong>{money(month.total)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Yearly Total</strong></td>
                      <td><strong>{totalBills}</strong></td>
                      <td className="money-cell">
                        <strong>{money(cashSales)}</strong>
                      </td>
                      <td className="money-cell">
                        <strong>{money(cardSales)}</strong>
                      </td>
                      <td className="money-cell">
                        <strong>{money(totalSales)}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </section>
          )}

          {/* TRANSACTIONS */}
          <section className="report-section report-transactions-section">
            <div className="report-section-header">
              <div>
                <h3>Sales Transactions</h3>
                <p>Transaction records included in this report</p>
              </div>
            </div>

            {sortedSales.length === 0 ? (
              <div className="report-empty">
                No sales transactions found for this period.
              </div>
            ) : (
              <table className="business-report-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Bill ID</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSales.map((sale, index) => (
                    <tr key={sale.saleId}>
                      <td>{index + 1}</td>
                      <td><strong>#{sale.saleId}</strong></td>
                      <td>{formatDate(sale.saleDate)}</td>
                      <td>{sale.paymentMethod || "-"}</td>
                      <td className="money-cell">
                        {money(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="total-label">
                      <strong>Report Total</strong>
                    </td>
                    <td className="money-cell">
                      <strong>{money(totalSales)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </section>

          {/* FOOTER */}
          <div className="report-document-footer">
            <div>
              <span>Prepared By</span>
              <div className="signature-line"></div>
            </div>
            <div>
              <span>Authorized By</span>
              <div className="signature-line"></div>
            </div>
          </div>

          <div className="report-footer-note">
            PharmaTrack Pharmacy Management System | Generated from
            recorded sales and available stock data.
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;