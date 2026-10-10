import { useState } from "react";
import "./Settings.css";

function Settings({ onNeedHelp }) {
  const savedSettings = JSON.parse(
    localStorage.getItem("pharmaTrackSettings") || "{}"
  );

  const [pharmacyName, setPharmacyName] = useState(
    savedSettings.pharmacyName || "PharmaTrack Pharmacy"
  );

  const [phone, setPhone] = useState(
    savedSettings.phone || ""
  );

  const [address, setAddress] = useState(
    savedSettings.address || ""
  );

  const [expiryAlert, setExpiryAlert] = useState(
    savedSettings.expiryAlert ?? true
  );

  const [lowStockAlert, setLowStockAlert] = useState(
    savedSettings.lowStockAlert ?? true
  );

  const [invoiceGeneration, setInvoiceGeneration] = useState(
    savedSettings.invoiceGeneration ?? true
  );

  const [showPaymentMethod, setShowPaymentMethod] = useState(
    savedSettings.showPaymentMethod ?? true
  );

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const settings = {
      pharmacyName,
      phone,
      address,
      expiryAlert,
      lowStockAlert,
      invoiceGeneration,
      showPaymentMethod,
    };

    localStorage.setItem(
      "pharmaTrackSettings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  return (
    <div className="settings-page">

      {/* HEADER */}

      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your pharmacy system settings</p>
        </div>

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
      </div>

      {/* SUCCESS MESSAGE */}

      {saved && (
        <div className="settings-success">
          ✓ Settings saved successfully
        </div>
      )}

      {/* PHARMACY INFORMATION */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🏥
          </div>

          <div>
            <h2>Pharmacy Information</h2>
            <p>Basic information about your pharmacy</p>
          </div>

        </div>

        <div className="settings-form-grid">

          <div className="settings-field">

            <label>Pharmacy Name</label>

            <input
              type="text"
              value={pharmacyName}
              onChange={(e) =>
                setPharmacyName(e.target.value)
              }
              placeholder="Enter pharmacy name"
            />

          </div>

          <div className="settings-field">

            <label>Phone Number</label>

            <input
              type="text"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
              placeholder="Enter phone number"
            />

          </div>

          <div className="settings-field settings-field-full">

            <label>Address</label>

            <textarea
              value={address}
              onChange={(e) =>
                setAddress(e.target.value)
              }
              placeholder="Enter pharmacy address"
              rows="3"
            />

          </div>

        </div>

      </div>

      {/* NOTIFICATION SETTINGS */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🔔
          </div>

          <div>
            <h2>Notification Settings</h2>
            <p>Manage stock and expiry notifications</p>
          </div>

        </div>

        <div className="settings-option">

          <div>
            <strong>Expiry Notifications</strong>

            <span>
              Show notifications when medicines are close to expiry
            </span>
          </div>

          <label className="settings-switch">

            <input
              type="checkbox"
              checked={expiryAlert}
              onChange={(e) =>
                setExpiryAlert(e.target.checked)
              }
            />

            <span></span>

          </label>

        </div>

        <div className="settings-option">

          <div>
            <strong>Low Stock Notifications</strong>

            <span>
              Show notifications when stock reaches the reorder level
            </span>
          </div>

          <label className="settings-switch">

            <input
              type="checkbox"
              checked={lowStockAlert}
              onChange={(e) =>
                setLowStockAlert(e.target.checked)
              }
            />

            <span></span>

          </label>

        </div>

      </div>

      {/* SALES SETTINGS */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            🧾
          </div>

          <div>
            <h2>Sales Settings</h2>
            <p>Manage basic sales preferences</p>
          </div>

        </div>

        <div className="settings-option">

          <div>
            <strong>Invoice Generation</strong>

            <span>
              Generate an invoice after completing a sale
            </span>
          </div>

          <label className="settings-switch">

            <input
              type="checkbox"
              checked={invoiceGeneration}
              onChange={(e) =>
                setInvoiceGeneration(e.target.checked)
              }
            />

            <span></span>

          </label>

        </div>

        <div className="settings-option">

          <div>
            <strong>Show Payment Method</strong>

            <span>
              Display cash or card payment method on invoices
            </span>
          </div>

          <label className="settings-switch">

            <input
              type="checkbox"
              checked={showPaymentMethod}
              onChange={(e) =>
                setShowPaymentMethod(e.target.checked)
              }
            />

            <span></span>

          </label>

        </div>

      </div>

      {/* SYSTEM INFORMATION */}

      <div className="settings-card">

        <div className="settings-card-header">

          <div className="settings-card-icon">
            ⚙️
          </div>

          <div>
            <h2>System Information</h2>
            <p>PharmaTrack system information</p>
          </div>

        </div>

        <div className="settings-info-grid">

          <div>
            <span>System Name</span>
            <strong>PharmaTrack</strong>
          </div>

          <div>
            <span>System Type</span>
            <strong>Pharmacy Management System</strong>
          </div>

          <div>
            <span>Version</span>
            <strong>1.0.0</strong>
          </div>

        </div>

      </div>

      {/* NEED HELP */}

      <div className="settings-help">

        <div className="settings-help-icon">
          ?
        </div>

        <div className="settings-help-content">

          <h2>Need Help?</h2>

          <p>
            Having trouble using PharmaTrack?
            Get help and technical support.
          </p>

        </div>

        <button
          type="button"
          className="settings-help-btn"
          onClick={onNeedHelp}
        >
          Open Help Center →
        </button>

      </div>

      {/* SAVE */}

      <div className="settings-actions">

        <button
          type="button"
          className="settings-save-btn"
          onClick={handleSave}
        >
          ✓ Save Settings
        </button>

      </div>

    </div>
  );
}

export default Settings;