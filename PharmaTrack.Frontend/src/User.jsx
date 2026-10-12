
import { useEffect, useState } from "react";
import api from "./api";
import "./User.css";

const emptyForm = {
  name: "",
  userName: "",
  email: "",
  password: "",
  roleId: "",
  status: true,
};

function getUserEmail(user) {
  return user?.email ?? user?.Email ?? "";
}

function User() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // LOAD USERS
  const loadUsers = async () => {
    try {
      const response = await api.get("/User");

      console.log("Users API response:", response.data);

      const data = Array.isArray(response.data)
        ? response.data.map((user) => ({
            ...user,
            email: getUserEmail(user),
          }))
        : [];

      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users. Please check the API.");
    } finally {
      setLoading(false);
    }
  };

  // LOAD ROLES
  const loadRoles = async () => {
    try {
      const response = await api.get("/Role");
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error loading roles:", error);
      alert("Failed to load roles.");
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // INPUT CHANGE
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // OPEN ADD FORM
  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  // OPEN EDIT FORM
  const openEditForm = (user) => {
    setEditingId(user.userId);

    setFormData({
      name: user.name || "",
      userName: user.userName || "",
      email: getUserEmail(user),
      password: "",
      roleId: user.roleId != null ? String(user.roleId) : "",
      status: Boolean(user.status),
    });

    setShowForm(true);
  };

  // CLOSE FORM
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
  };

  // VALIDATION
  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Please enter the user's full name.");
      return false;
    }

    if (!formData.userName.trim()) {
      alert("Please enter a username.");
      return false;
    }

    const email = formData.email.trim();

    if (!email) {
      alert("Please enter an email address.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }

    if (!editingId && !formData.password.trim()) {
      alert("Please enter a password.");
      return false;
    }

    if (!editingId && formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return false;
    }

    if (
      editingId &&
      formData.password.trim() &&
      formData.password.length < 6
    ) {
      alert("New password must be at least 6 characters.");
      return false;
    }

    if (!formData.roleId) {
      alert("Please select a role.");
      return false;
    }

    return true;
  };

  // SAVE / UPDATE USER
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving || !validateForm()) return;

    try {
      setSaving(true);

      const data = {
        name: formData.name.trim(),
        userName: formData.userName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        roleId: Number(formData.roleId),
        status: formData.status,
      };

      let response;

      if (editingId) {
        response = await api.put(`/User/${editingId}`, data);
      } else {
        response = await api.post("/User", data);
      }

      // DEBUG: Check the exact data returned by the API
      const responseEmail = getUserEmail(response.data);

      console.log("Submitted email:", data.email);
      console.log(
        "Saved user response:",
        JSON.stringify(response.data, null, 2)
      );
      console.log("Email returned by API:", responseEmail);

      if (
        responseEmail &&
        responseEmail.trim().toLowerCase() !== data.email
      ) {
        console.warn("Returned email differs from submitted email.", {
          submittedEmail: data.email,
          returnedEmail: responseEmail,
        });
      }

      if (!responseEmail) {
        console.warn(
          "The API save response did not contain an email field. " +
            "Check the UserController response and GET /api/User."
        );
      }

      alert(
        editingId
          ? "User updated successfully."
          : "User created successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });

      await loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      console.error("API error response:", error.response?.data);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to save user. Please check the API connection.");
      }
    } finally {
      setSaving(false);
    }
  };

  // DELETE USER
  const handleDelete = async (user) => {
    if (deletingId !== null) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${user.name}"?\n\n` +
        "This action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(user.userId);

      await api.delete(`/User/${user.userId}`);

      alert("User deleted successfully.");
      await loadUsers();
    } catch (error) {
      console.error("Error deleting user:", error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert(
          "This user cannot be deleted because it is currently used by other records."
        );
      }
    } finally {
      setDeletingId(null);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("pharmaTrackUser");
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // GET ROLE NAME
  const getRoleName = (roleId) => {
    const role = roles.find(
      (role) => Number(role.roleId) === Number(roleId)
    );

    return role ? role.roleName : "Unknown";
  };

  // ROLE CSS CLASS
  const getRoleClass = (roleName) => {
    if (roleName === "Admin") return "admin";
    if (roleName === "Pharmacist") return "pharmacist";
    if (roleName === "Cashier") return "cashier";
    return "default";
  };

  // GET INITIALS
  const getInitials = (name) => {
    if (!name) return "U";

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // FILTER USERS
  const filteredUsers = users.filter((user) => {
    const roleName = getRoleName(user.roleId);

    const searchText = `
      ${user.name || ""}
      ${user.userName || ""}
      ${getUserEmail(user)}
      ${roleName}
    `.toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  // SUMMARY COUNTS
  const activeUsers = users.filter((user) => user.status).length;
  const inactiveUsers = users.filter((user) => !user.status).length;

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage pharmacy staff, roles and account access</p>
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
            className="users-add-button"
            onClick={openAddForm}
            disabled={saving}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="users-summary">
        <div className="user-summary-box green">
          <div className="summary-icon">👥</div>
          <div>
            <span>Total Users</span>
            <strong>{users.length}</strong>
            <small>Registered users</small>
          </div>
        </div>

        <div className="user-summary-box blue">
          <div className="summary-icon">✓</div>
          <div>
            <span>Active Users</span>
            <strong>{activeUsers}</strong>
            <small>Currently active</small>
          </div>
        </div>

        <div className="user-summary-box orange">
          <div className="summary-icon">⏸</div>
          <div>
            <span>Inactive Users</span>
            <strong>{inactiveUsers}</strong>
            <small>Access disabled</small>
          </div>
        </div>

        <div className="user-summary-box purple">
          <div className="summary-icon">🛡</div>
          <div>
            <span>Roles</span>
            <strong>{roles.length}</strong>
            <small>System roles</small>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="users-search-section">
        <div className="users-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search user, username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="users-clear-search"
            >
              ×
            </button>
          )}
        </div>

        <div className="users-count-card">
          <span>Showing</span>
          <strong>{filteredUsers.length}</strong>
        </div>
      </div>

      {/* TABLE */}
      <div className="users-table-card">
        <div className="users-table-heading">
          <h2>User List</h2>
          <p>All pharmacy system users and their access roles</p>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="no-users">
                    <div>⏳</div>
                    <strong>Loading users...</strong>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const roleName = getRoleName(user.roleId);
                  const email = getUserEmail(user);

                  return (
                    <tr key={user.userId}>
                      <td>
                        <span className="user-id">#{user.userId}</span>
                      </td>

                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <strong>{user.name}</strong>
                            <small>User ID #{user.userId}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="username">
                          @{user.userName}
                        </span>
                      </td>

                      <td>{email || "Not added"}</td>

                      <td>
                        <span
                          className={`role-badge ${getRoleClass(roleName)}`}
                        >
                          {roleName}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.status
                              ? "user-status active"
                              : "user-status inactive"
                          }
                        >
                          <span></span>
                          {user.status ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="user-actions">
                          <button
                            type="button"
                            className="edit-user-button"
                            onClick={() => openEditForm(user)}
                            disabled={deletingId === user.userId}
                          >
                            ✎ Edit
                          </button>

                          <button
                            type="button"
                            className="delete-user-button"
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.userId}
                          >
                            {deletingId === user.userId
                              ? "Deleting..."
                              : "🗑 Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="no-users">
                    <div>👤</div>
                    <strong>No users found</strong>
                    <p>
                      {search
                        ? "Try another search."
                        : "Add a new user to get started."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="users-modal-overlay">
          <div className="users-modal">
            <div className="users-modal-header">
              <div>
                <h2>{editingId ? "Edit User" : "Add New User"}</h2>
                <p>
                  {editingId
                    ? "Update user account details"
                    : "Create a new pharmacy system user"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="users-modal-close"
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form className="users-form" onSubmit={handleSubmit}>
              <div className="users-form-grid">
                <div className="users-form-group full">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="users-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    disabled={saving}
                    required
                  />
                </div>

                <div className="users-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={saving}
                    required
                  />
                  <small>Use an email address you can access.</small>
                </div>

                <div className="users-form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={
                      editingId
                        ? "New password (optional)"
                        : "Enter password"
                    }
                    disabled={saving}
                    required={!editingId}
                    minLength={6}
                  />

                  {editingId && (
                    <small>
                      Leave empty to keep the current password.
                    </small>
                  )}

                  {!editingId && (
                    <small>Minimum 6 characters.</small>
                  )}
                </div>

                <div className="users-form-group">
                  <label>Role</label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    disabled={saving}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="users-form-group status-group">
                  <label>Account Status</label>
                  <label className="status-toggle">
                    <input
                      type="checkbox"
                      name="status"
                      checked={formData.status}
                      onChange={handleInputChange}
                      disabled={saving}
                    />
                    <span></span>
                    <div>
                      <strong>
                        {formData.status ? "Active User" : "Inactive User"}
                      </strong>
                      <small>
                        {formData.status
                          ? "User can access the system"
                          : "User access is disabled"}
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="users-form-actions">
                <button
                  type="button"
                  onClick={closeForm}
                  className="users-cancel"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-save"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "✓ Update User"
                    : "+ Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default User;
