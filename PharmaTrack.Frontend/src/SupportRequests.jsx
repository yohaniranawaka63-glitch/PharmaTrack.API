import { useEffect, useState } from "react";
import axios from "axios";
import "./SupportRequests.css";

function SupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

const API = "https://pharmatrack-api-b0035.containers.snapdeploy.app/api";

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);
      setRequests(response.data);
    } catch (err) {
      console.error("Error loading support requests:", err);
      setError("Failed to load support requests.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${API_URL}/${id}/status`,
        JSON.stringify(status),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      loadRequests();
    } catch (err) {
      console.error("Error updating status:", err);

      alert(
        err.response?.data?.message ||
          "Failed to update request status."
      );
    }
  };

  const deleteRequest = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this support request?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      setRequests((prev) =>
        prev.filter((request) => request.requestId !== id)
      );
    } catch (err) {
      console.error("Error deleting request:", err);

      alert(
        err.response?.data?.message ||
          "Failed to delete support request."
      );
    }
  };

  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    if (status === "Resolved") return "status-resolved";
    if (status === "In Progress") return "status-progress";

    return "status-pending";
  };

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const progressCount = requests.filter(
    (request) => request.status === "In Progress"
  ).length;

  const resolvedCount = requests.filter(
    (request) => request.status === "Resolved"
  ).length;

  return (
    <div className="support-page">

      {/* HEADER */}
      <div className="support-header">
        <div>
          <h1>Support Requests</h1>
          <p>
            Review and manage support requests received from
            pharmacy users.
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
            type="button"
            className="support-refresh-btn"
            onClick={loadRequests}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="support-summary">

        <div className="support-summary-card">
          <span className="summary-label">Total Requests</span>
          <strong>{requests.length}</strong>
        </div>

        <div className="support-summary-card pending-card">
          <span className="summary-label">Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="support-summary-card progress-card">
          <span className="summary-label">In Progress</span>
          <strong>{progressCount}</strong>
        </div>

        <div className="support-summary-card resolved-card">
          <span className="summary-label">Resolved</span>
          <strong>{resolvedCount}</strong>
        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="support-error">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="support-table-card">

        <div className="support-table-header">
          <div>
            <h2>Support Request List</h2>
            <span>
              {requests.length} request
              {requests.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="support-empty">
            <div className="support-loading-icon">⟳</div>
            <h3>Loading requests...</h3>
          </div>
        ) : requests.length === 0 ? (
          <div className="support-empty">
            <div className="support-empty-icon">📭</div>
            <h3>No Support Requests</h3>
            <p>
              There are currently no support requests from
              pharmacy users.
            </p>
          </div>
        ) : (
          <div className="support-table-wrapper">
            <table className="support-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Request Type</th>
                  <th>Message</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.requestId}>

                    <td>
                      <strong>
                        #{request.requestId}
                      </strong>
                    </td>

                    <td>
                      <div className="support-user">
                        <div className="support-user-avatar">
                          👤
                        </div>

                        <div>
                          <strong>
                            User #{request.userId}
                          </strong>

                          <span>
                            Pharmacy User
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          request.requestType ===
                          "Remote Support"
                            ? "request-type remote-type"
                            : "request-type issue-type"
                        }
                      >
                        {request.requestType ===
                        "Remote Support"
                          ? "💻 Remote Support"
                          : "🛠️ System Issue"}
                      </span>
                    </td>

                    <td>
                      <div className="request-message">
                        {request.message}
                      </div>
                    </td>

                    <td>
                      <span className="request-date">
                        {formatDate(request.createdAt)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`request-status ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td>
                      <div className="request-actions">

                        {request.status === "Pending" && (
                          <button
                            type="button"
                            className="action-progress"
                            onClick={() =>
                              updateStatus(
                                request.requestId,
                                "In Progress"
                              )
                            }
                          >
                            Start
                          </button>
                        )}

                        {request.status === "In Progress" && (
                          <button
                            type="button"
                            className="action-resolve"
                            onClick={() =>
                              updateStatus(
                                request.requestId,
                                "Resolved"
                              )
                            }
                          >
                            Resolve
                          </button>
                        )}

                        {request.status === "Resolved" && (
                          <span className="resolved-label">
                            ✓ Completed
                          </span>
                        )}

                        <button
                          type="button"
                          className="action-delete"
                          onClick={() =>
                            deleteRequest(request.requestId)
                          }
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default SupportRequests;