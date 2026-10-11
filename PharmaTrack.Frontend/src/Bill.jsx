
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://https://pharmatrack-api-b0035.containers.snapdeploy.app/api/api";

function Bill({ saleId, onBack }) {
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pharmacy settings
  const getSettings = () => {
    try {
      return JSON.parse(
        localStorage.getItem("pharmaTrackSettings") || "{}"
      );
    } catch {
      return {};
    }
  };

  const settings = getSettings();

  const pharmacyName = settings.pharmacyName || "Isuri Pharmacy";
  const phone = settings.phone || "";
  const address = settings.address || "";
  const showPaymentMethod = settings.showPaymentMethod ?? true;

  useEffect(() => {
    if (!saleId) {
      setSale(null);
      setItems([]);
      setError("No bill selected.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadBill = async () => {
      setLoading(true);
      setError("");

      try {
        const [saleResponse, itemResponse] = await Promise.all([
          axios.get(`${API_URL}/Sale/${saleId}`),
          axios.get(`${API_URL}/Sale/${saleId}/Items`),
        ]);

        if (cancelled) return;

        setSale(saleResponse.data);
        setItems(
          Array.isArray(itemResponse.data) ? itemResponse.data : []
        );
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load bill:", err);
        setSale(null);
        setItems([]);
        setError(
          err.response?.data?.message ||
            "Unable to load this bill. Please check the backend API and try again."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadBill();

    return () => {
      cancelled = true;
    };
  }, [saleId]);

  const formatCurrency = (amount) => {
    const value = Number(amount ?? 0);

    return `Rs. ${(
      Number.isFinite(value) ? value : 0
    ).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleString("en-LK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getBillNumber = () => {
    if (sale?.saleId == null) return "—";
    return `SAL-${String(sale.saleId).padStart(5, "0")}`;
  };

  const getItemName = (item) => {
    return (
      item.itemName ||
      item.medicineName ||
      item.otherItemName ||
      item.name ||
      item.batch?.medicine?.name ||
      item.medicine?.name ||
      item.otherItem?.itemName ||
      "Item"
    );
  };

  const getQuantity = (item) => {
    return Number(item.quantity ?? 0);
  };

  const getUnitPrice = (item) => {
    return Number(item.unitPrice ?? item.sellingPrice ?? 0);
  };

  const getSubTotal = (item) => {
    if (item.subTotal != null) {
      return Number(item.subTotal);
    }

    return getQuantity(item) * getUnitPrice(item);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="medicine-page">
        <div className="bill-message">
          <div className="bill-loading-spinner" />
          <h2>Loading bill...</h2>
          <p>Please wait while we retrieve the receipt.</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="medicine-page">
        <div className="bill-message bill-error-message">
          <div className="bill-message-icon">!</div>
          <h2>Bill not available</h2>
          <p>{error || "The selected bill could not be found."}</p>

          <button
            type="button"
            className="add-medicine-btn no-print"
            onClick={onBack}
          >
            ← Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="medicine-page bill-page">
      {/* Screen header - hidden when printing */}
      <div className="medicine-header no-print">
        <div>
          <h1>Bill Preview</h1>
          <p>Review your pharmacy sales receipt before printing.</p>
        </div>

        <div className="bill-header-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={onBack}
          >
            ← Back to Sales
          </button>

          <button
            type="button"
            className="print-btn"
            onClick={handlePrint}
          >
            🖨 Print Bill
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="bill-wrapper">
        <article className="bill">
          {/* Pharmacy heading */}
          <header className="bill-header">
            <div className="bill-logo">
              <div className="bill-logo-icon" aria-hidden="true">
                +
              </div>

              <div className="bill-pharmacy-info">
                <h1>{pharmacyName}</h1>
                <p>Pharmacy & Healthcare</p>

                {address && (
                  <small className="bill-contact-line">
                    {address}
                  </small>
                )}

                {phone && (
                  <small className="bill-contact-line">
                    Tel: {phone}
                  </small>
                )}
              </div>
            </div>

            <div className="bill-title">
              <h2>SALES RECEIPT</h2>
              <span>#{getBillNumber()}</span>
              <p>Original Receipt</p>
            </div>
          </header>

          {/* Bill information */}
          <section
            className="bill-details"
            aria-label="Bill information"
          >
            <div className="bill-detail">
              <span>Bill Number</span>
              <strong>{getBillNumber()}</strong>
            </div>

            <div className="bill-detail">
              <span>Date &amp; Time</span>
              <strong>{formatDateTime(sale.saleDate)}</strong>
            </div>

            <div className="bill-detail">
              <span>Cashier ID</span>
              <strong>
                {sale.userId != null ? `User #${sale.userId}` : "—"}
              </strong>
            </div>

            {showPaymentMethod && (
              <div className="bill-detail">
                <span>Payment Method</span>
                <strong>{sale.paymentMethod || "—"}</strong>
              </div>
            )}
          </section>

          {/* Purchased items */}
          <section className="bill-items">
            <h3 className="bill-section-title">Items Purchased</h3>

            <table>
              <thead>
                <tr>
                  <th scope="col" className="bill-item-column">
                    Item Description
                  </th>
                  <th scope="col" className="bill-qty-column">
                    Qty
                  </th>
                  <th scope="col" className="bill-price-column">
                    Unit Price
                  </th>
                  <th scope="col" className="bill-amount-column">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="bill-no-items">
                      No items were found for this bill.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.saleItemId ?? index}>
                      <td className="bill-item-name">
                        {getItemName(item)}
                      </td>

                      <td className="bill-qty-column">
                        {getQuantity(item)}
                      </td>

                      <td className="bill-price-column">
                        {formatCurrency(getUnitPrice(item))}
                      </td>

                      <td className="bill-amount-column">
                        {formatCurrency(getSubTotal(item))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {/* Totals */}
          <section className="bill-summary">
            <div className="bill-total">
              <div>
                <span>Total Amount</span>
                <strong>{formatCurrency(sale.totalAmount)}</strong>
              </div>
            </div>

            {showPaymentMethod && (
              <div className="bill-payment">
                <span>Paid By</span>
                <strong>{sale.paymentMethod || "—"}</strong>
              </div>
            )}
          </section>

          {/* Receipt footer */}
          <footer className="bill-footer">
            <div className="bill-footer-symbol">✓</div>
            <strong>Thank you for your purchase!</strong>
            <span>
              Thank you for choosing {pharmacyName}.
            </span>
            <span>Please keep this receipt for your records.</span>
            {phone && <small>Contact: {phone}</small>}
          </footer>
        </article>
      </div>

      {/* Bill-only styling */}
      <style>{`
        .bill-page {
          width: 100%;
        }

        .bill-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bill-message {
          max-width: 600px;
          margin: 40px auto;
          padding: 35px;
          border: 1px solid #e2e9e5;
          border-radius: 14px;
          background: #fff;
          text-align: center;
        }

        .bill-message h2 {
          margin: 12px 0 8px;
          color: #17231f;
        }

        .bill-message p {
          margin-bottom: 20px;
          color: #7d8984;
          line-height: 1.6;
        }

        .bill-message-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          margin: 0 auto;
          border-radius: 50%;
          background: #fff0f0;
          color: #dc4c4c;
          font-size: 24px;
          font-weight: 800;
        }

        .bill-loading-spinner {
          width: 30px;
          height: 30px;
          margin: 0 auto 14px;
          border: 3px solid #e8f7f1;
          border-top-color: #087f5b;
          border-radius: 50%;
          animation: bill-spin 0.8s linear infinite;
        }

        @keyframes bill-spin {
          to { transform: rotate(360deg); }
        }

        .bill-wrapper {
          width: 100%;
          padding: 8px 0 35px;
        }

        .bill {
          width: 100%;
          max-width: 850px;
          margin: 0 auto;
          padding: 38px 42px;
          border: 1px solid #e2e9e5;
          border-radius: 15px;
          background: #fff;
          color: #52605a;
          box-shadow: 0 8px 26px rgba(20, 55, 43, 0.09);
        }

        .bill-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 22px;
          padding-bottom: 23px;
          border-bottom: 2px solid #087f5b;
        }

        .bill-logo {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          min-width: 0;
        }

        .bill-logo-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: #087f5b;
          color: #fff;
          font-size: 32px;
          font-weight: 800;
        }

        .bill-pharmacy-info {
          min-width: 0;
        }

        .bill-logo h1 {
          color: #087f5b;
          font-size: 23px;
          font-weight: 800;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }

        .bill-logo p {
          margin-top: 4px;
          color: #7d8984;
          font-size: 11px;
        }

        .bill-contact-line {
          display: block;
          margin-top: 6px;
          color: #52605a;
          font-size: 11px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .bill-title {
          flex-shrink: 0;
          text-align: right;
        }

        .bill-title h2 {
          color: #17231f;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.6px;
        }

        .bill-title > span {
          display: inline-block;
          margin-top: 8px;
          padding: 7px 10px;
          border-radius: 7px;
          background: #e8f7f1;
          color: #087f5b;
          font-size: 12px;
          font-weight: 800;
        }

        .bill-title p {
          margin-top: 7px;
          color: #7d8984;
          font-size: 10px;
        }

        .bill-details {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin: 20px 0;
          overflow: hidden;
          border: 1px solid #e2e9e5;
          border-radius: 10px;
        }

        .bill-detail {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
          padding: 13px 15px;
          border-bottom: 1px solid #edf2ef;
        }

        .bill-detail:nth-child(odd) {
          border-right: 1px solid #edf2ef;
        }

        .bill-detail:nth-last-child(-n + 2) {
          border-bottom: 0;
        }

        .bill-detail span {
          color: #7d8984;
          font-size: 10px;
        }

        .bill-detail strong {
          color: #17231f;
          font-size: 12px;
          font-weight: 700;
          overflow-wrap: anywhere;
        }

        .bill-section-title {
          margin: 0 0 12px;
          color: #17231f;
          font-size: 14px;
          font-weight: 750;
        }

        .bill-items {
          width: 100%;
          overflow-x: auto;
        }

        .bill-items table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }

        .bill-items thead {
          background: #087f5b;
          color: #fff;
        }

        .bill-items th {
          padding: 12px 10px;
          color: #fff;
          font-size: 10px;
          font-weight: 750;
          text-align: left;
          white-space: nowrap;
        }

        .bill-items td {
          padding: 13px 10px;
          border-bottom: 1px solid #e8eeeb;
          color: #52605a;
          font-size: 11px;
          line-height: 1.5;
        }

        .bill-items tbody tr:nth-child(even) {
          background: #f8fbf9;
        }

        .bill-items .bill-item-column {
          width: 43%;
        }

        .bill-items .bill-qty-column {
          text-align: center;
          white-space: nowrap;
        }

        .bill-items .bill-price-column,
        .bill-items .bill-amount-column {
          text-align: right;
          white-space: nowrap;
        }

        .bill-items .bill-item-name {
          color: #17231f;
          font-weight: 650;
          overflow-wrap: anywhere;
        }

        .bill-items .bill-no-items {
          padding: 24px 10px;
          text-align: center;
          color: #7d8984;
        }

        .bill-summary {
          margin-top: 20px;
        }

        .bill-total {
          display: flex;
          justify-content: flex-end;
        }

        .bill-total > div {
          width: 100%;
          max-width: 340px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 17px 18px;
          border: 1px solid #cce9dd;
          border-radius: 10px;
          background: #e8f7f1;
        }

        .bill-total span {
          color: #056b4d;
          font-size: 12px;
          font-weight: 700;
        }

        .bill-total strong {
          color: #056b4d;
          font-size: 20px;
          font-weight: 850;
          text-align: right;
          overflow-wrap: anywhere;
        }

        .bill-payment {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 12px;
          padding: 12px 2px;
          border-bottom: 1px dashed #dce5e0;
        }

        .bill-payment span {
          color: #7d8984;
          font-size: 11px;
        }

        .bill-payment strong {
          color: #17231f;
          font-size: 12px;
          font-weight: 750;
        }

        .bill-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px dashed #cbd8d2;
          text-align: center;
        }

        .bill-footer-symbol {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          margin-bottom: 2px;
          border-radius: 50%;
          background: #e8f7f1;
          color: #087f5b;
          font-size: 17px;
          font-weight: 800;
        }

        .bill-footer strong {
          color: #087f5b;
          font-size: 14px;
          font-weight: 800;
        }

        .bill-footer span {
          color: #7d8984;
          font-size: 10px;
          line-height: 1.5;
        }

        .bill-footer small {
          margin-top: 3px;
          color: #7d8984;
          font-size: 10px;
        }

        @media (max-width: 650px) {
          .bill-header-actions {
            width: 100%;
          }

          .bill-header-actions button {
            flex: 1;
          }

          .bill {
            padding: 22px 16px;
          }

          .bill-header {
            flex-direction: column;
            gap: 18px;
          }

          .bill-title {
            text-align: left;
          }

          .bill-logo h1 {
            font-size: 20px;
          }

          .bill-details {
            grid-template-columns: 1fr;
          }

          .bill-detail:nth-child(odd) {
            border-right: 0;
          }

          .bill-detail:nth-last-child(2) {
            border-bottom: 1px solid #edf2ef;
          }

          .bill-items th,
          .bill-items td {
            padding: 10px 6px;
            font-size: 9px;
          }

          .bill-total > div {
            padding: 14px;
          }

          .bill-total strong {
            font-size: 17px;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          html,
          body {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .bill-wrapper,
          .bill-wrapper * {
            visibility: visible !important;
          }

          .no-print,
          .sidebar,
          .top-header {
            display: none !important;
          }

          .dashboard,
          .main-content,
          .medicine-page,
          .bill-wrapper {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            box-shadow: none !important;
          }

          .bill-wrapper {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            display: block !important;
          }

          .bill {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          .bill-header {
            padding-bottom: 15px !important;
          }

          .bill-details {
            margin: 15px 0 !important;
          }

          .bill-detail {
            padding: 9px 10px !important;
          }

          .bill-items {
            overflow: visible !important;
          }

          .bill-items table {
            width: 100% !important;
            table-layout: auto !important;
          }

          .bill-items thead {
            display: table-header-group !important;
          }

          .bill-items tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .bill-items th,
          .bill-items td {
            padding: 8px 6px !important;
            font-size: 9px !important;
          }

          .bill-total,
          .bill-payment,
          .bill-footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .bill-total {
            margin-top: 14px !important;
          }

          .bill-total > div {
            background: #e8f7f1 !important;
            border: 1px solid #cce9dd !important;
          }

          .bill-footer {
            margin-top: 22px !important;
            padding-top: 14px !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Bill;
