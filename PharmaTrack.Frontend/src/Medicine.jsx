
import { useEffect, useState } from "react";
import api from "./api";

function Medicine() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "",
    unit: "",
    strength: "",
    manufacturingDate: "",
    expiryDate: "",
  });

  // LOAD MEDICINES
useEffect(() => {
  loadMedicines();
}, []);

const loadMedicines = async () => {
  try {
    const response = await api.get("/Medicine");

    console.log("Medicine API response:", response.data);

    const data = Array.isArray(response.data)
      ? response.data
      : [];

    const activeMedicines = data
      .map((medicine) => ({
        ...medicine,
        medicineId: medicine.medicineId ?? medicine.MedicineId,
        name: medicine.name ?? medicine.Name ?? "",
        genericName:
          medicine.genericName ?? medicine.GenericName ?? "",
        category: medicine.category ?? medicine.Category ?? "",
        unit: medicine.unit ?? medicine.Unit ?? "",
        strength: medicine.strength ?? medicine.Strength ?? "",
        isActive: medicine.isActive ?? medicine.IsActive,
      }))
      .filter((medicine) => medicine.isActive === true);

    setMedicines(activeMedicines);
  } catch (error) {
    console.error("Error loading medicines:", error);

    alert(
      error.response?.data?.message ||
        "Failed to load medicines."
    );
  }
};
  // LOGOUT
  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // INPUT CHANGE
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setFormData({
      name: "",
      genericName: "",
      category: "",
      unit: "",
      strength: "",
      manufacturingDate: "",
      expiryDate: "",
    });
  };

  // ADD MEDICINE
  const handleAddMedicine = () => {
    setEditingMedicine(null);
    resetForm();
    setShowForm(true);
  };

  // EDIT MEDICINE
  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);

    setFormData({
      name: medicine.name || "",
      genericName: medicine.genericName || "",
      category: medicine.category || "",
      unit: medicine.unit || "",
      strength: medicine.strength || "",
      manufacturingDate: "",
      expiryDate: "",
    });

    setShowForm(true);
  };

  // CLOSE FORM
  const handleCloseForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingMedicine(null);
    resetForm();
  };

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!formData.name.trim()) {
      alert("Medicine name is required.");
      return;
    }

    if (!formData.genericName.trim()) {
      alert("Generic name is required.");
      return;
    }

    if (!formData.category.trim()) {
      alert("Category is required.");
      return;
    }

    if (!formData.unit.trim()) {
      alert("Unit is required.");
      return;
    }

    if (!formData.strength.trim()) {
      alert("Strength is required.");
      return;
    }

    if (!editingMedicine) {
      if (
        !formData.manufacturingDate ||
        !formData.expiryDate
      ) {
        alert(
          "Manufacturing Date and Expiry Date are required."
        );
        return;
      }

      if (
        formData.expiryDate <= formData.manufacturingDate
      ) {
        alert(
          "Expiry Date must be after Manufacturing Date."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const medicineData = {
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        category: formData.category.trim(),
        unit: formData.unit.trim(),
        strength: formData.strength.trim(),
      };

      if (editingMedicine) {
        await api.put(
          `/Medicine/${editingMedicine.medicineId}`,
          medicineData
        );

        alert("Medicine updated successfully.");
      } else {
        const response = await api.post(
          "/Medicine",
          medicineData
        );

        const newMedicineId =
          response.data?.medicineId ??
          response.data?.MedicineId;

        if (
          newMedicineId === undefined ||
          newMedicineId === null
        ) {
          throw new Error(
            "Medicine was saved, but its ID was not returned by the API."
          );
        }

        sessionStorage.setItem(
          "pharmaTrackPendingMedicineBatch",
          JSON.stringify({
            medicineId: newMedicineId,
            manufacturingDate: formData.manufacturingDate,
            expiryDate: formData.expiryDate,
          })
        );

        alert(
          "Medicine added successfully. Open Stock Management to complete the medicine batch details."
        );
      }

      setShowForm(false);
      setEditingMedicine(null);
      resetForm();

      await loadMedicines();
    } catch (error) {
      console.error("Medicine save error:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          "Failed to save medicine."
      );
    } finally {
      setSaving(false);
    }
  };

  // DEACTIVATE MEDICINE
  const handleDeleteMedicine = async (medicineId) => {
    if (deactivatingId !== null) return;

    const confirmDeactivate = window.confirm(
      "Are you sure you want to deactivate this medicine?\n\n" +
        "It will be removed from the active medicine list. " +
        "Historical stock and sales records will be preserved."
    );

    if (!confirmDeactivate) return;

    try {
      setDeactivatingId(medicineId);

      await api.delete(`/Medicine/${medicineId}`);

      await loadMedicines();

      alert("Medicine deactivated successfully.");
    } catch (error) {
      console.error("Medicine deactivation error:", error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to deactivate medicine."
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  // SEARCH
  const filteredMedicines = medicines.filter((medicine) => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return true;

    return (
      medicine.name?.toLowerCase().includes(searchText) ||
      medicine.genericName?.toLowerCase().includes(searchText) ||
      medicine.category?.toLowerCase().includes(searchText) ||
      medicine.strength?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div className="medicine-page">
      {/* HEADER */}
      <div className="medicine-header">
        <div>
          <div className="medicine-title-row">
            <div className="medicine-title-icon">💊</div>

            <div>
              <h1>Medicine Management</h1>
              <p>
                Manage medicines available in your pharmacy
              </p>
            </div>
          </div>
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
            className="add-medicine-btn"
            onClick={handleAddMedicine}
          >
            <span>＋</span>
            Add Medicine
          </button>
        </div>
      </div>

      {/* SEARCH AND COUNT */}
      <div className="medicine-toolbar">
        <div className="medicine-search">
          <span className="search-icon">🔍</span>

          <input
            type="text"
            placeholder="Search medicine by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        <div className="medicine-count">
          <strong>{filteredMedicines.length}</strong>
          <span> Medicines</span>
        </div>
      </div>

      {/* MEDICINE LIST */}
      <div className="medicine-list-card">
        <div className="medicine-list-header">
          <div>
            <h2>Medicine List</h2>
            <p>
              All active medicines registered in the pharmacy
            </p>
          </div>

          <div className="medicine-total-badge">
            {medicines.length} Active
          </div>
        </div>

        <div className="medicine-table-wrapper">
          <table className="medicine-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicine</th>
                <th>Generic Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Strength</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-medicine">
                    <div className="empty-medicine">
                      <div className="empty-icon">💊</div>
                      <h3>No medicines found</h3>

                      <p>
                        {search
                          ? "Try searching with a different medicine name."
                          : "Add your first medicine to the pharmacy."}
                      </p>

                      {!search && (
                        <button
                          type="button"
                          className="empty-add-btn"
                          onClick={handleAddMedicine}
                        >
                          ＋ Add Medicine
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((medicine) => (
                  <tr key={medicine.medicineId}>
                    <td>
                      <span className="medicine-id">
                        #{medicine.medicineId}
                      </span>
                    </td>

                    <td>
                      <div className="medicine-name-cell">
                        <div className="medicine-row-icon">
                          💊
                        </div>

                        <div>
                          <strong>{medicine.name}</strong>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="generic-name">
                        {medicine.genericName || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="medicine-category">
                        {medicine.category || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="medicine-unit">
                        {medicine.unit || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="strength-badge">
                        {medicine.strength || "-"}
                      </span>
                    </td>

                    <td>
                      <div className="medicine-actions">
                        <button
                          type="button"
                          className="edit-medicine-btn"
                          onClick={() =>
                            handleEditMedicine(medicine)
                          }
                          disabled={deactivatingId !== null}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="delete-medicine-btn"
                          onClick={() =>
                            handleDeleteMedicine(
                              medicine.medicineId
                            )
                          }
                          disabled={deactivatingId !== null}
                        >
                          {deactivatingId === medicine.medicineId
                            ? "Deactivating..."
                            : "🚫 Deactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div
          className="medicine-modal-overlay"
          onClick={handleCloseForm}
        >
          <div
            className="medicine-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="medicine-modal-header">
              <div className="medicine-modal-title">
                <div className="medicine-modal-icon">
                  {editingMedicine ? "✏️" : "💊"}
                </div>

                <div>
                  <h2>
                    {editingMedicine
                      ? "Edit Medicine"
                      : "Add New Medicine"}
                  </h2>

                  <p>
                    {editingMedicine
                      ? "Update medicine information"
                      : "Enter the medicine details below"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="medicine-modal-close"
                onClick={handleCloseForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="medicine-modal-body">
                <div className="medicine-form-section-title">
                  <span>📋</span>
                  Medicine Information
                </div>

                <div className="medicine-form-grid">
                  <div className="medicine-field">
                    <label>
                      Medicine Name <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Panadol"
                      required
                    />
                  </div>

                  <div className="medicine-field">
                    <label>
                      Generic Name <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleInputChange}
                      placeholder="e.g. Paracetamol"
                      required
                    />
                  </div>

                  <div className="medicine-field">
                    <label>
                      Category <span>*</span>
                    </label>

                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select category</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Antihistamine">Antihistamine</option>
                      <option value="Antacid">Antacid</option>
                      <option value="Vitamins">Vitamins</option>
                      <option value="Cough & Cold">Cough & Cold</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="medicine-field">
                    <label>
                      Unit <span>*</span>
                    </label>

                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select unit</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Box">Box</option>
                      <option value="Tube">Tube</option>
                      <option value="Sachet">Sachet</option>
                      <option value="Pack">Pack</option>
                      <option value="Piece">Piece</option>
                    </select>
                  </div>

                  <div className="medicine-field medicine-field-full">
                    <label>
                      Strength <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="strength"
                      value={formData.strength}
                      onChange={handleInputChange}
                      placeholder="e.g. 500mg"
                      required
                    />

                    <small>
                      Enter the medicine strength, such as 500mg,
                      10mg or 250mg/5ml.
                    </small>
                  </div>

                  {!editingMedicine && (
                    <>
                      <div className="medicine-field">
                        <label>
                          Manufacturing Date <span>*</span>
                        </label>

                        <input
                          type="date"
                          name="manufacturingDate"
                          value={formData.manufacturingDate}
                          onChange={handleInputChange}
                          max={formData.expiryDate || undefined}
                          required
                        />

                        <small>
                          Select the manufacturing date for the
                          initial batch.
                        </small>
                      </div>

                      <div className="medicine-field">
                        <label>
                          Expiry Date <span>*</span>
                        </label>

                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          min={
                            formData.manufacturingDate || undefined
                          }
                          required
                        />

                        <small>
                          Expiry date must be after the
                          manufacturing date.
                        </small>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="medicine-modal-footer">
                <button
                  type="button"
                  className="cancel-medicine-btn"
                  onClick={handleCloseForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-medicine-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingMedicine
                    ? "✓ Update Medicine"
                    : "＋ Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Medicine;