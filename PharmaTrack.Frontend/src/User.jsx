import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  Search,
  Plus,
  LogOut,
  X,
  Pencil,
  Trash2,
  Clock,
  Mail,
  Check,
  Save,
  Ban,
} from "lucide-react";
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

function getField(obj, ...keys) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) {
      return obj[key];
    }
  }
  return undefined;
}

function getUserEmail(user) {
  return getField(user, "email", "Email") ?? "";
}

function normalizeUser(user) {
  return {
    ...user,
    userId: getField(user, "userId", "UserId", "id", "Id"),
    name: getField(user, "name", "Name") ?? "",
    userName: getField(user, "userName", "UserName", "username", "Username") ?? "",
    email: getUserEmail(user),
    roleId: getField(user, "roleId", "RoleId"),
    status: getField(user, "status", "Status", "isActive", "IsActive") ?? false,
  };
}

function normalizeRole(role) {
  return {
    ...role,
    roleId: getField(role, "roleId", "RoleId", "id", "Id"),
    roleName: getField(role, "roleName", "RoleName", "name", "Name") ?? "",
  };
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
      setLoading(true);

      const response = await api.get("/User");

      console.log("Users API response:", response.data);

      const rawUsers = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? response.data?.items ?? [];

      setUsers(rawUsers.map(normalizeUser));
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

      const rawRoles = Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? response.data?.items ?? [];

      setRoles(rawRoles.map(normalizeRole));
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

    if (editingId == null && !formData.password.trim()) {
      alert("Please enter a password.");
      return false;
    }

    if (editingId == null && formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return false;
    }

    if (
      editingId != null &&
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

      console.log("Submitting user data:", {
        ...data,
        password: data.password ? "[HIDDEN]" : "",
      });

      if (editingId != null) {
        await api.put(`/User/${editingId}`, data);
      } else {
        await api.post("/User", data);
      }

      alert(
        editingId != null
          ? "User updated successfully."
          : "User created successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setFormData({ ...emptyForm });

      await loadUsers();
    } catch (error) {
      console.error("Error saving user:", error);

      const errorData = error.response?.data;

      console.log("API status:", error.response?.status);
      console.log("API error response:", errorData);

      const message =
        errorData?.message ||
        errorData?.error ||
        "Failed to save user. Check the backend API.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };
  // DELETE USER
  const handleDelete = async (user) => {
    if (deletingId !== null) return;

    if (user.userId == null) {
      alert("User ID not found.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${user.name}"?\n\nThis action cannot be undone.`
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
const getRoleName = (roleId) => {
  const role = roles.find(
    (item) => Number(item.roleId) === Number(roleId)
  );

  if (role?.roleName) return role.roleName;

  const roleNames = {
    1: "Admin",
    2: "Pharmacist",
    3: "Cashier",
  };

  return roleNames[Number(roleId)] ?? "Unknown";
};

  // ROLE CSS CLASS
  const getRoleClass = (roleName) => {
    const role = String(roleName).toLowerCase();

    if (role === "admin") return "admin";
    if (role === "pharmacist") return "pharmacist";
    if (role === "cashier") return "cashier";

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
  const searchText = search.trim().toLowerCase();

  const filteredUsers = users.filter((user) => {
    const roleName = getRoleName(user.roleId);

    const searchableText = [
      user.userId,
      user.name,
      user.userName,
      user.email,
      user.roleId,
      roleName,
      user.status ? "active" : "inactive",
    ]
      .map((value) => String(value ?? ""))
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchText);
  });

  // SUMMARY COUNTS
  const activeUsers = users.filter((user) => Boolean(user.status)).length;
  const inactiveUsers = users.length - activeUsers;

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
            type="button"
            className="users-add-button"
            onClick={openAddForm}
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="users-summary">
        <div className="user-summary-box green">
          <div className="summary-icon">
            <Users size={24} />
          </div>
          <div>
            <span>Total Users</span>
            <strong>{users.length}</strong>
            <small>Registered users</small>
          </div>
        </div>

        <div className="user-summary-box blue">
          <div className="summary-icon">
            <UserCheck size={24} />
          </div>
          <div>
            <span>Active Users</span>
            <strong>{activeUsers}</strong>
            <small>Currently active</small>
          </div>
        </div>

        <div className="user-summary-box orange">
          <div className="summary-icon">
            <UserX size={24} />
          </div>
          <div>
            <span>Inactive Users</span>
            <strong>{inactiveUsers}</strong>
            <small>Access disabled</small>
          </div>
        </div>

        <div className="user-summary-box purple">
          <div className="summary-icon">
            <ShieldCheck size={24} />
          </div>
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
          <Search size={18} />

          <input
            type="text"
            placeholder="Search ID, user, username, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="users-clear-search"
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={17} />
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
                <th>User ID</th>
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
                  <td colSpan={8} className="no-users">
                    <div>
                      <Clock size={28} />
                    </div>
                    <strong>Loading users...</strong>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => {
                  const roleName = getRoleName(user.roleId);
                  const email = getUserEmail(user);

                  return (
                    <tr key={user.userId ?? index}>

                      <td>
                        <span className="user-id">
                          {user.userId ?? "-"}
                        </span>
                      </td>

                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <strong>{user.name || "Name unavailable"}</strong>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="username">
                          {user.userName ? `@${user.userName}` : "-"}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          <Mail size={15} color="#64748b" />
                          {email || "Not added"}
                        </span>
                      </td>

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
                            disabled={
                              deletingId === user.userId ||
                              user.userId == null
                            }
                            title="Edit User"
                            aria-label="Edit User"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-user-button"
                            onClick={() => handleDelete(user)}
                            disabled={
                              deletingId === user.userId ||
                              user.userId == null
                            }
                            title="Delete User"
                            aria-label="Delete User"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            {deletingId === user.userId ? (
                              <>
                                <Clock size={15} />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 size={15} />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="no-users">
                    <div>
                      <Users size={32} />
                    </div>
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
                <h2>
                  {editingId != null ? "Edit User" : "Add New User"}
                </h2>
                <p>
                  {editingId != null
                    ? "Update user account details"
                    : "Create a new pharmacy system user"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="users-modal-close"
                disabled={saving}
                aria-label="Close form"
                title="Close"
              >
                <X size={20} />
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
                      editingId != null
                        ? "New password (optional)"
                        : "Enter password"
                    }
                    disabled={saving}
                    required={editingId == null}
                    minLength={6}
                  />

                  {editingId != null && (
                    <small>
                      Leave empty to keep the current password.
                    </small>
                  )}

                  {editingId == null && (
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

                    {roles.map((role, index) => (
                      <option
                        key={role.roleId ?? index}
                        value={role.roleId}
                      >
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
                      checked={Boolean(formData.status)}
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
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                  }}
                >
                  <Ban size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-save"
                  disabled={saving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                  }}
                >
                  {saving ? (
                    <>
                      <Clock size={16} />
                      Saving...
                    </>
                  ) : editingId != null ? (
                    <>
                      <Check size={16} />
                      Update User
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save User
                    </>
                  )}
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