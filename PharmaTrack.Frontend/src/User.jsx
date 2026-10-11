import { useEffect, useState } from "react";
import axios from "axios";
import "./User.css";

const API_URL = "http://https://pharmatrack-api-b0035.containers.snapdeploy.app/api/api";

const emptyForm = {
  name: "",
  userName: "",
  password: "",
  roleId: "",
  status: true,
};

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

  // =========================================================
  // LOAD USERS
  // =========================================================

  const loadUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/User`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD ROLES
  // =========================================================

  const loadRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/Role`);
      setRoles(response.data);
    } catch (error) {
      console.error("Error loading roles:", error);
      alert("Failed to load roles.");
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // =========================================================
  // OPEN ADD FORM
  // =========================================================

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  // =========================================================
  // OPEN EDIT FORM
  // =========================================================

  const openEditForm = (user) => {
    setEditingId(user.userId);

    setFormData({
      name: user.name || "",
      userName: user.userName || "",
      password: "",
      roleId: user.roleId ? user.roleId.toString() : "",
      status: user.status,
    });

    setShowForm(true);
  };

  // =========================================================
  // CLOSE FORM
  // =========================================================

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
  };

  // =========================================================
  // VALIDATION
  // =========================================================

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Please enter the user's full name.");
      return false;
    }

    if (!formData.userName.trim()) {
      alert("Please enter a username.");
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

  // =========================================================
  // SAVE USER
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const data = {
        name: formData.name.trim(),
        userName: formData.userName.trim(),
        password: formData.password,
        roleId: Number(formData.roleId),
        status: formData.status,
      };

      if (editingId) {
        await axios.put(
          `${API_URL}/User/${editingId}`,
          data
        );

        alert("User updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/User`,
          data
        );

        alert("User created successfully.");
      }

      closeForm();
      await loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);

      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Failed to save user.");
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE USER
  // =========================================================

  const handleDelete = async (user) => {
    if (deletingId) {
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${user.name}"?\n\n` +
      "This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(user.userId);

      await axios.delete(
        `${API_URL}/User/${user.userId}`
      );

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

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // =========================================================
  // GET ROLE NAME
  // =========================================================

  const getRoleName = (roleId) => {
    const role = roles.find(
      (role) => role.roleId === roleId
    );

    return role ? role.roleName : "Unknown";
  };

  // =========================================================
  // ROLE CSS CLASS
  // =========================================================

  const getRoleClass = (roleName) => {
    if (roleName === "Admin") {
      return "admin";
    }

    if (roleName === "Pharmacist") {
      return "pharmacist";
    }

    if (roleName === "Cashier") {
      return "cashier";
    }

    return "default";
  };

  // =========================================================
  // GET INITIALS
  // =========================================================

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // =========================================================
  // FILTER USERS
  // =========================================================

  const filteredUsers = users.filter((user) => {
    const roleName = getRoleName(user.roleId);

    const searchText = `
      ${user.name || ""}
      ${user.userName || ""}
      ${roleName}
    `.toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const activeUsers = users.filter(
    (user) => user.status
  ).length;

  const inactiveUsers = users.filter(
    (user) => !user.status
  ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="users-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="users-header">

        <div>
          <h1>User Management</h1>

          <p>
            Manage pharmacy staff, roles and account access
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
            className="users-add-button"
            onClick={openAddForm}
            disabled={saving}
          >
            + Add User
          </button>

        </div>

      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="users-summary">

        <div className="user-summary-box green">

          <div className="summary-icon">
            👥
          </div>

          <div>
            <span>Total Users</span>

            <strong>
              {users.length}
            </strong>

            <small>
              Registered users
            </small>
          </div>

        </div>

        <div className="user-summary-box blue">

          <div className="summary-icon">
            ✓
          </div>

          <div>
            <span>Active Users</span>

            <strong>
              {activeUsers}
            </strong>

            <small>
              Currently active
            </small>
          </div>

        </div>

        <div className="user-summary-box orange">

          <div className="summary-icon">
            ⏸
          </div>

          <div>
            <span>Inactive Users</span>

            <strong>
              {inactiveUsers}
            </strong>

            <small>
              Access disabled
            </small>
          </div>

        </div>

        <div className="user-summary-box purple">

          <div className="summary-icon">
            🛡
          </div>

          <div>
            <span>Roles</span>

            <strong>
              {roles.length}
            </strong>

            <small>
              System roles
            </small>
          </div>

        </div>

      </div>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="users-search-section">

        <div className="users-search">

          <span>🔍</span>

          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="users-clear-search"
            >
              ×
            </button>
          )}

        </div>

        <div className="users-count-card">

          <span>
            Showing
          </span>

          <strong>
            {filteredUsers.length}
          </strong>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="users-table-card">

        <div className="users-table-heading">

          <h2>
            User List
          </h2>

          <p>
            All pharmacy system users and their access roles
          </p>

        </div>

        <div className="users-table-wrapper">

          <table className="users-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="no-users"
                  >

                    <div>
                      ⏳
                    </div>

                    <strong>
                      Loading users...
                    </strong>

                  </td>

                </tr>

              ) : filteredUsers.length > 0 ? (

                filteredUsers.map((user) => {

                  const roleName =
                    getRoleName(user.roleId);

                  return (
                    <tr key={user.userId}>

                      {/* ID */}

                      <td>

                        <span className="user-id">
                          #{user.userId}
                        </span>

                      </td>

                      {/* USER */}

                      <td>

                        <div className="user-name-cell">

                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>

                          <div>

                            <strong>
                              {user.name}
                            </strong>

                            <small>
                              User ID #{user.userId}
                            </small>

                          </div>

                        </div>

                      </td>

                      {/* USERNAME */}

                      <td>

                        <span className="username">
                          @{user.userName}
                        </span>

                      </td>

                      {/* ROLE */}

                      <td>

                        <span
                          className={`role-badge ${getRoleClass(
                            roleName
                          )}`}
                        >
                          {roleName}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={
                            user.status
                              ? "user-status active"
                              : "user-status inactive"
                          }
                        >

                          <span></span>

                          {user.status
                            ? "Active"
                            : "Inactive"}

                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="user-actions">

                          <button
                            className="edit-user-button"
                            onClick={() =>
                              openEditForm(user)
                            }
                            disabled={
                              deletingId ===
                              user.userId
                            }
                          >
                            ✎ Edit
                          </button>

                          <button
                            className="delete-user-button"
                            onClick={() =>
                              handleDelete(user)
                            }
                            disabled={
                              deletingId ===
                              user.userId
                            }
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

                  <td
                    colSpan="6"
                    className="no-users"
                  >

                    <div>
                      👤
                    </div>

                    <strong>
                      No users found
                    </strong>

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

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (

        <div className="users-modal-overlay">

          <div className="users-modal">

            {/* MODAL HEADER */}

            <div className="users-modal-header">

              <div>

                <h2>
                  {editingId
                    ? "Edit User"
                    : "Add New User"}
                </h2>

                <p>
                  {editingId
                    ? "Update user account details"
                    : "Create a new pharmacy system user"}
                </p>

              </div>

              <button
                onClick={closeForm}
                className="users-modal-close"
                disabled={saving}
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              className="users-form"
              onSubmit={handleSubmit}
            >

              <div className="users-form-grid">

                {/* FULL NAME */}

                <div className="users-form-group full">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    disabled={saving}
                  />

                </div>

                {/* USERNAME */}

                <div className="users-form-group">

                  <label>
                    Username
                  </label>

                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    disabled={saving}
                  />

                </div>

                {/* PASSWORD */}

                <div className="users-form-group">

                  <label>
                    Password
                  </label>

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
                  />

                  {editingId && (
                    <small>
                      Leave empty to keep the current password.
                    </small>
                  )}

                  {!editingId && (
                    <small>
                      Minimum 6 characters.
                    </small>
                  )}

                </div>

                {/* ROLE */}

                <div className="users-form-group">

                  <label>
                    Role
                  </label>

                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    disabled={saving}
                  >

                    <option value="">
                      Select Role
                    </option>

                    {roles.map((role) => (

                      <option
                        key={role.roleId}
                        value={role.roleId}
                      >
                        {role.roleName}
                      </option>

                    ))}

                  </select>

                </div>

                {/* STATUS */}

                <div className="users-form-group status-group">

                  <label>
                    Account Status
                  </label>

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
                        {formData.status
                          ? "Active User"
                          : "Inactive User"}
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

              {/* FORM BUTTONS */}

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