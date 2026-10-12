
import { useEffect, useState } from "react";
import api from "./api";

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

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem("pharmaTrackUser");
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  // LOAD ITEMS AND CATEGORIES
  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  // LOAD OTHER ITEMS
  const loadItems = async () => {
    setLoading(true);

    try {
      const response = await api.get("/OtherItem");

      setItems(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("LOAD OTHER ITEMS ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load other items. Please check the API."
      );
    } finally {
      setLoading(false);
    }
  };

  // LOAD PRODUCT CATEGORIES
  const loadCategories = async () => {
    try {
      const response = await api.get("/ProductCategory");

      setCategories(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("LOAD CATEGORIES ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load product categories."
      );
    }
  };

  // ACTIVE CATEGORIES
  const activeCategories = categories.filter(
    (category) => category.status === true
  );

  // GET CATEGORY NAME
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

  // SEARCH
  const searchText = search.toLowerCase().trim();

  const filteredItems = items.filter((item) =>
    [
      item.itemName,
      getCategoryName(item),
      item.unit,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    )
  );

  // INPUT CHANGE
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

  // RESET FORM
  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
  };

  // ADD ITEM
  const handleAddItem = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setShowForm(true);
  };

  // EDIT ITEM
  const handleEditItem = (item) => {
    const id = Number(item.otherItemId);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Other item ID not found.");
      return;
    }

    const categoryName = getCategoryName(item);

    setEditingId(id);

    setFormData({
      itemName: item.itemName || "",
      category:
        categoryName === "No Category" ? "" : categoryName,
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

  // DELETE ITEM
  const handleDeleteItem = async (id) => {
    const itemId = Number(id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      alert("Other item ID not found.");
      return;
    }

    const item = items.find(
      (currentItem) =>
        Number(currentItem.otherItemId) === itemId
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete "${
        item?.itemName || "this item"
      }"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/OtherItem/${itemId}`);

      alert("Other item deleted successfully.");

      setItems((previous) =>
        previous.filter(
          (currentItem) =>
            Number(currentItem.otherItemId) !== itemId
        )
      );

      await loadItems();
    } catch (error) {
      console.error("DELETE OTHER ITEM ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      const errorData = error.response?.data;

      const message =
        typeof errorData === "string"
          ? errorData
          : errorData?.message ||
            errorData?.title ||
            (error.response?.status === 409
              ? "This item is being used by another record and cannot be deleted."
              : error.message) ||
            "Delete failed. Please try again.";

      alert(`Unable to delete item.\n\n${message}`);
    }
  };

  // ADD / UPDATE ITEM
  const handleSaveItem = async (event) => {
    event.preventDefault();

    if (saving) return;

    const itemName = formData.itemName.trim();

    if (!itemName) {
      alert("Please enter an item name.");
      return;
    }

    if (!formData.productCategoryId) {
      alert("Please select a Product Category.");
      return;
    }

    if (!formData.unit) {
      alert("Please select a Unit.");
      return;
    }

    const purchasePrice = Number(formData.purchasePrice);
    const sellingPrice = Number(formData.sellingPrice);
    const quantity = Number(formData.quantity);
    const reorderLevel = Number(formData.reorderLevel);

    if (
      formData.purchasePrice === "" ||
      formData.sellingPrice === "" ||
      formData.quantity === "" ||
      formData.reorderLevel === "" ||
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

    if (
      !Number.isInteger(quantity) ||
      !Number.isInteger(reorderLevel)
    ) {
      alert("Quantity and Reorder Level must be whole numbers.");
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
      alert(
        "The selected category could not be found. Please select it again."
      );
      return;
    }

    const data = {
      itemName,
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
        await api.put(`/OtherItem/${editingId}`, {
          otherItemId: Number(editingId),
          ...data,
        });

        alert("Other item updated successfully.");
      } else {
        await api.post("/OtherItem", data);

        alert("Other item added successfully.");
      }

      resetForm();
      await loadItems();
    } catch (error) {
      console.error("SAVE OTHER ITEM ERROR:", error);
      console.error("STATUS:", error.response?.status);
      console.error("DATA:", error.response?.data);

      const errorData = error.response?.data;

      const message =
        typeof errorData === "string"
          ? errorData
          : errorData?.message ||
            errorData?.title ||
            error.message ||
            "Failed to save other item. Please check the API response.";

      alert(`Unable to save item.\n\n${message}`);
    } finally {
      setSaving(false);
    }
  };

  // STOCK STATUS
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
      {/* HEADER */}
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

      {/* SEARCH AND SUMMARY */}
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

      {/* ADD / EDIT FORM */}
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
              disabled={saving}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSaveItem}>
            <div className="medicine-form-grid">
              {/* ITEM NAME */}
              <div className="form-group">
                <label>Item Name</label>
                <input
                  type="text"
                  name="itemName"
                  placeholder="e.g. Baby Diaper"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  autoComplete="off"
                  required
                />
              </div>

              {/* PRODUCT CATEGORY */}
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

              {/* UNIT */}
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

              {/* PURCHASE PRICE */}
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

              {/* SELLING PRICE */}
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

              {/* QUANTITY */}
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

              {/* REORDER LEVEL */}
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

              {/* STATUS */}
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

            {/* FORM BUTTONS */}
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

      {/* ITEMS TABLE */}
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
                <p>
                  {search
                    ? "Try searching for another item."
                    : "Add an item to get started."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OtherItem;