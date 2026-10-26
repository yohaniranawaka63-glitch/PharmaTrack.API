
import { useEffect, useState } from "react";
import api from "./api";
import {
  Search,
  Package,
  Pencil,
  Trash2,
  LogOut,
  X,
} from "lucide-react";

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

  const getField = (obj, camel, pascal) =>
    obj?.[camel] ?? obj?.[pascal];

  const normalizeCategory = (category) => ({
    ...category,
    categoryId: getField(category, "categoryId", "CategoryId"),
    categoryName: getField(category, "categoryName", "CategoryName"),
    status: getField(category, "status", "Status"),
  });

  const normalizeItem = (item) => {
    const categoryObject = getField(
      item,
      "productCategory",
      "ProductCategory"
    );

    return {
      ...item,
      otherItemId:
        getField(item, "otherItemId", "OtherItemId") ??
        getField(item, "id", "Id"),
      itemName:
        getField(item, "itemName", "ItemName") ??
        getField(item, "name", "Name") ??
        "",
      category:
        getField(item, "category", "Category") ?? "",
      productCategoryId:
        getField(item, "productCategoryId", "ProductCategoryId") ??
        getField(categoryObject, "categoryId", "CategoryId") ??
        "",
      productCategory: categoryObject
        ? {
            ...categoryObject,
            categoryId: getField(
              categoryObject,
              "categoryId",
              "CategoryId"
            ),
            categoryName: getField(
              categoryObject,
              "categoryName",
              "CategoryName"
            ),
          }
        : null,
      unit: getField(item, "unit", "Unit") ?? "",
      purchasePrice:
        getField(item, "purchasePrice", "PurchasePrice") ?? 0,
      sellingPrice:
        getField(item, "sellingPrice", "SellingPrice") ?? 0,
      quantity: getField(item, "quantity", "Quantity") ?? 0,
      reorderLevel:
        getField(item, "reorderLevel", "ReorderLevel") ?? 0,
      status: getField(item, "status", "Status") ?? true,
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("pharmaTrackUser");
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  useEffect(() => {
    loadItems();
    loadCategories();
  }, []);

  const loadItems = async () => {
    setLoading(true);

    try {
      const response = await api.get("/OtherItem");
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      console.log("OTHER ITEMS FROM API:", data);

      const normalized = data.map(normalizeItem);
      console.log("NORMALIZED OTHER ITEMS:", normalized);

      setItems(normalized);
    } catch (error) {
      console.error("LOAD OTHER ITEMS ERROR:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load other items."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/ProductCategory");
      const data = Array.isArray(response.data)
        ? response.data
        : [];

      setCategories(data.map(normalizeCategory));
    } catch (error) {
      console.error("LOAD CATEGORIES ERROR:", error);
      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load product categories."
      );
    }
  };

  const activeCategories = categories.filter(
    (category) => category.status !== false
  );

  const getCategoryName = (item) => {
    const categoryId = item.productCategoryId;

    const matchedCategory = categories.find(
      (category) =>
        categoryId !== "" &&
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

  const searchText = search.toLowerCase().trim();

  const filteredItems = items.filter((item) =>
    [
      item.otherItemId,
      item.itemName,
      getCategoryName(item),
      item.unit,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(searchText)
    )
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
    const id = Number(item.otherItemId);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Other item ID not found.");
      return;
    }

    const categoryName = getCategoryName(item);

    setEditingId(id);

    setFormData({
      itemName: item.itemName ?? "",
      category: categoryName === "No Category" ? "" : categoryName,
      productCategoryId:
        item.productCategoryId != null
          ? String(item.productCategoryId)
          : "",
      unit: item.unit ?? "",
      purchasePrice: item.purchasePrice ?? "",
      sellingPrice: item.sellingPrice ?? "",
      quantity: item.quantity ?? "",
      reorderLevel: item.reorderLevel ?? "",
      status: item.status ?? true,
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      alert("Selected category could not be found. Please select it again.");
      return;
    }

    const data = {
  ItemName: itemName.trim(),
  Category: selectedCategory.categoryName,
  ProductCategoryId: Number(formData.productCategoryId),
  Unit: formData.unit,
  PurchasePrice: Number(purchasePrice),
  SellingPrice: Number(sellingPrice),
  Quantity: Number(quantity),
  ReorderLevel: Number(reorderLevel),
  Status: Boolean(formData.status),
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

      const errorData = error.response?.data;
      const message =
        typeof errorData === "string"
          ? errorData
          : errorData?.message ||
            errorData?.title ||
            error.message ||
            "Failed to save other item.";

      alert(`Unable to save item.\n\n${message}`);
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
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <LogOut size={16} /> Logout
          </button>

          <button
            type="button"
            className="add-medicine-btn"
            onClick={handleAddItem}
          >
            <span style={{ marginRight: "6px" }}>+</span>
            Add Other Item
          </button>
        </div>
      </div>

      <div className="medicine-top-section">
        <div className="medicine-search">
          <span><Search size={18} /></span>
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
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSaveItem}>
            <div className="medicine-form-grid">
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

              <div className="form-group">
                <label>Product Category</label>
                <select
                  name="productCategoryId"
                  value={formData.productCategoryId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Product Category</option>

                  {activeCategories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

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

              <div className="form-group">
                <label>Purchase Price (Rs.)</label>
                <input
                  type="number"
                  name="purchasePrice"
                  min="0"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Selling Price (Rs.)</label>
                <input
                  type="number"
                  name="sellingPrice"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  step="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Reorder Level</label>
                <input
                  type="number"
                  name="reorderLevel"
                  min="0"
                  step="1"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  required
                />
              </div>

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
                {filteredItems.map((item, index) => (
                  <tr key={item.otherItemId ?? index}>
                    <td>
                      <span className="medicine-id">
                        #{item.otherItemId ?? "-"}
                      </span>
                    </td>

                    <td>
                      <div className="medicine-name-cell">
                        <div className="medicine-icon">
                          <Package size={20} />
                        </div>
                        <strong>{item.itemName || "-"}</strong>
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
                      {Number(item.purchasePrice ?? 0).toFixed(2)}
                    </td>

                    <td>
                      <strong>
                        Rs.{" "}
                        {Number(item.sellingPrice ?? 0).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      <strong>{item.quantity ?? 0}</strong>
                    </td>

                    <td>
                      {getStockStatus(item)}

                      {item.status === false && (
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
                          <Pencil size={14} /> Edit
                        </button>

                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() =>
                            handleDeleteItem(item.otherItemId)
                          }
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className="no-medicines">
                <div><Package size={28} /></div>
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