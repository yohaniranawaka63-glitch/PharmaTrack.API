
import { useEffect, useState } from "react";
import api from "./api";

function Stock() {
  const handleLogout = () => {
    sessionStorage.removeItem("pharmaTrackUser");
    window.location.reload();
  };

  const [medicineStock, setMedicineStock] = useState([]);
  const [otherItemStock, setOtherItemStock] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [showForm, setShowForm] = useState(false);
  const [itemType, setItemType] = useState("Medicine");
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [otherItemMode, setOtherItemMode] = useState(null);
  const [selectedOtherItemId, setSelectedOtherItemId] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    medicineId: "",
    supplierId: "",
    batchName: "",
    manufacturingDate: "",
    expiryDate: "",
    purchasePrice: "",
    sellingPrice: "",
    quantity: "",
    itemName: "",
    category: "",
    unit: "",
    reorderLevel: "",
    productCategoryId: "",
  };

  const [formData, setFormData] = useState({ ...emptyForm });

  useEffect(() => {
    loadAllData();
  }, []);

  // LOAD ALL DATA
  const loadAllData = async () => {
    try {
      const [
        medicineResponse,
        supplierResponse,
        categoryResponse,
      ] = await Promise.all([
        api.get("/Medicine"),
        api.get("/Supplier"),
        api.get("/ProductCategory"),
      ]);

      const medicineList = Array.isArray(medicineResponse.data)
        ? medicineResponse.data
        : [];

      setMedicines(medicineList);

      setSuppliers(
        Array.isArray(supplierResponse.data)
          ? supplierResponse.data
          : []
      );

      setCategories(
        Array.isArray(categoryResponse.data)
          ? categoryResponse.data
          : []
      );

      await loadStock(medicineList);
    } catch (error) {
      console.error("LOAD DATA ERROR:", error);
      alert(
        error.response?.data?.message ||
          "Failed to load stock data."
      );
    }
  };

  // LOAD STOCK
  const loadStock = async (activeMedicines = null) => {
    try {
      let medicineList = activeMedicines;

      if (!Array.isArray(medicineList)) {
        const response = await api.get("/Medicine");

        medicineList = Array.isArray(response.data)
          ? response.data
          : [];

        setMedicines(medicineList);
      }

      const activeMedicineIds = new Set(
        medicineList.map((medicine) =>
          Number(medicine.medicineId)
        )
      );

      const [medicineResponse, otherItemResponse] =
        await Promise.all([
          api.get("/Stock/Medicines"),
          api.get("/Stock/OtherItems"),
        ]);

      const medicineRows = Array.isArray(medicineResponse.data)
        ? medicineResponse.data
        : [];

      setMedicineStock(
        medicineRows.map((item) => ({
          ...item,
          medicineIsActive: activeMedicineIds.has(
            Number(item.medicineId)
          ),
        }))
      );

      setOtherItemStock(
        Array.isArray(otherItemResponse.data)
          ? otherItemResponse.data
          : []
      );
    } catch (error) {
      console.error("LOAD STOCK ERROR:", error);
      alert(
        error.response?.data?.message ||
          "Failed to load stock data."
      );
    }
  };

  const loadMedicines = async () => {
    try {
      const response = await api.get("/Medicine");

      setMedicines(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("LOAD MEDICINES ERROR:", error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get("/Supplier");

      setSuppliers(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("LOAD SUPPLIERS ERROR:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get("/ProductCategory");

      setCategories(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("LOAD PRODUCT CATEGORIES ERROR:", error);
    }
  };

  // INPUT CHANGE
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // RESET FORM
  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingBatchId(null);
    setOtherItemMode(null);
    setSelectedOtherItemId(null);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    resetForm();
  };

  // OPEN ADD STOCK FORM
  const handleOpenAddStock = () => {
    resetForm();
    setItemType("Medicine");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleItemTypeChange = (type) => {
    resetForm();
    setItemType(type);
  };

  // EDIT MEDICINE BATCH
  const handleEditMedicine = async (item) => {
    if (item.medicineIsActive === false) {
      alert(
        "Inactive medicines cannot be edited from Stock Management."
      );
      return;
    }

    const id = Number(item.batchId ?? item.id);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Medicine batch ID not found.");
      return;
    }

    try {
      const response = await api.get("/MedicineBatch");

      const batches = Array.isArray(response.data)
        ? response.data
        : [];

      const batch = batches.find(
        (b) => Number(b.batchId ?? b.id) === id
      );

      if (!batch) {
        alert("Medicine batch details could not be found.");
        return;
      }

      const batchMedicineId = Number(
        batch.medicineId ?? item.medicineId
      );

      const activeMedicine = medicines.some(
        (medicine) =>
          Number(medicine.medicineId) === batchMedicineId
      );

      if (!activeMedicine) {
        alert("This medicine is inactive and cannot be edited.");
        return;
      }

      setItemType("Medicine");
      setEditingBatchId(id);
      setOtherItemMode(null);
      setSelectedOtherItemId(null);

      setFormData({
        ...emptyForm,
        medicineId: String(
          batch.medicineId ?? item.medicineId ?? ""
        ),
        supplierId: String(
          batch.supplierId ?? item.supplierId ?? ""
        ),
        batchName: batch.batchName ?? item.batchName ?? "",
        manufacturingDate: String(
          batch.manufacturingDate ??
            item.manufacturingDate ??
            ""
        ).substring(0, 10),
        expiryDate: String(
          batch.expiryDate ?? item.expiryDate ?? ""
        ).substring(0, 10),
        purchasePrice:
          batch.purchasePrice ?? item.purchasePrice ?? "",
        sellingPrice:
          batch.sellingPrice ?? item.sellingPrice ?? "",
        quantity: batch.quantity ?? item.quantity ?? "",
      });

      setShowForm(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("LOAD MEDICINE BATCH ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Could not load medicine batch details."
      );
    }
  };

  // DELETE MEDICINE BATCH
  const handleDeleteMedicine = async (itemOrId) => {
    const item =
      typeof itemOrId === "object" && itemOrId !== null
        ? itemOrId
        : medicineStock.find(
            (row) =>
              Number(row.batchId ?? row.id) ===
              Number(itemOrId)
          );

    if (item?.medicineIsActive === false) {
      alert("Inactive medicine batch is preserved.");
      return;
    }

    const id = Number(
      typeof itemOrId === "object" && itemOrId !== null
        ? itemOrId.batchId ?? itemOrId.id
        : itemOrId
    );

    if (!Number.isInteger(id) || id <= 0) {
      alert("Medicine batch ID not found.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this medicine batch?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/MedicineBatch/${id}`);

      alert("Medicine batch deleted successfully.");

      await loadStock(medicines);
    } catch (error) {
      console.error("DELETE MEDICINE ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete medicine batch."
      );
    }
  };

  // OTHER ITEM ID
  const getOtherItemId = (item) => {
    const id = item?.otherItemId ?? item?.id;

    return id != null ? Number(id) : null;
  };

  // EDIT OTHER ITEM
  const handleEditOtherItem = (item) => {
    const id = getOtherItemId(item);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Other item ID not found.");
      return;
    }

    setItemType("Other Item");
    setEditingBatchId(null);
    setOtherItemMode("edit");
    setSelectedOtherItemId(id);

    setFormData({
      ...emptyForm,
      purchasePrice: item.purchasePrice ?? "",
      sellingPrice: item.sellingPrice ?? "",
      quantity: item.quantity ?? "",
      itemName: item.name ?? item.itemName ?? "",
      category: item.category ?? "",
      unit: item.unit ?? "",
      reorderLevel: item.reorderLevel ?? "",
      productCategoryId: item.productCategoryId ?? "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ADD EXISTING OTHER ITEM STOCK
  const handleAddOtherItemStock = (item) => {
    const id = getOtherItemId(item);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Other item ID not found.");
      return;
    }

    setItemType("Other Item");
    setEditingBatchId(null);
    setOtherItemMode("addStock");
    setSelectedOtherItemId(id);

    setFormData({
      ...emptyForm,
      purchasePrice: item.purchasePrice ?? "",
      sellingPrice: item.sellingPrice ?? "",
      quantity: "",
      itemName: item.name ?? item.itemName ?? "",
      category: item.category ?? "",
      unit: item.unit ?? "",
      reorderLevel: item.reorderLevel ?? "",
      productCategoryId: item.productCategoryId ?? "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // DELETE OTHER ITEM
  const handleDeleteOtherItem = async (itemId) => {
    const id = Number(itemId);

    if (!Number.isInteger(id) || id <= 0) {
      alert("Other item ID not found.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this other item?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/OtherItem/${id}`);

      alert("Other item deleted successfully.");

      await loadStock(medicines);
    } catch (error) {
      console.error("DELETE OTHER ITEM ERROR:", error);

      alert(
        error.response?.data?.message ||
          "Failed to delete other item."
      );
    }
  };

  // SAVE STOCK
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    try {
      setSaving(true);

      if (itemType === "Medicine") {
        const medicineId = Number(formData.medicineId);
        const supplierId = Number(formData.supplierId);
        const purchasePrice = Number(formData.purchasePrice);
        const sellingPrice = Number(formData.sellingPrice);
        const quantity = Number(formData.quantity);

        const selectedMedicineIsActive = medicines.some(
          (medicine) =>
            Number(medicine.medicineId) === medicineId
        );

        if (
          !selectedMedicineIsActive ||
          !Number.isInteger(medicineId) ||
          !Number.isInteger(supplierId) ||
          !formData.batchName.trim() ||
          !formData.manufacturingDate ||
          !formData.expiryDate ||
          !Number.isFinite(purchasePrice) ||
          !Number.isFinite(sellingPrice) ||
          !Number.isInteger(quantity) ||
          purchasePrice < 0 ||
          sellingPrice <= 0 ||
          quantity < 0
        ) {
          alert(
            "Please select an active medicine and enter valid medicine batch details."
          );
          return;
        }

        const manufacturingDate = new Date(
          `${formData.manufacturingDate}T00:00:00`
        );

        const expiryDate = new Date(
          `${formData.expiryDate}T00:00:00`
        );

        if (
          Number.isNaN(manufacturingDate.getTime()) ||
          Number.isNaN(expiryDate.getTime()) ||
          expiryDate <= manufacturingDate
        ) {
          alert(
            "Expiry date must be after the manufacturing date."
          );
          return;
        }

        const data = {
          medicineId,
          supplierId,
          batchName: formData.batchName.trim(),
          manufacturingDate: formData.manufacturingDate,
          expiryDate: formData.expiryDate,
          purchasePrice,
          sellingPrice,
          quantity,
        };

        if (editingBatchId !== null) {
          const existingItem = medicineStock.find(
            (item) =>
              Number(item.batchId ?? item.id) ===
              Number(editingBatchId)
          );

          if (existingItem?.medicineIsActive === false) {
            alert("Inactive medicine batches cannot be edited.");
            return;
          }

          await api.put(
            `/MedicineBatch/${editingBatchId}`,
            {
              batchId: editingBatchId,
              ...data,
            }
          );

          alert("Medicine batch updated successfully.");
        } else {
          await api.post("/MedicineBatch", data);

          alert("Medicine stock added successfully.");
        }
      } else {
        if (
          otherItemMode === "addStock" &&
          selectedOtherItemId
        ) {
          const currentItem = otherItemStock.find(
            (item) =>
              getOtherItemId(item) ===
              Number(selectedOtherItemId)
          );

          if (!currentItem) {
            alert("Other item not found.");
            return;
          }

          const quantityToAdd = Number(formData.quantity);

          if (
            !Number.isInteger(quantityToAdd) ||
            quantityToAdd <= 0
          ) {
            alert(
              "Please enter a valid quantity greater than zero."
            );
            return;
          }

          const newQuantity =
            Number(currentItem.quantity ?? 0) +
            quantityToAdd;

          const productCategoryId =
            currentItem.productCategoryId ?? null;

          const data = {
            otherItemId: Number(selectedOtherItemId),
            itemName:
              currentItem.name ?? currentItem.itemName ?? "",
            category: currentItem.category ?? "",
            unit: currentItem.unit ?? "",
            purchasePrice: Number(
              currentItem.purchasePrice ?? 0
            ),
            sellingPrice: Number(
              currentItem.sellingPrice ?? 0
            ),
            quantity: newQuantity,
            reorderLevel: Number(
              currentItem.reorderLevel ?? 0
            ),
            productCategoryId: productCategoryId
              ? Number(productCategoryId)
              : null,
            status: true,
          };

          await api.put(
            `/OtherItem/${selectedOtherItemId}`,
            data
          );

          alert(
            `Stock added successfully!\nNew quantity: ${newQuantity}`
          );
        } else if (
          otherItemMode === "edit" &&
          selectedOtherItemId
        ) {
          const purchasePrice = Number(
            formData.purchasePrice
          );

          const sellingPrice = Number(
            formData.sellingPrice
          );

          const quantity = Number(formData.quantity);
          const reorderLevel = Number(formData.reorderLevel);

          if (
            !formData.itemName.trim() ||
            !Number.isFinite(purchasePrice) ||
            !Number.isFinite(sellingPrice) ||
            !Number.isInteger(quantity) ||
            !Number.isInteger(reorderLevel) ||
            purchasePrice < 0 ||
            sellingPrice <= 0 ||
            quantity < 0 ||
            reorderLevel < 0
          ) {
            alert("Please enter valid other item details.");
            return;
          }

          const data = {
            otherItemId: Number(selectedOtherItemId),
            itemName: formData.itemName.trim(),
            category: formData.category,
            unit: formData.unit,
            purchasePrice,
            sellingPrice,
            quantity,
            reorderLevel,
            productCategoryId: formData.productCategoryId
              ? Number(formData.productCategoryId)
              : null,
            status: true,
          };

          await api.put(
            `/OtherItem/${selectedOtherItemId}`,
            data
          );

          alert("Other item updated successfully.");
        } else {
          const itemName = formData.itemName.trim();
          const purchasePrice = Number(
            formData.purchasePrice
          );
          const sellingPrice = Number(
            formData.sellingPrice
          );
          const quantity = Number(formData.quantity);
          const reorderLevel = Number(
            formData.reorderLevel
          );

          if (
            !itemName ||
            !formData.productCategoryId ||
            !Number.isFinite(purchasePrice) ||
            !Number.isFinite(sellingPrice) ||
            !Number.isInteger(quantity) ||
            !Number.isInteger(reorderLevel) ||
            purchasePrice < 0 ||
            sellingPrice <= 0 ||
            quantity < 0 ||
            reorderLevel < 0
          ) {
            alert("Please enter valid other item details.");
            return;
          }

          const data = {
            itemName,
            category: formData.category,
            unit: formData.unit,
            purchasePrice,
            sellingPrice,
            quantity,
            reorderLevel,
            productCategoryId: Number(
              formData.productCategoryId
            ),
            status: true,
          };

          await api.post("/OtherItem", data);

          alert("Other item added successfully.");
        }
      }

      setShowForm(false);
      resetForm();

      await loadAllData();
    } catch (error) {
      console.error("SAVE STOCK ERROR:", error);
      console.error("RESPONSE:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          (typeof error.response?.data === "string"
            ? error.response.data
            : "Failed to save stock.")
      );
    } finally {
      setSaving(false);
    }
  };

  // COMBINE STOCK
  const allStock = [
    ...medicineStock.map((item) => ({
      ...item,
      itemType: "Medicine",
      reorderLevel: 0,
    })),
    ...otherItemStock.map((item) => ({
      ...item,
      itemType: "Other Item",
    })),
  ];

  const searchText = search.trim().toLowerCase();

  const filteredMedicineStock = medicineStock.filter(
    (item) => {
      const name = String(item.name ?? "").toLowerCase();

      return (
        name.includes(searchText) &&
        (filter === "All" || filter === "Medicine")
      );
    }
  );

  const filteredOtherItemStock = otherItemStock.filter(
    (item) => {
      const name = String(
        item.name ?? item.itemName ?? ""
      ).toLowerCase();

      return (
        name.includes(searchText) &&
        (filter === "All" || filter === "Other Item")
      );
    }
  );

  const totalItems = allStock.length;

  const lowStock = allStock.filter(
    (item) =>
      item.itemType === "Other Item" &&
      Number(item.quantity) > 0 &&
      Number(item.quantity) <=
        Number(item.reorderLevel ?? 0)
  ).length;

  const outOfStock = allStock.filter(
    (item) => Number(item.quantity ?? 0) === 0
  ).length;

  const stockValue = allStock.reduce(
    (total, item) =>
      total +
      Number(item.quantity ?? 0) *
        Number(item.purchasePrice ?? 0),
    0
  );

  // EXPIRY HELPERS
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;

    const today = new Date();
    const expiry = new Date(expiryDate);

    if (Number.isNaN(expiry.getTime())) return null;

    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expiry.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const expiringSoon = medicineStock.filter((item) => {
    if (
      item.medicineIsActive === false ||
      Number(item.quantity ?? 0) <= 0
    ) {
      return false;
    }

    const days = getDaysUntilExpiry(item.expiryDate);

    return days !== null && days >= 0 && days <= 30;
  }).length;

  const expiredStock = medicineStock.filter((item) => {
    if (
      item.medicineIsActive === false ||
      Number(item.quantity ?? 0) <= 0
    ) {
      return false;
    }

    const days = getDaysUntilExpiry(item.expiryDate);

    return days !== null && days < 0;
  }).length;

  const getStatus = (item) => {
    const quantity = Number(item.quantity ?? 0);

    if (
      item.itemType === "Medicine" &&
      item.medicineIsActive === false
    ) {
      return (
        <span className="status-badge out-stock">
          Inactive Medicine
        </span>
      );
    }

    if (quantity <= 0) {
      return (
        <span className="status-badge out-stock">
          Out of Stock
        </span>
      );
    }

    if (
      item.itemType === "Medicine" &&
      item.expiryDate
    ) {
      const days = getDaysUntilExpiry(item.expiryDate);

      if (days !== null && days < 0) {
        return (
          <span className="status-badge out-stock">
            Expired
          </span>
        );
      }

      if (days !== null && days <= 30) {
        return (
          <span className="status-badge low-stock">
            Expiring Soon
          </span>
        );
      }
    }

    if (
      item.itemType === "Other Item" &&
      quantity <= Number(item.reorderLevel ?? 0)
    ) {
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

  const getFormTitle = () => {
    if (editingBatchId !== null) return "Edit Medicine Batch";
    if (otherItemMode === "edit") return "Edit Other Item";
    if (otherItemMode === "addStock") return "Add Other Item Stock";

    return "Add New Stock";
  };

  const getFormDescription = () => {
    if (editingBatchId !== null) {
      return "Update medicine batch stock details";
    }

    if (otherItemMode === "edit") {
      return "Update other item information";
    }

    if (otherItemMode === "addStock") {
      return "Add quantity to existing other item stock";
    }

    return "Add medicine or other item to your inventory";
  };

  return (
    <div className="stock-page">
      <div className="stock-header">
        <div className="stock-title-row">
          <div className="stock-title-icon">📦</div>

          <div>
            <h1>Stock Management</h1>
            <p>Manage your pharmacy inventory</p>
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
            className="stock-add-btn"
            onClick={handleOpenAddStock}
          >
            <span>+</span>
            Add Stock
          </button>
        </div>
      </div>

      {/* ADD / EDIT STOCK FORM */}
      {showForm && (
        <div className="medicine-form-card">
          <div className="medicine-form-header">
            <div>
              <h3>{getFormTitle()}</h3>
              <p>{getFormDescription()}</p>
            </div>

            <button
              type="button"
              className="close-form-btn"
              onClick={closeForm}
              title="Close"
              disabled={saving}
            >
              ✕
            </button>
          </div>

          {editingBatchId === null && !otherItemMode && (
            <div className="stock-item-type">
              <label>Item Type</label>

              <div className="stock-type-options">
                <label
                  className={
                    itemType === "Medicine" ? "selected" : ""
                  }
                >
                  <input
                    type="radio"
                    name="itemType"
                    value="Medicine"
                    checked={itemType === "Medicine"}
                    onChange={() =>
                      handleItemTypeChange("Medicine")
                    }
                  />

                  <span className="stock-type-icon">💊</span>

                  <span className="stock-type-text">
                    <strong>Medicine</strong>
                    <small>Add medicine batch stock</small>
                  </span>
                </label>

                <label
                  className={
                    itemType === "Other Item" ? "selected" : ""
                  }
                >
                  <input
                    type="radio"
                    name="itemType"
                    value="Other Item"
                    checked={itemType === "Other Item"}
                    onChange={() =>
                      handleItemTypeChange("Other Item")
                    }
                  />

                  <span className="stock-type-icon other-icon">
                    📦
                  </span>

                  <span className="stock-type-text">
                    <strong>Other Item</strong>
                    <small>Add non-medicine stock</small>
                  </span>
                </label>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {itemType === "Medicine" && (
              <div className="medicine-form-grid">
                <div className="form-group">
                  <label>Medicine</label>

                  <select
                    name="medicineId"
                    value={formData.medicineId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Medicine</option>

                    {medicines.map((medicine) => (
                      <option
                        key={medicine.medicineId}
                        value={medicine.medicineId}
                      >
                        {medicine.name} - {medicine.strength ?? ""}
                      </option>
                    ))}
                  </select>

                  {medicines.length === 0 && (
                    <small>
                      No active medicines available. Add a medicine first.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Supplier</label>

                  <select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Supplier</option>

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

                <div className="form-group">
                  <label>Batch Name</label>

                  <input
                    type="text"
                    name="batchName"
                    placeholder="Example: PAN-2026-02"
                    value={formData.batchName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Manufacturing Date</label>

                  <input
                    type="date"
                    name="manufacturingDate"
                    value={formData.manufacturingDate}
                    onChange={handleChange}
                    max={formData.expiryDate || undefined}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>

                  <input
                    type="date"
                    name="expiryDate"
                    min={formData.manufacturingDate || undefined}
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Price</label>

                  <input
                    type="number"
                    name="purchasePrice"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price</label>

                  <input
                    type="number"
                    name="sellingPrice"
                    min="0.01"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {itemType === "Other Item" && (
              <div className="medicine-form-grid">
                <div className="form-group">
                  <label>Item Name</label>

                  <input
                    type="text"
                    name="itemName"
                    placeholder="Example: Baby Diaper"
                    value={formData.itemName}
                    onChange={handleChange}
                    required
                    disabled={otherItemMode === "addStock"}
                  />
                </div>

                <div className="form-group">
                  <label>Product Category</label>

                  <select
                    name="productCategoryId"
                    value={formData.productCategoryId}
                    onChange={handleChange}
                    required={otherItemMode !== "addStock"}
                    disabled={otherItemMode === "addStock"}
                  >
                    <option value="">Select Category</option>

                    {categories
                      .filter(
                        (category) => category.status !== false
                      )
                      .map((category) => (
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
                  <label>Category</label>

                  <input
                    type="text"
                    name="category"
                    placeholder="Example: Baby Care"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={otherItemMode === "addStock"}
                  />
                </div>

                <div className="form-group">
                  <label>Unit</label>

                  <input
                    type="text"
                    name="unit"
                    placeholder="Example: Pack"
                    value={formData.unit}
                    onChange={handleChange}
                    disabled={otherItemMode === "addStock"}
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Price</label>

                  <input
                    type="number"
                    name="purchasePrice"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    required
                    disabled={otherItemMode === "addStock"}
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price</label>

                  <input
                    type="number"
                    name="sellingPrice"
                    min="0.01"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    required
                    disabled={otherItemMode === "addStock"}
                  />
                </div>

                <div className="form-group">
                  <label>
                    {otherItemMode === "addStock"
                      ? "Quantity to Add"
                      : "Quantity"}
                  </label>

                  <input
                    type="number"
                    name="quantity"
                    min={otherItemMode === "addStock" ? "1" : "0"}
                    step="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder={
                      otherItemMode === "addStock"
                        ? "Enter quantity to add"
                        : "Enter quantity"
                    }
                    required
                  />

                  {otherItemMode === "addStock" && (
                    <small className="stock-current-quantity">
                      Current stock:{" "}
                      {otherItemStock.find(
                        (item) =>
                          getOtherItemId(item) ===
                          Number(selectedOtherItemId)
                      )?.quantity ?? 0}
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Reorder Level</label>

                  <input
                    type="number"
                    name="reorderLevel"
                    min="0"
                    step="1"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    required
                    disabled={otherItemMode === "addStock"}
                  />
                </div>
              </div>
            )}

            <div className="medicine-form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-medicine-btn"
                disabled={
                  saving ||
                  (itemType === "Medicine" &&
                    medicines.length === 0)
                }
              >
                {saving
                  ? "Saving..."
                  : editingBatchId !== null
                  ? "Update Stock"
                  : otherItemMode === "edit"
                  ? "Update Item"
                  : otherItemMode === "addStock"
                  ? "Add Stock"
                  : "Save Stock"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STOCK SUMMARY */}
      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <div className="stock-summary-icon total">📦</div>
          <div>
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon low">⚠️</div>
          <div>
            <span>Low Stock</span>
            <strong>{lowStock}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon out">🚫</div>
          <div>
            <span>Out of Stock</span>
            <strong>{outOfStock}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon value">💰</div>
          <div>
            <span>Stock Value</span>
            <strong>
              Rs.{" "}
              {stockValue.toLocaleString("en-LK", {
                minimumFractionDigits: 2,
              })}
            </strong>
          </div>
        </div>
      </div>

      <div className="stock-summary-grid">
        <div className="stock-summary-card">
          <div className="stock-summary-icon low">⏳</div>
          <div>
            <span>Expiring Soon</span>
            <strong>{expiringSoon}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon out">⚠️</div>
          <div>
            <span>Expired Stock</span>
            <strong>{expiredStock}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="stock-toolbar">
        <div className="stock-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search medicine or other item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="stock-filter-box">
          <span>Show:</span>

          <select
            className="stock-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Items</option>
            <option value="Medicine">Medicines</option>
            <option value="Other Item">Other Items</option>
          </select>
        </div>
      </div>

      {/* MEDICINE STOCK TABLE */}
      {(filter === "All" || filter === "Medicine") && (
        <div className="stock-section-card">
          <div className="stock-section-header">
            <div className="stock-section-title">
              <span className="stock-section-icon medicine-section-icon">
                💊
              </span>

              <div>
                <h3>Medicine Stock</h3>
                <p>
                  {filteredMedicineStock.length} medicine
                  {filteredMedicineStock.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>

          {filteredMedicineStock.length === 0 ? (
            <div className="stock-empty-small">
              <span>💊</span>
              <p>No medicine stock found.</p>
            </div>
          ) : (
            <div className="stock-table-wrapper">
              <table className="medicine-table stock-table">
                <thead>
                  <tr>
                    <th>MEDICINE</th>
                    <th>STRENGTH</th>
                    <th>BATCH</th>
                    <th>SUPPLIER</th>
                    <th>MFG. DATE</th>
                    <th>EXPIRY DATE</th>
                    <th>PURCHASE PRICE</th>
                    <th>SELLING PRICE</th>
                    <th>QTY</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMedicineStock.map((item) => {
                    const batchId = item.batchId ?? item.id;

                    return (
                      <tr key={`medicine-${batchId}`}>
                        <td>
                          <div className="medicine-name-cell stock-name-cell">
                            <div className="medicine-icon medicine-stock-icon">
                              💊
                            </div>

                            <strong>{item.name}</strong>
                          </div>
                        </td>

                        <td>
                          <span className="stock-detail-text">
                            {item.strength || "-"}
                          </span>
                        </td>

                        <td>
                          <span className="batch-badge">
                            {item.batchName}
                          </span>
                        </td>

                        <td>{item.supplier || "-"}</td>

                        <td>
                          {item.manufacturingDate
                            ? new Date(
                                item.manufacturingDate
                              ).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td>
                          {item.expiryDate
                            ? new Date(
                                item.expiryDate
                              ).toLocaleDateString("en-GB")
                            : "-"}
                        </td>

                        <td className="stock-price">
                          Rs.{" "}
                          {Number(
                            item.purchasePrice ?? 0
                          ).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="stock-price">
                          Rs.{" "}
                          {Number(
                            item.sellingPrice ?? 0
                          ).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td>
                          <strong className="stock-quantity">
                            {item.quantity}
                          </strong>

                          <span className="stock-unit">
                            {" "}{item.unit || ""}
                          </span>
                        </td>

                        <td>
                          {getStatus({
                            ...item,
                            itemType: "Medicine",
                          })}
                        </td>

                        <td>
                          <div className="stock-action-buttons">
                            <button
                              type="button"
                              className="stock-action-btn stock-edit-btn"
                              onClick={() =>
                                handleEditMedicine(item)
                              }
                              title="Edit"
                              disabled={
                                item.medicineIsActive === false
                              }
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="stock-action-btn stock-delete-btn"
                              onClick={() =>
                                handleDeleteMedicine(item)
                              }
                              title="Delete"
                              disabled={
                                item.medicineIsActive === false
                              }
                            >
                              🗑️
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
      )}

      {/* OTHER ITEM STOCK TABLE */}
      {(filter === "All" || filter === "Other Item") && (
        <div className="stock-section-card other-stock-section">
          <div className="stock-section-header">
            <div className="stock-section-title">
              <span className="stock-section-icon other-section-icon">
                📦
              </span>

              <div>
                <h3>Other Item Stock</h3>
                <p>
                  {filteredOtherItemStock.length} item
                  {filteredOtherItemStock.length !== 1 ? "s" : ""} found
                </p>
              </div>
            </div>
          </div>

          {filteredOtherItemStock.length === 0 ? (
            <div className="stock-empty-small">
              <span>📦</span>
              <p>No other item stock found.</p>
            </div>
          ) : (
            <div className="stock-table-wrapper">
              <table className="medicine-table stock-table">
                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>PRODUCT CATEGORY</th>
                    <th>CATEGORY</th>
                    <th>UNIT</th>
                    <th>PURCHASE PRICE</th>
                    <th>SELLING PRICE</th>
                    <th>QTY</th>
                    <th>REORDER LEVEL</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOtherItemStock.map((item) => {
                    const itemId = getOtherItemId(item);

                    return (
                      <tr key={`other-${itemId}`}>
                        <td>
                          <div className="medicine-name-cell stock-name-cell">
                            <div className="medicine-icon other-stock-icon">
                              📦
                            </div>

                            <strong>
                              {item.name ?? item.itemName ?? "-"}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span className="product-category-badge">
                            {item.productCategoryName ??
                              item.category ??
                              "-"}
                          </span>
                        </td>

                        <td>{item.category ?? "-"}</td>
                        <td>{item.unit ?? "-"}</td>

                        <td className="stock-price">
                          Rs.{" "}
                          {Number(
                            item.purchasePrice ?? 0
                          ).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="stock-price">
                          Rs.{" "}
                          {Number(
                            item.sellingPrice ?? 0
                          ).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td>
                          <strong className="stock-quantity">
                            {item.quantity}
                          </strong>

                          <span className="stock-unit">
                            {" "}{item.unit ?? ""}
                          </span>
                        </td>

                        <td>
                          <span className="reorder-level">
                            {item.reorderLevel ?? 0}
                          </span>
                        </td>

                        <td>
                          {getStatus({
                            ...item,
                            itemType: "Other Item",
                          })}
                        </td>

                        <td>
                          <div className="stock-action-buttons">
                            <button
                              type="button"
                              className="stock-action-btn stock-add-item-btn"
                              onClick={() =>
                                handleAddOtherItemStock(item)
                              }
                              title="Add Stock"
                            >
                              ➕
                            </button>

                            <button
                              type="button"
                              className="stock-action-btn stock-edit-btn"
                              onClick={() =>
                                handleEditOtherItem(item)
                              }
                              title="Edit"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              className="stock-action-btn stock-delete-btn"
                              onClick={() =>
                                handleDeleteOtherItem(itemId)
                              }
                              title="Delete"
                            >
                              🗑️
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
      )}
    </div>
  );
}

export default Stock;