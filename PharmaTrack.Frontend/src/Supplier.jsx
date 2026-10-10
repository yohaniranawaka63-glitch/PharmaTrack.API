import { useEffect, useState } from "react";
import axios from "axios";
import "./Supplier.css";

const API = "http://localhost:5275/api";

function Supplier() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    supplierName: "",
    contactNumber: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  // ==============================
  // LOAD SUPPLIERS
  // ==============================
  const loadSuppliers = async () => {
    try {
      const response = await axios.get(`${API}/Supplier`);

      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("LOAD SUPPLIERS ERROR:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load suppliers."
      );
    }
  };

  // ==============================
  // INPUT CHANGE
  // ==============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==============================
  // RESET FORM
  // ==============================
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

  // ==============================
  // ADD SUPPLIER
  // ==============================
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

  // ==============================
  // EDIT SUPPLIER
  // ==============================
  const handleEdit = (supplier) => {
    const id = supplier?.supplierId;

    if (!id) {
      alert("Supplier ID not found.");
      return;
    }

    setEditingId(Number(id));

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

  // ==============================
  // ADD / UPDATE SUPPLIER
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const supplierName = formData.supplierName.trim();

    if (!supplierName) {
      alert("Please enter supplier name.");
      return;
    }

    try {
      // ==========================
      // UPDATE
      // ==========================
      if (editingId !== null) {
        const updateData = {
          supplierId: Number(editingId),
          supplierName: supplierName,
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        };

        console.log("UPDATE SUPPLIER:", updateData);

        await axios.put(
          `${API}/Supplier/${Number(editingId)}`,
          updateData
        );

        alert("Supplier updated successfully.");
      }

      // ==========================
      // ADD
      // ==========================
      else {
        const addData = {
          supplierName: supplierName,
          contactNumber: formData.contactNumber.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        };

        console.log("ADD SUPPLIER:", addData);

        await axios.post(`${API}/Supplier`, addData);

        alert("Supplier added successfully.");
      }

      resetForm();

      await loadSuppliers();
    } catch (error) {
      console.error("SUPPLIER SAVE ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.response?.data ||
          "Failed to save supplier."
      );
    }
  };

  // ==============================
  // DELETE SUPPLIER
  // ==============================
  const handleDelete = async (id) => {
    const supplierId = Number(id);

    console.log("DELETE SUPPLIER ID:", supplierId);

    if (!supplierId || Number.isNaN(supplierId)) {
      alert("Supplier ID not found.");
      return;
    }

    const supplier = suppliers.find(
      (item) => Number(item.supplierId) === supplierId
    );

    const supplierName =
      supplier?.supplierName || "this supplier";

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${supplierName}"?`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      console.log(
        "DELETE URL:",
        `${API}/Supplier/${supplierId}`
      );

      const response = await axios.delete(
        `${API}/Supplier/${supplierId}`
      );

      console.log(
        "DELETE SUPPLIER RESPONSE:",
        response
      );

      alert("Supplier deleted successfully.");

      // Remove from UI immediately
      setSuppliers((prev) =>
        prev.filter(
          (item) =>
            Number(item.supplierId) !== supplierId
        )
      );

      // Reload from database
      await loadSuppliers();
    } catch (error) {
      console.error("SUPPLIER DELETE ERROR:", error);
      console.error("DELETE STATUS:", error.response?.status);
      console.error("DELETE DATA:", error.response?.data);

      const errorData = error.response?.data;

      let errorMessage =
        "Failed to delete supplier.";

      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(
        `Unable to delete supplier.\n\n${errorMessage}`
      );
    }
  };

  // ==============================
  // LOGOUT
  // ==============================
  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // ==============================
  // SEARCH
  // ==============================
  const filteredSuppliers = suppliers.filter(
    (supplier) => {
      const searchText = search
        .toLowerCase()
        .trim();

      return (
        (supplier.supplierName || "")
          .toLowerCase()
          .includes(searchText) ||
        (supplier.contactNumber || "")
          .toLowerCase()
          .includes(searchText) ||
        (supplier.email || "")
          .toLowerCase()
          .includes(searchText) ||
        (supplier.address || "")
          .toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ==============================
  // UI
  // ==============================
  return (
    <div className="supplier-page">

      {/* ==========================
          HEADER
      =========================== */}
      <div className="supplier-header">
        <div>
          <h1>Supplier Management</h1>
          <p>
            Manage your pharmacy suppliers
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
            className="add-supplier-btn"
            onClick={handleAdd}
          >
            + Add Supplier
          </button>
        </div>
      </div>

      {/* ==========================
          FORM
      =========================== */}
      {showForm && (
        <div className="supplier-form-card">

          <div className="form-card-header">
            <div>
              <h2>
                {editingId !== null
                  ? "Edit Supplier"
                  : "Add New Supplier"}
              </h2>

              <p>
                Enter supplier information below
              </p>
            </div>

            <button
              type="button"
              className="close-form-btn"
              onClick={resetForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="supplier-form-grid">

              {/* SUPPLIER NAME */}
              <div className="form-group">
                <label>
                  Supplier Name *
                </label>

                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                  autoComplete="off"
                />
              </div>

              {/* CONTACT */}
              <div className="form-group">
                <label>
                  Contact Number
                </label>

                <input
                  type="text"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="Enter contact number"
                  autoComplete="off"
                />
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  autoComplete="off"
                />
              </div>

              {/* ADDRESS */}
              <div className="form-group">
                <label>
                  Address
                </label>

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

            {/* FORM BUTTONS */}
            <div className="form-actions">

              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-supplier-btn"
              >
                {editingId !== null
                  ? "Update Supplier"
                  : "Save Supplier"}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* ==========================
          SUMMARY CARDS
      =========================== */}
      <div className="supplier-summary">

        <div className="supplier-summary-card">
          <div className="summary-icon">
            🚚
          </div>

          <div>
            <span>
              Total Suppliers
            </span>

            <strong>
              {suppliers.length}
            </strong>
          </div>
        </div>

        <div className="supplier-summary-card">
          <div className="summary-icon">
            📋
          </div>

          <div>
            <span>
              Displayed Suppliers
            </span>

            <strong>
              {filteredSuppliers.length}
            </strong>
          </div>
        </div>

      </div>

      {/* ==========================
          SEARCH
      =========================== */}
      <div className="supplier-toolbar">

        <div className="supplier-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

      </div>

      {/* ==========================
          TABLE
      =========================== */}
      <div className="supplier-table-card">

        <div className="table-header">
          <div>
            <h2>
              Suppliers
            </h2>

            <p>
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length !== 1
                ? "s"
                : ""}{" "}
              found
            </p>
          </div>
        </div>

        {/* EMPTY */}
        {filteredSuppliers.length === 0 ? (

          <div className="empty-supplier">

            <div className="empty-icon">
              🚚
            </div>

            <h3>
              No suppliers found
            </h3>

            <p>
              Add your first supplier
              to get started.
            </p>

            <button
              type="button"
              className="empty-add-btn"
              onClick={handleAdd}
            >
              + Add Supplier
            </button>

          </div>

        ) : (

          /* TABLE */
          <div className="supplier-table-wrapper">

            <table className="supplier-table">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Supplier Name</th>
                  <th>Contact Number</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredSuppliers.map(
                  (supplier) => {

                    const supplierId =
                      Number(
                        supplier.supplierId
                      );

                    return (
                      <tr
                        key={supplierId}
                      >

                        {/* ID */}
                        <td>
                          <span className="supplier-id">
                            #{supplierId}
                          </span>
                        </td>

                        {/* NAME */}
                        <td>
                          <div className="supplier-name-cell">

                            <div className="supplier-avatar">
                              {(
                                supplier.supplierName ||
                                "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <strong>
                              {supplier.supplierName}
                            </strong>

                          </div>
                        </td>

                        {/* CONTACT */}
                        <td>
                          {supplier.contactNumber ||
                            "-"}
                        </td>

                        {/* EMAIL */}
                        <td>
                          {supplier.email ||
                            "-"}
                        </td>

                        {/* ADDRESS */}
                        <td>
                          {supplier.address ||
                            "-"}
                        </td>

                        {/* ACTIONS */}
                        <td>

                          <div className="supplier-actions">

                            {/* EDIT */}
                            <button
                              type="button"
                              className="edit-supplier-btn"
                              onClick={() =>
                                handleEdit(
                                  supplier
                                )
                              }
                              title="Edit Supplier"
                            >
                              ✏️
                            </button>

                            {/* DELETE */}
                            <button
                              type="button"
                              className="delete-supplier-btn"
                              onClick={() =>
                                handleDelete(
                                  supplierId
                                )
                              }
                              title="Delete Supplier"
                            >
                              🗑️
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>
            </table>

          </div>
        )}

      </div>
    </div>
  );
}

export default Supplier;