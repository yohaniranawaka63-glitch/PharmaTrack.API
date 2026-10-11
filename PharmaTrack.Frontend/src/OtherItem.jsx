
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://https://pharmatrack-api-b0035.containers.snapdeploy.app/api/api";

const emptyForm = {
  itemName: "",
  category: "",
  productCategoryId: "",
  unit: "",
  purchasePrice: "",
  sellingPrice: "",
  quantity: "",
  reorderLevel: "",
  status: true,
};

function OtherItem() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // Load items and categories
  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/OtherItem`
      );

      setItems(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Failed to load other items:", error);
      alert("Failed to load other items. Please check the API.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/ProductCategory`
      );

      setCategories(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error("Failed to load categories:", error);
      alert("Failed to load product categories.");
    }
  };

  // Only active categories in the dropdown.
  // If duplicate category names exist, display each name with its ID.
  const activeCategories = categories.filter(
    (category) => category.status === true
  );

  const getCategoryName = (item) => {
    const categoryId = item.productCategoryId;

    const matchedCategory = categories.find(
      (category) =>
        categoryId != null &&
        Number(category.categoryId) === Number(categoryId)
    );

    return (
      item.productCategory?.categoryName ||
      matchedCategory?.categoryName ||
      item.category ||
      "No Category"
    );
  };

  const filteredItems = items.filter((item) =>
    (item.itemName || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => {
      if (name === "productCategoryId") {
        const selectedCategory = categories.find(
          (category) =>
            Number(category.categoryId) === Number(value)
        );

        return {
          ...previous,
          productCategoryId: value,
          category: selectedCategory?.categoryName || "",
        };
      }

      return {
        ...previous,
        [name]: value,
      };
    });
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAddItem = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setEditingId(item.otherItemId);

    setFormData({
      itemName: item.itemName || "",
      category: getCategoryName(item) === "No Category"
        ? ""
        : getCategoryName(item),
      productCategoryId:
        item.productCategoryId != null
          ? String(item.productCategoryId)
          : "",
      unit: item.unit || "",
      purchasePrice: item.purchasePrice ?? "",
      sellingPrice: item.sellingPrice ?? "",
      quantity: item.quantity ?? "",
      reorderLevel: item.reorderLevel ?? "",
      status: item.status ?? true,
    });

    setShowForm(true);
  };

  const handleDeleteItem = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/OtherItem/${id}`);
      alert("Other item deleted successfully.");
      await loadItems();
    } catch (error) {
      console.error("DELETE ERROR:", error);

      const message =
        error.response?.data?.message ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : null) ||
        "Delete failed. This item may be used by another record.";

      alert(message);
    }
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();

    if (saving) return;

    if (!formData.itemName.trim()) {
      alert("Please enter an item name.");
      return;
    }

    if (!formData.productCategoryId) {
      alert("Please select a Product Category.");
      return;
    }

    const purchasePrice = Number(formData.purchasePrice);
    const sellingPrice = Number(formData.sellingPrice);
    const quantity = Number(formData.quantity);
    const reorderLevel = Number(formData.reorderLevel);

    if (
      !Number.isFinite(purchasePrice) ||
      !Number.isFinite(sellingPrice) ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(reorderLevel) ||
      purchasePrice < 0 ||
      sellingPrice < 0 ||
      quantity < 0 ||
      reorderLevel < 0
    ) {
      alert("Please enter valid non-negative numbers.");
      return;
    }

    if (sellingPrice < purchasePrice) {
      const confirmed = window.confirm(
        "Selling price is lower than purchase price. Do you want to continue?"
      );

      if (!confirmed) return;
    }

    const selectedCategory = categories.find(
      (category) =>
        Number(category.categoryId) ===
        Number(formData.productCategoryId)
    );

    if (!selectedCategory) {
      alert("The selected category could not be found. Please select it again.");
      return;
    }

    const data = {
      itemName: formData.itemName.trim(),
      category: selectedCategory.categoryName,
      productCategoryId: Number(formData.productCategoryId),
      unit: formData.unit,
      purchasePrice,
      sellingPrice,
      quantity,
      reorderLevel,
      status: Boolean(formData.status),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        await axios.put(
          `${API_URL}/OtherItem/${editingId}`,
          {
            otherItemId: editingId,
            ...data,
          }
        );

        alert("Other item updated successfully.");
      } else {
        await axios.post(`${API_URL}/OtherItem`, data);
        alert("Other item added successfully.");
      }

      resetForm();
      await loadItems();
    } catch (error) {
      console.error("SAVE ERROR:", error);

      const message =
        error.response?.data?.message ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : null) ||
        "Failed to save other item. Please check the API response.";

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const getStockStatus = (item) => {
    const quantity = Number(item.quantity ?? 0);
    const reorderLevel = Number(item.reorderLevel ?? 0);

    if (quantity <= 0) {
      return (
        <span className="status-badge out-stock">
          Out of Stock
        </span>
      );
    }

    if (quantity <= reorderLevel) {
      return (
        <span className="status-badge low-stock">
          Low Stock
        </span>
      );
    }

    return (
      <span className="status-badge in-stock">
        In Stock
      </span>
    );
  };

  return (
    <div className="medicine-page">
      {/* Header */}
      <div className="medicine-header">
        <div>
          <h1>Other Item Management</h1>
          <p>
            Manage non-medicine items available in the pharmacy
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
            className="add-medicine-btn"
            onClick={handleAddItem}
          >
            + Add Other Item
          </button>
        </div>
      </div>

      {/* Search and Summary */}
      <div className="medicine-top-section">
        <div className="medicine-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search item..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="medicine-count-card">
          <span>Total Other Items</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="medicine-form-card">
          <div className="medicine-form-header">
            <div>
              <h2>
                {editingId !== null
                  ? "Edit Other Item"
                  : "Add New Other Item"}
              </h2>
              <p>
                {editingId !== null
                  ? "Update the item information"
                  : "Enter the details of the new item"}
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

          <form onSubmit={handleSaveItem}>
            <div className="medicine-form-grid">
              {/* Item Name */}
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  placeholder="e.g. Baby Diaper"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Product Category */}
              <div className="form-group">
                <label>Product Category</label>
                <select
                  name="productCategoryId"
                  value={formData.productCategoryId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">
                    Select Product Category
                  </option>

                  {activeCategories.map((category) => {
                    const duplicateCount =
                      activeCategories.filter(
                        (candidate) =>
                          candidate.categoryName?.trim().toLowerCase() ===
                          category.categoryName?.trim().toLowerCase()
                      ).length;

                    return (
                      <option
                        key={category.categoryId}
                        value={category.categoryId}
                      >
                        {category.categoryName}
                        {duplicateCount > 1
                          ? ` (ID: ${category.categoryId})`
                          : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Unit */}
              <div className="form-group">
                <label>Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Unit</option>
                  <option value="Piece">Piece</option>
                  <option value="Pack">Pack</option>
                  <option value="Box">Box</option>
                  <option value="Bottle">Bottle</option>
                  <option value="Tube">Tube</option>
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Tin">Tin</option>
                  <option value="Packet">Packet</option>
                </select>
              </div>

              {/* Purchase Price */}
              <div className="form-group">
                <label>Purchase Price (Rs.)</label>
                <input
                  type="number"
                  name="purchasePrice"
                  placeholder="e.g. 850"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Selling Price */}
              <div className="form-group">
                <label>Selling Price (Rs.)</label>
                <input
                  type="number"
                  name="sellingPrice"
                  placeholder="e.g. 1000"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="e.g. 20"
                  min="0"
                  step="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Reorder Level */}
              <div className="form-group">
                <label>Reorder Level</label>
                <input
                  type="number"
                  name="reorderLevel"
                  placeholder="e.g. 5"
                  min="0"
                  step="1"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Status */}
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status ? "true" : "false"}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      status: event.target.value === "true",
                    }))
                  }
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="medicine-form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
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
                  : editingId !== null
                    ? "Update Item"
                    : "Save Item"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="medicine-table-container">
        <div className="table-title">
          <div>
            <h2>Other Item List</h2>
            <p>
              All non-medicine items available in the pharmacy
            </p>
          </div>
        </div>

        {loading ? (
          <p style={{ padding: "20px" }}>
            Loading other items...
          </p>
        ) : (
          <>
            <table className="medicine-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.otherItemId}>
                    <td>
                      <span className="medicine-id">
                        #{item.otherItemId}
                      </span>
                    </td>

                    <td>
                      <div className="medicine-name-cell">
                        <div className="medicine-icon">📦</div>
                        <strong>{item.itemName}</strong>
                      </div>
                    </td>

                    <td>
                      <span className="category-badge">
                        {getCategoryName(item)}
                      </span>
                    </td>

                    <td>{item.unit || "-"}</td>

                    <td>
                      Rs.{" "}
                      {Number(item.purchasePrice || 0).toFixed(2)}
                    </td>

                    <td>
                      <strong>
                        Rs.{" "}
                        {Number(item.sellingPrice || 0).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      <strong>{item.quantity ?? 0}</strong>
                    </td>

                    <td>
                      {getStockStatus(item)}
                      {!item.status && (
                        <div style={{ marginTop: "4px" }}>
                          <span className="status-badge">
                            Inactive
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="medicine-action-cell">
                      <div className="medicine-action-buttons">
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleEditItem(item)}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            handleDeleteItem(item.otherItemId)
                          }
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="no-medicines">
                <div>📦</div>
                <h3>No other items found</h3>
                <p>Try searching for another item.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OtherItem;
