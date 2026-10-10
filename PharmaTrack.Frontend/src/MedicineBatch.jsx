
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5275/api";

const emptyForm = {
  medicineId: "",
  supplierId: "",
  batchName: "",
  manufacturingDate: "",
  expiryDate: "",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "",
};

function MedicineBatch() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [batchRes, medicineRes, supplierRes] =
        await Promise.all([
          axios.get(`${API}/MedicineBatch`),
          axios.get(`${API}/Medicine`),
          axios.get(`${API}/Supplier`),
        ]);

      setBatches(batchRes.data || []);
      setMedicines(
        (medicineRes.data || []).filter((m) => m.isActive !== false)
      );
      setSuppliers(
        (supplierRes.data || []).filter((s) => s.isActive !== false)
      );
    } catch (error) {
      console.error("Failed to load stock data:", error);
      alert("Failed to load stock, medicines, or suppliers.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (
      !formData.medicineId ||
      !formData.supplierId ||
      !formData.batchName.trim() ||
      !formData.manufacturingDate ||
      !formData.expiryDate ||
      formData.purchasePrice === "" ||
      formData.sellingPrice === "" ||
      formData.quantity === ""
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    if (formData.expiryDate <= formData.manufacturingDate) {
      alert("Expiry Date must be after Manufacturing Date.");
      return;
    }

    if (
      Number(formData.purchasePrice) < 0 ||
      Number(formData.sellingPrice) < 0 ||
      Number(formData.quantity) < 0
    ) {
      alert("Prices and quantity cannot be negative.");
      return;
    }

    if (Number(formData.quantity) <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        medicineId: Number(formData.medicineId),
        supplierId: Number(formData.supplierId),
        batchName: formData.batchName.trim(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        purchasePrice: Number(formData.purchasePrice),
        sellingPrice: Number(formData.sellingPrice),
        quantity: Number(formData.quantity),
      };

      await axios.post(`${API}/MedicineBatch`, payload);

      alert("Medicine stock added successfully!");

      setFormData(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (error) {
      console.error("Error adding stock:", error);
      alert(
        error.response?.data?.message ||
          "Failed to add stock. Please check the API and entered details."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredBatches = batches.filter((batch) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    const medicine = medicines.find(
      (m) => m.medicineId === batch.medicineId
    );

    return (
      batch.batchName?.toLowerCase().includes(query) ||
      medicine?.name?.toLowerCase().includes(query) ||
      String(batch.batchId).includes(query)
    );
  });

  const formatDate = (date) => {
    if (!date) return "-";

    const value = String(date).slice(0, 10);
    const parts = value.split("-");

    return parts.length === 3
      ? `${parts[2]}/${parts[1]}/${parts[0]}`
      : value;
  };

  const getMedicineName = (medicineId) =>
    medicines.find((m) => m.medicineId === medicineId)?.name ||
    `Medicine #${medicineId}`;

  const getSupplierName = (supplierId) =>
    suppliers.find((s) => s.supplierId === supplierId)?.supplierName ||
    `Supplier #${supplierId}`;

  return (
    <div className="medicine-page">
      <div className="medicine-header">
        <div>
          <h1>Medicine Stock</h1>
          <p>Manage medicine batches, manufacturing dates and expiry dates</p>
        </div>

        <button
          type="button"
          className="add-medicine-btn"
          onClick={() => {
            setFormData(emptyForm);
            setShowForm(true);
          }}
        >
          + Add Stock
        </button>
      </div>

      <div className="medicine-toolbar">
        <input
          type="text"
          placeholder="Search batch or medicine..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showForm && (
        <div
          className="medicine-modal-overlay"
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            className="medicine-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="medicine-modal-header">
              <div>
                <h2>Add Medicine Stock</h2>
                <p>Enter batch details below</p>
              </div>

              <button
                type="button"
                className="medicine-modal-close"
                disabled={saving}
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="medicine-modal-body">
                <div className="medicine-form-grid">
                  <div className="medicine-field">
                    <label>Medicine *</label>
                    <select
                      name="medicineId"
                      value={formData.medicineId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select medicine</option>
                      {medicines.map((medicine) => (
                        <option
                          key={medicine.medicineId}
                          value={medicine.medicineId}
                        >
                          {medicine.name} - {medicine.strength}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="medicine-field">
                    <label>Supplier *</label>
                    <select
                      name="supplierId"
                      value={formData.supplierId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map((supplier) => (
                        <option
                          key={supplier.supplierId}
                          value={supplier.supplierId}
                        >
                          {supplier.supplierName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="medicine-field medicine-field-full">
                    <label>Batch Name *</label>
                    <input
                      type="text"
                      name="batchName"
                      value={formData.batchName}
                      onChange={handleChange}
                      placeholder="e.g. PAN-2026-01"
                      required
                    />
                  </div>

                  <div className="medicine-field">
                    <label>Manufacturing Date *</label>
                    <input
                      type="date"
                      name="manufacturingDate"
                      value={formData.manufacturingDate}
                      onChange={handleChange}
                      max={formData.expiryDate || undefined}
                      required
                    />
                  </div>

                  <div className="medicine-field">
                    <label>Expiry Date *</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      min={
                        formData.manufacturingDate
                          ? formData.manufacturingDate
                          : undefined
                      }
                      required
                    />
                  </div>

                  <div className="medicine-field">
                    <label>Purchase Price (Rs.) *</label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="medicine-field">
                    <label>Selling Price (Rs.) *</label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="medicine-field medicine-field-full">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="medicine-modal-footer">
                <button
                  type="button"
                  className="cancel-medicine-btn"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-medicine-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "+ Save Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading stock...</p>
      ) : (
        <div className="medicine-table-container">
          <table className="medicine-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Medicine</th>
                <th>Supplier</th>
                <th>Batch Name</th>
                <th>Manufacturing Date</th>
                <th>Expiry Date</th>
                <th>Purchase Price</th>
                <th>Selling Price</th>
                <th>Quantity</th>
              </tr>
            </thead>

            <tbody>
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => (
                  <tr key={batch.batchId}>
                    <td>{batch.batchId}</td>
                    <td>{getMedicineName(batch.medicineId)}</td>
                    <td>{getSupplierName(batch.supplierId)}</td>
                    <td>{batch.batchName}</td>
                    <td>{formatDate(batch.manufacturingDate)}</td>
                    <td>{formatDate(batch.expiryDate)}</td>
                    <td>
                      Rs. {Number(batch.purchasePrice).toFixed(2)}
                    </td>
                    <td>
                      Rs. {Number(batch.sellingPrice).toFixed(2)}
                    </td>
                    <td>{batch.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">
                    No medicine stock found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MedicineBatch;