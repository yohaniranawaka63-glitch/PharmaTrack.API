
import { useEffect, useState } from "react";
import {
  LogOut,
  RefreshCw,
  UserRound,
  Laptop,
  Wrench,
  Inbox,
  Play,
  CheckCircle,
  Trash2,
  LoaderCircle,
} from "lucide-react";
import api from "./api";
import "./SupportRequests.css";

function SupportRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/SupportRequest");
      const responseData = response.data;

      const requestList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.data)
          ? responseData.data
          : [];

      setRequests(
        requestList.map((request) => ({
          ...request,
          requestId: request.RequestId ?? request.requestId,
          userId: request.UserId ?? request.userId,
          requestType: request.RequestType ?? request.requestType,
          message: request.Message ?? request.message,
          createdAt: request.CreatedAt ?? request.createdAt,
          status: request.Status ?? request.status ?? "Pending",
        }))
      );
    } catch (err) {
      console.error(
        "Error loading support requests:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Failed to load support requests."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/SupportRequest/${id}/status`, { status });
      await loadRequests();
    } catch (err) {
      console.error(
        "Error updating status:",
        err.response?.data || err.message
      );

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
      await api.delete(`/SupportRequest/${id}`);

      setRequests((prev) =>
        prev.filter(
          (request) =>
            Number(request.requestId) !== Number(id)
        )
      );
    } catch (err) {
      console.error(
        "Error deleting request:",
        err.response?.data || err.message
      );

      alert(
        err.response?.data?.message ||
          "Failed to delete support request."
      );
    }
  };

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
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              border: "none",
              background: "#dc3545",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            <LogOut size={17} />
            Logout
          </button>

          <button
            type="button"
            className="support-refresh-btn"
            onClick={loadRequests}
          >
            <RefreshCw size={16} />
            Refresh
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
            <div className="support-loading-icon">
              <LoaderCircle size={30} className="support-spinner" />
            </div>
            <h3>Loading requests...</h3>
          </div>
        ) : requests.length === 0 ? (
          <div className="support-empty">
            <div className="support-empty-icon">
              <Inbox size={36} strokeWidth={1.7} />
            </div>
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
                      <strong>#{request.requestId}</strong>
                    </td>

                    <td>
                      <div className="support-user">
                        <div className="support-user-avatar">
                          <UserRound size={19} />
                        </div>

                        <div>
                          <strong>
                            User #{request.userId}
                          </strong>
                          <span>Pharmacy User</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={
                          request.requestType === "Remote Support"
                            ? "request-type remote-type"
                            : "request-type issue-type"
                        }
                      >
                        {request.requestType === "Remote Support" ? (
                          <>
                            <Laptop size={15} />
                            Remote Support
                          </>
                        ) : (
                          <>
                            <Wrench size={15} />
                            System Issue
                          </>
                        )}
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
                            <Play size={14} />
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
                            <CheckCircle size={14} />
                            Resolve
                          </button>
                        )}

                        {request.status === "Resolved" && (
                          <span className="resolved-label">
                            <CheckCircle size={15} />
                            Completed
                          </span>
                        )}

                        <button
                          type="button"
                          className="action-delete"
                          onClick={() =>
                            deleteRequest(request.requestId)
                          }
                        >
                          <Trash2 size={14} />
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