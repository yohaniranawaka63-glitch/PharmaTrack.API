
import { useState } from "react";
import {
  LogOut,
  BookOpen,
  Wrench,
  Laptop,
  Phone,
  CheckCircle,
  ArrowRight,
  X,
  ShieldAlert,
} from "lucide-react";
import api from "./api";
import "./Help.css";

function Help() {
  const [activeModal, setActiveModal] = useState(null);
  const [issue, setIssue] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const USER_ID = 9;

  const closeModal = () => {
    setActiveModal(null);
    setSubmitted(false);
    setError("");
    setLoading(false);
    setIssue("");
    setSupportMessage("");
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();

    if (!issue.trim()) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/SupportRequest", {
        userId: USER_ID,
        requestType: "System Issue",
        message: issue.trim(),
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting issue:", error);

      setError(
        error.response?.data?.message ||
          "Failed to submit the issue. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();

    if (!supportMessage.trim()) return;

    setLoading(true);
    setError("");

    try {
      await api.post("/SupportRequest", {
        userId: USER_ID,
        requestType: "Remote Support",
        message: supportMessage.trim(),
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting support request:", error);

      setError(
        error.response?.data?.message ||
          "Failed to send the support request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  return (
    <div className="help-page">
      <div className="help-header">
        <div>
          <h1>Need Help?</h1>
          <p>Get help and support for using PharmaTrack.</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="help-logout-btn"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="help-grid">
        {/* HOW TO USE */}
        <div className="help-card">
          <div className="help-icon">
            <BookOpen size={25} />
          </div>

          <h2>How to Use PharmaTrack</h2>

          <p>
            Learn how to manage medicines, stock, sales, suppliers,
            reports, and other pharmacy operations.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setActiveModal("guide");
            }}
          >
            View Guide <ArrowRight size={15} />
          </button>
        </div>

        {/* REPORT ISSUE */}
        <div className="help-card">
          <div className="help-icon">
            <Wrench size={25} />
          </div>

          <h2>Report a System Issue</h2>

          <p>
            Found a problem while using the system? Report the issue
            to the PharmaTrack system administrator.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setActiveModal("issue");
            }}
          >
            Report Issue <ArrowRight size={15} />
          </button>
        </div>

        {/* REMOTE SUPPORT */}
        <div className="help-card">
          <div className="help-icon">
            <Laptop size={25} />
          </div>

          <h2>Remote Support</h2>

          <p>
            Request remote assistance when you need help fixing a
            PharmaTrack system problem.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setActiveModal("remote");
            }}
          >
            Request Support <ArrowRight size={15} />
          </button>
        </div>

        {/* CONTACT SUPPORT */}
        <div className="help-card">
          <div className="help-icon">
            <Phone size={25} />
          </div>

          <h2>Contact Support</h2>

          <p>
            Contact the PharmaTrack system administrator for
            technical assistance.
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              setActiveModal("contact");
            }}
          >
            Contact Support <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* MODAL */}
      {activeModal && (
        <div
          className="help-modal-overlay"
          onClick={closeModal}
        >
          <div
            className="help-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="help-modal-close"
              onClick={closeModal}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {/* USER GUIDE */}
            {activeModal === "guide" && (
              <>
                <div className="help-modal-icon">
                  <BookOpen size={27} />
                </div>

                <h2>PharmaTrack User Guide</h2>

                <p className="help-modal-description">
                  Follow these steps to use PharmaTrack correctly.
                </p>

                <div className="guide-list">
                  <div>
                    <strong>1. Dashboard</strong>
                    <span>
                      Use the Dashboard to get a quick overview of
                      pharmacy operations. You can view today's sales,
                      total bills, payment summaries, recent sales,
                      and stock information.
                    </span>
                  </div>

                  <div>
                    <strong>2. Medicines</strong>
                    <span>
                      Go to Medicines → Add Medicine. Enter the medicine
                      name, generic name, category, unit, and strength.
                      Click Save to add the medicine.
                    </span>
                  </div>

                  <div>
                    <strong>3. Stock</strong>
                    <span>
                      Go to Stock → Add Stock. Select the medicine,
                      supplier, batch name, manufacturing date, expiry
                      date, purchase price, selling price, and quantity.
                      Save the stock to add it to inventory.
                    </span>
                  </div>

                  <div>
                    <strong>4. Other Items</strong>
                    <span>
                      Use Other Items to manage pharmacy products that
                      are not medicines, such as diapers, personal care
                      products, medical items, and nutrition products.
                    </span>
                  </div>

                  <div>
                    <strong>5. Sales</strong>
                    <span>
                      Go to Sales → New Sale. Select the medicine or
                      other item, enter the required quantity, check
                      the total amount, select the payment method, and
                      complete the sale.
                    </span>
                  </div>

                  <div>
                    <strong>6. Suppliers</strong>
                    <span>
                      Use Suppliers to add and manage supplier details
                      such as supplier name, contact number, email, and
                      address.
                    </span>
                  </div>

                  <div>
                    <strong>7. Users</strong>
                    <span>
                      Administrators can use Users to manage system
                      users, assign roles, activate or deactivate
                      accounts, and update user information.
                    </span>
                  </div>

                  <div>
                    <strong>8. Reports</strong>
                    <span>
                      Open Reports to view Daily, Monthly, and Yearly
                      sales information. Reports can also be printed
                      when required.
                    </span>
                  </div>

                  <div>
                    <strong>9. Settings</strong>
                    <span>
                      Use Settings to update pharmacy information and
                      configure system options such as expiry alerts,
                      low-stock alerts, invoice generation, and payment
                      method display.
                    </span>
                  </div>

                  <div>
                    <strong>10. Need Help?</strong>
                    <span>
                      If you experience a system problem, use Report
                      Issue or Request Support from the Need Help page.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="help-modal-primary"
                  onClick={closeModal}
                >
                  Close Guide
                </button>
              </>
            )}

            {/* REPORT ISSUE */}
            {activeModal === "issue" && (
              <>
                <div className="help-modal-icon">
                  <Wrench size={27} />
                </div>

                <h2>Report a System Issue</h2>

                {!submitted ? (
                  <form onSubmit={handleIssueSubmit}>
                    <p className="help-modal-description">
                      Please describe the problem you experienced.
                    </p>

                    <textarea
                      className="help-textarea"
                      placeholder="Example: Sales page is not loading..."
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      rows="5"
                      disabled={loading}
                      required
                    />

                    {error && (
                      <p className="help-error-message">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="help-modal-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        "Submitting..."
                      ) : (
                        <>
                          <Wrench size={16} />
                          Submit Issue
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="help-success">
                    <div>
                      <CheckCircle size={30} />
                    </div>

                    <h3>Issue Submitted</h3>

                    <p>
                      Your issue has been recorded. The system
                      administrator can review it and provide support.
                    </p>

                    <button
                      type="button"
                      className="help-modal-primary"
                      onClick={closeModal}
                    >
                      Done
                    </button>
                  </div>
                )}
              </>
            )}

            {/* REMOTE SUPPORT */}
            {activeModal === "remote" && (
              <>
                <div className="help-modal-icon">
                  <Laptop size={27} />
                </div>

                <h2>Request Remote Support</h2>

                {!submitted ? (
                  <form onSubmit={handleSupportSubmit}>
                    <p className="help-modal-description">
                      Request assistance from the PharmaTrack system
                      administrator.
                    </p>

                    <div className="remote-warning">
                      <strong>
                        <ShieldAlert size={16} />
                        Important
                      </strong>

                      <span>
                        Remote access should only be provided with
                        permission from the pharmacy administrator.
                      </span>
                    </div>

                    <textarea
                      className="help-textarea"
                      placeholder="Explain what help you need..."
                      value={supportMessage}
                      onChange={(e) =>
                        setSupportMessage(e.target.value)
                      }
                      rows="5"
                      disabled={loading}
                      required
                    />

                    {error && (
                      <p className="help-error-message">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="help-modal-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        "Sending..."
                      ) : (
                        <>
                          <ArrowRight size={16} />
                          Send Support Request
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="help-success">
                    <div>
                      <CheckCircle size={30} />
                    </div>

                    <h3>Support Request Sent</h3>

                    <p>
                      Your remote support request has been submitted.
                      The system administrator can contact you to
                      provide assistance.
                    </p>

                    <button
                      type="button"
                      className="help-modal-primary"
                      onClick={closeModal}
                    >
                      Done
                    </button>
                  </div>
                )}
              </>
            )}

            {/* CONTACT SUPPORT */}
            {activeModal === "contact" && (
              <>
                <div className="help-modal-icon">
                  <Phone size={27} />
                </div>

                <h2>Contact Support</h2>

                <p className="help-modal-description">
                  Contact the PharmaTrack system administrator for
                  technical assistance.
                </p>

                <div className="contact-info">
                  <div>
                    <span>Support</span>
                    <strong>
                      PharmaTrack System Administrator
                    </strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>myprojectdetails08@gmail.com</strong>
                  </div>

                  <div>
                    <span>Availability</span>
                    <strong>Technical Support</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="help-modal-primary"
                  onClick={closeModal}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Help;