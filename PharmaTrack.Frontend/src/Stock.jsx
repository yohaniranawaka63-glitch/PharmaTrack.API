import { useEffect, useState } from "react";
import api from "./api";
import {
  Package,
  Pill,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Plus,
  X,
  LogOut,
  DollarSign,
  Clock,
  Ban,
} from "lucide-react";

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

  const getField = (item, camelCase, pascalCase) =>
    item?.[camelCase] ?? item?.[pascalCase];

  const normalizeMedicine = (medicine) => ({
    ...medicine,
    medicineId: getField(medicine, "medicineId", "MedicineId"),
    name: getField(medicine, "name", "Name"),
    genericName: getField(medicine, "genericName", "GenericName"),
    strength: getField(medicine, "strength", "Strength"),
    category: getField(medicine, "category", "Category"),
    unit: getField(medicine, "unit", "Unit"),
    isActive: getField(medicine, "isActive", "IsActive"),
  });

  const normalizeSupplier = (supplier) => ({
    ...supplier,
    supplierId: getField(supplier, "supplierId", "SupplierId"),
    supplierName: getField(supplier, "supplierName", "SupplierName"),
    isActive: getField(supplier, "isActive", "IsActive"),
  });

  const normalizeCategory = (category) => ({
    ...category,
    categoryId: getField(category, "categoryId", "CategoryId"),
    categoryName: getField(category, "categoryName", "CategoryName"),
    status: getField(category, "status", "Status"),
  });

  const getOtherItemId = (item) => {
    const id =
      item?.otherItemId ??
      item?.OtherItemId ??
      item?.id ??
      item?.Id;

    return id != null ? Number(id) : null;
  };

  const normalizeOtherItem = (item) => {
    const productCategory = getField(
      item,
      "productCategory",
      "ProductCategory"
    );

    return {
      ...item,
      otherItemId: getOtherItemId(item),
      name:
        getField(item, "itemName", "ItemName") ??
        getField(item, "name", "Name") ??
        "",
      itemName:
        getField(item, "itemName", "ItemName") ??
        getField(item, "name", "Name") ??
        "",
      productCategoryId: getField(
        item,
        "productCategoryId",
        "ProductCategoryId"
      ),
      productCategoryName:
        getField(productCategory, "categoryName", "CategoryName") ??
        getField(item, "productCategoryName", "ProductCategoryName") ??
        "",
      category: getField(item, "category", "Category") ?? "",
      unit: getField(item, "unit", "Unit") ?? "",
      purchasePrice: getField(item, "purchasePrice", "PurchasePrice"),
      sellingPrice: getField(item, "sellingPrice", "SellingPrice"),
      quantity: getField(item, "quantity", "Quantity"),
      reorderLevel: getField(item, "reorderLevel", "ReorderLevel"),
      status: getField(item, "status", "Status"),
    };
  };

  useEffect(() => {
    loadAllData();
  }, []);

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

      const medicineList = (
        Array.isArray(medicineResponse.data)
          ? medicineResponse.data
          : []
      ).map(normalizeMedicine);

      const supplierList = (
        Array.isArray(supplierResponse.data)
          ? supplierResponse.data
          : []
      ).map(normalizeSupplier);

      const categoryList = (
        Array.isArray(categoryResponse.data)
          ? categoryResponse.data
          : []
      ).map(normalizeCategory);

      setMedicines(medicineList);
      setSuppliers(supplierList);
      setCategories(categoryList);

      await loadStock(medicineList, supplierList);
    } catch (error) {
      console.error("LOAD DATA ERROR:", error);
      alert(
        error.response?.data?.message ||
          "Failed to load stock data."
      );
    }
  };

  const loadStock = async (
    medicineList = null,
    supplierList = null
  ) => {
    try {
      let currentMedicines = medicineList;
      let currentSuppliers = supplierList;

      if (!Array.isArray(currentMedicines)) {
        const response = await api.get("/Medicine");
        currentMedicines = (
          Array.isArray(response.data) ? response.data : []
        ).map(normalizeMedicine);
        setMedicines(currentMedicines);
      }

      if (!Array.isArray(currentSuppliers)) {
        const response = await api.get("/Supplier");
        currentSuppliers = (
          Array.isArray(response.data) ? response.data : []
        ).map(normalizeSupplier);
        setSuppliers(currentSuppliers);
      }

      const activeMedicineIds = new Set(
        currentMedicines
          .filter((medicine) => medicine.isActive === true)
          .map((medicine) => Number(medicine.medicineId))
      );

      const supplierMap = new Map(
        currentSuppliers.map((supplier) => [
          Number(supplier.supplierId),
          supplier.supplierName,
        ])
      );

      const medicineMap = new Map(
        currentMedicines.map((medicine) => [
          Number(medicine.medicineId),
          medicine,
        ])
      );

      const [medicineResponse, otherItemResponse] =
        await Promise.all([
          api.get("/MedicineBatch"),
          api.get("/OtherItem"),
        ]);

      const medicineRows = Array.isArray(medicineResponse.data)
        ? medicineResponse.data
        : [];

      setMedicineStock(
        medicineRows.map((item) => {
          const medicineId = Number(
            getField(item, "medicineId", "MedicineId")
          );

          const supplierId = getField(
            item,
            "supplierId",
            "SupplierId"
          );

          const medicine =
            getField(item, "medicine", "Medicine") ??
            medicineMap.get(medicineId);

          const supplier = getField(item, "supplier", "Supplier");

          return {
            ...item,
            batchId: Number(
              getField(item, "batchId", "BatchId") ??
                getField(item, "id", "Id")
            ),
            medicineId,
            supplierId,
            batchName: getField(item, "batchName", "BatchName"),
            manufacturingDate: getField(
              item,
              "manufacturingDate",
              "ManufacturingDate"
            ),
            expiryDate: getField(item, "expiryDate", "ExpiryDate"),
            purchasePrice: getField(
              item,
              "purchasePrice",
              "PurchasePrice"
            ),
            sellingPrice: getField(
              item,
              "sellingPrice",
              "SellingPrice"
            ),
            quantity: getField(item, "quantity", "Quantity"),
            name:
              getField(medicine, "name", "Name") ??
              getField(item, "medicineName", "MedicineName") ??
              "",
            strength:
              getField(medicine, "strength", "Strength") ??
              getField(item, "strength", "Strength") ??
              "",
            unit:
              getField(medicine, "unit", "Unit") ??
              getField(item, "unit", "Unit") ??
              "",
            supplier:
              getField(supplier, "supplierName", "SupplierName") ??
              supplierMap.get(Number(supplierId)) ??
              "",
            medicineIsActive: activeMedicineIds.has(medicineId),
          };
        })
      );

      const otherItems = Array.isArray(otherItemResponse.data)
        ? otherItemResponse.data
        : [];

      setOtherItemStock(otherItems.map(normalizeOtherItem));
    } catch (error) {
      console.error("LOAD STOCK ERROR:", error);
      alert(
        error.response?.data?.message ||
          "Failed to load stock data."
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

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

  const handleOpenAddStock = () => {
    resetForm();
    setItemType("Medicine");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemTypeChange = (type) => {
    resetForm();
    setItemType(type);
  };

  // EDIT MEDICINE BATCH
  const handleEditMedicine = async (item) => {
    console.log("EDIT MEDICINE CLICKED:", item);

    const id = Number(
      item?.batchId ??
      item?.BatchId ??
      item?.id ??
      item?.Id
    );

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
        (b) =>
          Number(
            getField(b, "batchId", "BatchId") ??
            getField(b, "id", "Id")
          ) === id
      );

      if (!batch) {
        alert("Medicine batch details could not be found.");
        return;
      }

      const batchMedicineId = Number(
        getField(batch, "medicineId", "MedicineId") ??
        item.medicineId
      );

      setItemType("Medicine");
      setEditingBatchId(id);
      setOtherItemMode(null);
      setSelectedOtherItemId(null);

      setFormData({
        ...emptyForm,
        medicineId: String(batchMedicineId),
        supplierId: String(
          getField(batch, "supplierId", "SupplierId") ??
          item.supplierId ??
          ""
        ),
        batchName:
          getField(batch, "batchName", "BatchName") ??
          item.batchName ??
          "",
        manufacturingDate: String(
          getField(batch, "manufacturingDate", "ManufacturingDate") ??
          item.manufacturingDate ??
          ""
        ).substring(0, 10),
        expiryDate: String(
          getField(batch, "expiryDate", "ExpiryDate") ??
          item.expiryDate ??
          ""
        ).substring(0, 10),
        purchasePrice:
          getField(batch, "purchasePrice", "PurchasePrice") ??
          item.purchasePrice ??
          "",
        sellingPrice:
          getField(batch, "sellingPrice", "SellingPrice") ??
          item.sellingPrice ??
          "",
        quantity:
          getField(batch, "quantity", "Quantity") ??
          item.quantity ??
          "",
      });

      setShowForm(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    console.log("DELETE MEDICINE CLICKED:", itemOrId);

    const item =
      typeof itemOrId === "object" && itemOrId !== null
        ? itemOrId
        : medicineStock.find(
            (row) =>
              Number(row.batchId ?? row.BatchId ?? row.id) ===
              Number(itemOrId)
          );

    const id = Number(
      typeof itemOrId === "object" && itemOrId !== null
        ? itemOrId.batchId ??
          itemOrId.BatchId ??
          itemOrId.id ??
          itemOrId.Id
        : itemOrId
    );

    if (!Number.isInteger(id) || id <= 0) {
      alert("Medicine batch ID not found.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to deactivate this medicine batch?"
      )
    ) {
      return;
    }

    try {
      const response = await api.delete(`/MedicineBatch/${id}`);

      alert(
        response.data?.message ??
        "Medicine batch deactivated successfully."
      );

      await loadAllData();
    } catch (error) {
      console.error("DELETE MEDICINE ERROR:", error);
      alert(
        error.response?.data?.message ||
        "Failed to deactivate medicine batch."
      );
    }
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
      itemName: item.itemName ?? item.name ?? "",
      category: item.category ?? "",
      unit: item.unit ?? "",
      reorderLevel: item.reorderLevel ?? "",
      productCategoryId: item.productCategoryId ?? "",
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      itemName: item.itemName ?? item.name ?? "",
      category: item.category ?? "",
      unit: item.unit ?? "",
      reorderLevel: item.reorderLevel ?? "",
      productCategoryId: item.productCategoryId ?? "",
    });

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      await loadAllData();
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

        if (
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
          alert("Please enter valid medicine batch details.");
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
          alert("Expiry date must be after the manufacturing date.");
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
          await api.put(`/MedicineBatch/${editingBatchId}`, {
            batchId: editingBatchId,
            ...data,
          });

          alert("Medicine batch updated successfully.");
        } else {
          await api.post("/MedicineBatch", data);
          alert("Medicine stock added successfully.");
        }
      } else {
        if (otherItemMode === "addStock" && selectedOtherItemId) {
          const currentItem = otherItemStock.find(
            (item) =>
              getOtherItemId(item) === Number(selectedOtherItemId)
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
            alert("Please enter a valid quantity greater than zero.");
            return;
          }

          const newQuantity =
            Number(currentItem.quantity ?? 0) + quantityToAdd;

          const data = {
            ItemName:
              currentItem.itemName ?? currentItem.name ?? "",
            Category: currentItem.category || null,
            Unit: currentItem.unit || null,
            PurchasePrice: Number(currentItem.purchasePrice ?? 0),
            SellingPrice: Number(currentItem.sellingPrice ?? 0),
            Quantity: newQuantity,
            ReorderLevel: Number(currentItem.reorderLevel ?? 0),
            ProductCategoryId: currentItem.productCategoryId
              ? Number(currentItem.productCategoryId)
              : null,
            Status: currentItem.status ?? true,
          };

          await api.put(`/OtherItem/${selectedOtherItemId}`, data);

          alert(
            `Stock added successfully!\nNew quantity: ${newQuantity}`
          );
        } else if (
          otherItemMode === "edit" &&
          selectedOtherItemId
        ) {
          const itemName = formData.itemName.trim();
          const purchasePrice = Number(formData.purchasePrice);
          const sellingPrice = Number(formData.sellingPrice);
          const quantity = Number(formData.quantity);
          const reorderLevel = Number(formData.reorderLevel);

          if (
            !itemName ||
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
            ItemName: itemName,
            Category: formData.category || null,
            Unit: formData.unit || null,
            PurchasePrice: purchasePrice,
            SellingPrice: sellingPrice,
            Quantity: quantity,
            ReorderLevel: reorderLevel,
            ProductCategoryId: formData.productCategoryId
              ? Number(formData.productCategoryId)
              : null,
            Status: true,
          };

          await api.put(`/OtherItem/${selectedOtherItemId}`, data);
          alert("Other item updated successfully.");
        } else {
          const itemName = formData.itemName.trim();
          const purchasePrice = Number(formData.purchasePrice);
          const sellingPrice = Number(formData.sellingPrice);
          const quantity = Number(formData.quantity);
          const reorderLevel = Number(formData.reorderLevel);

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
            ItemName: itemName,
            Category: formData.category || null,
            Unit: formData.unit || null,
            PurchasePrice: purchasePrice,
            SellingPrice: sellingPrice,
            Quantity: quantity,
            ReorderLevel: reorderLevel,
            ProductCategoryId: Number(formData.productCategoryId),
            Status: true,
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

  const filteredMedicineStock = medicineStock.filter((item) => {
    const name = String(item.name ?? "").toLowerCase();
    const strength = String(item.strength ?? "").toLowerCase();
    const batchName = String(item.batchName ?? "").toLowerCase();
    const supplier = String(item.supplier ?? "").toLowerCase();

    return (
      (name.includes(searchText) ||
        strength.includes(searchText) ||
        batchName.includes(searchText) ||
        supplier.includes(searchText)) &&
      (filter === "All" || filter === "Medicine")
    );
  });

  const filteredOtherItemStock = otherItemStock.filter((item) => {
    const name = String(
      item.name ?? item.itemName ?? ""
    ).toLowerCase();
    const category = String(item.category ?? "").toLowerCase();

    return (
      (name.includes(searchText) ||
        category.includes(searchText)) &&
      (filter === "All" || filter === "Other Item")
    );
  });

  const totalItems = allStock.length;

  const lowStock = allStock.filter(
    (item) =>
      item.itemType === "Other Item" &&
      Number(item.quantity) > 0 &&
      Number(item.quantity) <= Number(item.reorderLevel ?? 0)
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

    if (item.itemType === "Medicine" && item.expiryDate) {
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

  const activeMedicines = medicines.filter(
    (medicine) => medicine.isActive === true
  );

  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.isActive !== false
  );

  const activeCategories = categories.filter(
    (category) => category.status !== false
  );

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
          <div className="stock-title-icon">
            <Package size={20} />
          </div>
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
            <LogOut size={16} /> Logout
          </button>

          <button
            type="button"
            className="stock-add-btn"
            onClick={handleOpenAddStock}
          >
            <span>
              <Plus size={16} />
            </span>
            Add Stock
          </button>
        </div>
      </div>

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
              <X size={16} />
            </button>
          </div>

          {editingBatchId === null && !otherItemMode && (
            <div className="stock-item-type">
              <label>Item Type</label>

              <div className="stock-type-options">
                <label
                  className={itemType === "Medicine" ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="itemType"
                    value="Medicine"
                    checked={itemType === "Medicine"}
                    onChange={() => handleItemTypeChange("Medicine")}
                  />
                  <span className="stock-type-icon">
                    <Pill size={18} />
                  </span>
                  <span className="stock-type-text">
                    <strong>Medicine</strong>
                    <small>Add medicine batch stock</small>
                  </span>
                </label>

                <label
                  className={itemType === "Other Item" ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="itemType"
                    value="Other Item"
                    checked={itemType === "Other Item"}
                    onChange={() => handleItemTypeChange("Other Item")}
                  />
                  <span className="stock-type-icon other-icon">
                    <Package size={20} />
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
                    {activeMedicines.map((medicine) => (
                      <option
                        key={medicine.medicineId}
                        value={medicine.medicineId}
                      >
                        {medicine.name} - {medicine.strength ?? ""}
                      </option>
                    ))}
                  </select>

                  {activeMedicines.length === 0 && (
                    <small>
                      No active medicines available. Add or activate a
                      medicine first.
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
                    {activeSuppliers.map((supplier) => (
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
                disabled={saving}
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
          <div className="stock-summary-icon total">
            <Package size={20} />
          </div>
          <div>
            <span>Total Items</span>
            <strong>{totalItems}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon low">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>Low Stock</span>
            <strong>{lowStock}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon out">
            <Ban size={20} />
          </div>
          <div>
            <span>Out of Stock</span>
            <strong>{outOfStock}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon value">
            <DollarSign size={20} />
          </div>
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
          <div className="stock-summary-icon low">
            <Clock size={20} />
          </div>
          <div>
            <span>Expiring Soon</span>
            <strong>{expiringSoon}</strong>
          </div>
        </div>

        <div className="stock-summary-card">
          <div className="stock-summary-icon out">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span>Expired Stock</span>
            <strong>{expiredStock}</strong>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER */}
      <div className="stock-toolbar">
        <div className="stock-search">
          <span>
            <Search size={18} />
          </span>
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
                <Pill size={18} />
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
              <span><Pill size={18} /></span>
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
                    const batchId =
                      item.batchId ?? item.BatchId ?? item.id;

                    return (
                      <tr key={`medicine-${batchId}`}>
                        <td>
                          <div className="medicine-name-cell stock-name-cell">
                            <div className="medicine-icon medicine-stock-icon">
                              <Pill size={18} />
                            </div>
                            <strong>{item.name || "-"}</strong>
                          </div>
                        </td>
                        <td>
                          <span className="stock-detail-text">
                            {item.strength || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="batch-badge">
                            {item.batchName || "-"}
                          </span>
                        </td>
                        <td>{item.supplier || "-"}</td>
                        <td>
                          {item.manufacturingDate
                            ? new Date(item.manufacturingDate).toLocaleDateString("en-GB")
                            : "-"}
                        </td>
                        <td>
                          {item.expiryDate
                            ? new Date(item.expiryDate).toLocaleDateString("en-GB")
                            : "-"}
                        </td>
                        <td className="stock-price">
                          Rs.{" "}
                          {Number(item.purchasePrice ?? 0).toLocaleString(
                            "en-LK",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="stock-price">
                          Rs.{" "}
                          {Number(item.sellingPrice ?? 0).toLocaleString(
                            "en-LK",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td>
                          <strong className="stock-quantity">
                            {item.quantity ?? 0}
                          </strong>
                          <span className="stock-unit">
                            {" "}{item.unit || ""}
                          </span>
                        </td>
                        <td>
                          {getStatus({ ...item, itemType: "Medicine" })}
                        </td>
                        <td>
                          <div className="stock-action-buttons">
                            <button
                              type="button"
                              className="stock-action-btn stock-edit-btn"
                              onClick={() => handleEditMedicine(item)}
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="stock-action-btn stock-delete-btn"
                              onClick={() => handleDeleteMedicine(item)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
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
                <Package size={20} />
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
              <span><Package size={20} /></span>
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
                              <Package size={20} />
                            </div>
                            <strong>
                              {item.name ?? item.itemName ?? "-"}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span className="product-category-badge">
                            {item.productCategoryName || item.category || "-"}
                          </span>
                        </td>
                        <td>{item.category || "-"}</td>
                        <td>{item.unit || "-"}</td>
                        <td className="stock-price">
                          Rs.{" "}
                          {Number(item.purchasePrice ?? 0).toLocaleString(
                            "en-LK",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="stock-price">
                          Rs.{" "}
                          {Number(item.sellingPrice ?? 0).toLocaleString(
                            "en-LK",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td>
                          <strong className="stock-quantity">
                            {item.quantity ?? 0}
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
                          {getStatus({ ...item, itemType: "Other Item" })}
                        </td>
                        <td>
                          <div className="stock-action-buttons">
                            <button
                              type="button"
                              className="stock-action-btn stock-add-item-btn"
                              onClick={() => handleAddOtherItemStock(item)}
                              title="Add Stock"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              type="button"
                              className="stock-action-btn stock-edit-btn"
                              onClick={() => handleEditOtherItem(item)}
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="stock-action-btn stock-delete-btn"
                              onClick={() => handleDeleteOtherItem(itemId)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
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