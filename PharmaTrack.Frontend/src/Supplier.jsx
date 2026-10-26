import { useEffect, useState } from "react";
import {
  Truck,
  ClipboardList,
  CheckCircle,
  CirclePause,
  Search,
  Plus,
  LogOut,
  X,
  Pencil,
  Trash2,
  Package,
  Mail,
  Phone,
  MapPin,
  Save,
  Ban,
  UserRoundCheck,
} from "lucide-react";
import api from "./api";
import "./Supplier.css";

function Supplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    supplierName: "",
    contactNumber: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  // LOAD SUPPLIERS
  const loadSuppliers = async () => {
    setLoading(true);

    try {
      const response = await api.get("/Supplier");

      const supplierList = Array.isArray(response.data)
        ? response.data
        : [];

      setSuppliers(
        supplierList.map((supplier) => ({
          ...supplier,
          supplierId: supplier.supplierId ?? supplier.SupplierId,
          supplierName: supplier.supplierName ?? supplier.SupplierName,
          contactNumber: supplier.contactNumber ?? supplier.ContactNumber,
          email: supplier.email ?? supplier.Email,
          address: supplier.address ?? supplier.Address,
          isActive: supplier.isActive ?? supplier.IsActive ?? true,
        }))
      );
    } catch (error) {
      console.error("LOAD SUPPLIERS ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load suppliers. Please check the API."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (supplier) => {
    const supplierId = Number(supplier.supplierId);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      alert("Supplier ID not found.");
      return;
    }

    const newStatus = !supplier.isActive;
    const action = newStatus ? "activate" : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${supplier.supplierName}"?`
      )
    ) {
      return;
    }

    try {
      const response = await api.patch(
        `/Supplier/${supplierId}/status`,
        { isActive: newStatus }
      );

      alert(
        response.data?.message ||
          `Supplier ${action}d successfully.`
      );

      await loadSuppliers();
    } catch (error) {
      console.error("SUPPLIER STATUS ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to change supplier status."
      );
    }
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setFormData({
      supplierName: "",
      contactNumber: "",
      email: "",
      address: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // ADD SUPPLIER FORM
  const handleAdd = () => {
    setEditingId(null);

    setFormData({
      supplierName: "",
      contactNumber: "",
      email: "",
      address: "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // EDIT SUPPLIER
  const handleEdit = (supplier) => {
    const id = Number(supplier.supplierId);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Supplier ID not found.");
      return;
    }

    setEditingId(id);

    setFormData({
      supplierName: supplier.supplierName || "",
      contactNumber: supplier.contactNumber || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ADD / UPDATE SUPPLIER
  const handleSubmit = async (e) => {
    e.preventDefault();

    const supplierName = formData.supplierName.trim();

    if (!supplierName) {
      alert("Please enter supplier name.");
      return;
    }

    const supplierData = {
      supplierName,
      contactNumber: formData.contactNumber.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        const updateData = {
          supplierId: Number(editingId),
          ...supplierData,
        };

        await api.put(`/Supplier/${editingId}`, updateData);

        alert("Supplier updated successfully.");
      } else {
        await api.post("/Supplier", supplierData);

        alert("Supplier added successfully.");
      }

      resetForm();
      await loadSuppliers();
    } catch (error) {
      console.error("SUPPLIER SAVE ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      const errorData = error.response?.data;

      const errorMessage =
        typeof errorData === "string"
          ? errorData
          : errorData?.message ||
            errorData?.title ||
            error.message ||
            "Failed to save supplier.";

      alert(`Unable to save supplier.\n\n${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // DELETE SUPPLIER
  const handleDelete = async (id) => {
    const supplierId = Number(id);

    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      alert("Supplier ID not found.");
      return;
    }

    const supplier = suppliers.find(
      (item) => Number(item.supplierId) === supplierId
    );

    const supplierName = supplier?.supplierName || "this supplier";

    if (
      !window.confirm(
        `Are you sure you want to delete "${supplierName}"?`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/Supplier/${supplierId}`);

      alert("Supplier deleted successfully.");
      await loadSuppliers();
    } catch (error) {
      console.error("SUPPLIER DELETE ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      const errorData = error.response?.data;

      const errorMessage =
        typeof errorData === "string"
          ? errorData
          : errorData?.message ||
            errorData?.title ||
            "Failed to delete supplier.";

      // Linked suppliers must be retained for existing stock history.
      if (error.response?.status === 409 && supplier) {
        const deactivate = window.confirm(
          `"${supplierName}" is linked to existing stock batches and cannot be deleted.\n\nWould you like to deactivate this supplier instead?`
        );

        if (deactivate) {
          try {
            const response = await api.patch(
              `/Supplier/${supplierId}/status`,
              { isActive: false }
            );

            alert(
              response.data?.message ||
                "Supplier deactivated successfully."
            );

            await loadSuppliers();
          } catch (statusError) {
            console.error("SUPPLIER DEACTIVATE ERROR:", statusError);

            alert(
              statusError.response?.data?.message ||
                "Could not deactivate this supplier."
            );
          }
        }

        return;
      }

      alert(`Unable to delete supplier.\n\n${errorMessage}`);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("pharmaTrackUser");
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // SEARCH
  const searchText = search.toLowerCase().trim();

  const filteredSuppliers = suppliers.filter((supplier) =>
    [
      supplier.supplierName,
      supplier.contactNumber,
      supplier.email,
      supplier.address,
      supplier.isActive ? "active" : "inactive",
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    )
  );

  // UI
  return (
    <div className="supplier-page">
      {/* HEADER */}
      <div className="supplier-header">
        <div>
          <h1>Supplier Management</h1>
          <p>Manage your pharmacy suppliers</p>
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
            className="add-supplier-btn"
            onClick={handleAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} />
            Add Supplier
          </button>
        </div>
      </div>

      {/* FORM */}
      {showForm && (
        <div className="supplier-form-card">
          <div className="form-card-header">
            <div>
              <h2>
                {editingId !== null
                  ? "Edit Supplier"
                  : "Add New Supplier"}
              </h2>
              <p>Enter supplier information below</p>
            </div>

            <button
              type="button"
              className="close-form-btn"
              onClick={resetForm}
              aria-label="Close form"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="supplier-form-grid">
              <div className="form-group">
                <label>Supplier Name *</label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  autoComplete="off"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter supplier address"
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <Ban size={17} />
                Cancel
              </button>

              <button
                type="submit"
                className="save-supplier-btn"
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                }}
              >
                <Save size={17} />
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Supplier"
                    : "Save Supplier"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="supplier-summary">
        <div className="supplier-summary-card">
          <div className="summary-icon">
            <Truck size={24} />
          </div>
          <div>
            <span>Total Suppliers</span>
            <strong>{suppliers.length}</strong>
          </div>
        </div>

        <div className="supplier-summary-card">
          <div className="summary-icon">
            <ClipboardList size={24} />
          </div>
          <div>
            <span>Displayed Suppliers</span>
            <strong>{filteredSuppliers.length}</strong>
          </div>
        </div>

        <div className="supplier-summary-card">
          <div className="summary-icon">
            <CheckCircle size={24} />
          </div>
          <div>
            <span>Active Suppliers</span>
            <strong>
              {suppliers.filter((supplier) => supplier.isActive).length}
            </strong>
          </div>
        </div>

        <div className="supplier-summary-card">
          <div className="summary-icon">
            <CirclePause size={24} />
          </div>
          <div>
            <span>Inactive Suppliers</span>
            <strong>
              {suppliers.filter((supplier) => !supplier.isActive).length}
            </strong>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="supplier-toolbar">
        <div className="supplier-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* SUPPLIER TABLE */}
      <div className="supplier-table-card">
        <div className="table-header">
          <div>
            <h2>Suppliers</h2>
            <p>
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-supplier">
            <h3>Loading suppliers...</h3>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="empty-supplier">
            <div className="empty-icon">
              <Truck size={34} />
            </div>
            <h3>No suppliers found</h3>
            <p>
              {search
                ? "Try a different search term."
                : "Add your first supplier to get started."}
            </p>

            {!search && (
              <button
                type="button"
                className="empty-add-btn"
                onClick={handleAdd}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Plus size={18} />
                Add Supplier
              </button>
            )}
          </div>
        ) : (
          <div className="supplier-table-wrapper">
            <table className="supplier-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier Name</th>
                  <th>Contact Number</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredSuppliers.map((supplier) => {
                  const supplierId = Number(supplier.supplierId);

                  return (
                    <tr key={supplierId}>
                      <td>
                        <span className="supplier-id">
                          #{supplierId}
                        </span>
                      </td>

                      <td>
                        <div className="supplier-name-cell">
                          <div className="supplier-avatar">
                            {(supplier.supplierName || "S")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <strong>{supplier.supplierName}</strong>
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "7px",
                          }}
                        >
                          <Phone size={15} color="#64748b" />
                          {supplier.contactNumber || "-"}
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
                          {supplier.email || "-"}
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
                          <MapPin size={15} color="#64748b" />
                          {supplier.address || "-"}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: supplier.isActive ? "#166534" : "#991b1b",
                            background: supplier.isActive ? "#dcfce7" : "#fee2e2",
                          }}
                        >
                          {supplier.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td>
                        <div className="supplier-actions">
                          <button
                            type="button"
                            className="edit-supplier-btn"
                            onClick={() => handleEdit(supplier)}
                            title="Edit Supplier"
                            aria-label="Edit Supplier"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            className="delete-supplier-btn"
                            onClick={() => handleDelete(supplierId)}
                            title="Delete Supplier"
                            aria-label="Delete Supplier"
                            disabled={saving}
                          >
                            <Trash2 size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(supplier)}
                            title={
                              supplier.isActive
                                ? "Deactivate Supplier"
                                : "Activate Supplier"
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                              border: "none",
                              borderRadius: "6px",
                              padding: "7px 10px",
                              cursor: "pointer",
                              fontWeight: 600,
                              color: "#fff",
                              background: supplier.isActive
                                ? "#d97706"
                                : "#16a34a",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {supplier.isActive ? (
                              <>
                                <CirclePause size={15} />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserRoundCheck size={15} />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Supplier;