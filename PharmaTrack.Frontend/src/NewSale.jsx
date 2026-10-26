
import { useEffect, useState } from "react";
import api from "./api";

function NewSale({ onBack, onSaleCreated }) {
  const [medicines, setMedicines] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [batches, setBatches] = useState([]);

  const [selectedType, setSelectedType] = useState("medicine");
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [loading, setLoading] = useState(true);
  const [creatingSale, setCreatingSale] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // LOAD ACTIVE MEDICINES, OTHER ITEMS AND BATCHES
  const loadData = async () => {
    try {
      setLoading(true);

      const [medicineResponse, otherItemResponse, batchResponse] =
        await Promise.all([
          api.get("/Medicine"),
          api.get("/OtherItem"),
          api.get("/MedicineBatch"),
        ]);

      const medicineData = Array.isArray(medicineResponse.data)
        ? medicineResponse.data
        : [];

      const otherItemData = Array.isArray(otherItemResponse.data)
        ? otherItemResponse.data
        : [];

      const batchData = Array.isArray(batchResponse.data)
        ? batchResponse.data
        : [];

      console.log("MEDICINES:", medicineData);
      console.log("OTHER ITEMS:", otherItemData);
      console.log("BATCHES:", batchData);

      // Only active medicines are available for billing.
      setMedicines(
        medicineData
          .map((medicine) => ({
            ...medicine,
            medicineId: Number(
              medicine.medicineId ?? medicine.MedicineId
            ),
            name: medicine.name ?? medicine.Name ?? "",
            strength: medicine.strength ?? medicine.Strength ?? "",
            isActive:
              medicine.isActive ?? medicine.IsActive ?? false,
          }))
          .filter((medicine) => medicine.isActive === true)
      );

      setOtherItems(
        otherItemData.map((item) => ({
          ...item,
          otherItemId: Number(
            item.otherItemId ?? item.OtherItemId
          ),
          itemName: item.itemName ?? item.ItemName ?? "",
          quantity: Number(
            item.quantity ?? item.Quantity ?? 0
          ),
          sellingPrice: Number(
            item.sellingPrice ?? item.SellingPrice ?? 0
          ),
          status: item.status ?? item.Status ?? false,
        }))
      );

      setBatches(
        batchData.map((batch) => ({
          ...batch,
          batchId: Number(batch.batchId ?? batch.BatchId),
          medicineId: Number(
            batch.medicineId ?? batch.MedicineId
          ),
          quantity: Number(
            batch.quantity ?? batch.Quantity ?? 0
          ),
          sellingPrice: Number(
            batch.sellingPrice ?? batch.SellingPrice ?? 0
          ),
          expiryDate: batch.expiryDate ?? batch.ExpiryDate,
          batchName: batch.batchName ?? batch.BatchName ?? "",
          isActive: batch.isActive ?? batch.IsActive ?? false,
        }))
      );
    } catch (error) {
      console.error("Failed to load sale data:", error);
      console.error("Server response:", error.response?.data);

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          "Failed to load medicines and items."
      );
    } finally {
      setLoading(false);
    }
  };

  // GET AVAILABLE ACTIVE BATCH FOR ACTIVE MEDICINE
  const getAvailableBatch = (medicineId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const medicineBatches = batches
      .filter((batch) => {
        if (
          Number(batch.medicineId) !== Number(medicineId) ||
          Number(batch.quantity) <= 0 ||
          batch.isActive !== true
        ) {
          return false;
        }

        if (batch.expiryDate) {
          const expiryDate = new Date(batch.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);

          if (expiryDate < today) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = a.expiryDate
          ? new Date(a.expiryDate).getTime()
          : Infinity;

        const dateB = b.expiryDate
          ? new Date(b.expiryDate).getTime()
          : Infinity;

        return dateA - dateB;
      });

    return medicineBatches.length > 0
      ? medicineBatches[0]
      : null;
  };

  // SELECTED ITEMS
  const selectedMedicine = medicines.find(
    (medicine) =>
      Number(medicine.medicineId) === Number(selectedId)
  );

  const selectedOtherItem = otherItems.find(
    (item) =>
      Number(item.otherItemId) === Number(selectedId)
  );

  // CURRENCY
  const formatCurrency = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // ADD ITEM TO BILL
  const addToBill = () => {
    if (!selectedId) {
      alert("Please select an item.");
      return;
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      alert("Quantity must be a positive whole number.");
      return;
    }

    if (selectedType === "medicine") {
      const medicine = selectedMedicine;

      if (!medicine) {
        alert("Medicine not found or inactive.");
        return;
      }

      // Recheck active status before adding.
      if (medicine.isActive !== true) {
        alert("Inactive medicines cannot be added to a bill.");
        return;
      }

      const batch = getAvailableBatch(medicine.medicineId);

      if (!batch) {
        alert(
          `No active, unexpired batch with available stock found for ${medicine.name}.`
        );
        return;
      }

      const alreadyInCart = cart
        .filter(
          (item) =>
            item.type === "medicine" &&
            Number(item.batchId) === Number(batch.batchId)
        )
        .reduce(
          (total, item) => total + Number(item.quantity),
          0
        );

      if (
        Number(quantity) + alreadyInCart >
        Number(batch.quantity)
      ) {
        alert(
          `Insufficient stock for ${medicine.name}.\nAvailable stock: ${
            Number(batch.quantity) - alreadyInCart
          }`
        );
        return;
      }

      const price = Number(batch.sellingPrice || 0);

      if (price <= 0) {
        alert(
          `Selling price is not available for ${medicine.name}.`
        );
        return;
      }

      setCart((previousCart) => [
        ...previousCart,
        {
          type: "medicine",
          id: medicine.medicineId,
          batchId: batch.batchId,
          name: medicine.name,
          strength: medicine.strength || "",
          batchName: batch.batchName,
          price,
          quantity: Number(quantity),
        },
      ]);
    } else {
      const item = selectedOtherItem;

      if (!item) {
        alert("Other item not found.");
        return;
      }

      if (item.status !== true) {
        alert("Inactive other items cannot be added to a bill.");
        return;
      }

      const alreadyInCart = cart
        .filter(
          (cartItem) =>
            cartItem.type === "otherItem" &&
            Number(cartItem.id) === Number(item.otherItemId)
        )
        .reduce(
          (total, cartItem) =>
            total + Number(cartItem.quantity),
          0
        );

      if (
        Number(quantity) + alreadyInCart >
        Number(item.quantity || 0)
      ) {
        alert(
          `Insufficient stock for ${item.itemName}.\nAvailable stock: ${
            Number(item.quantity || 0) - alreadyInCart
          }`
        );
        return;
      }

      const price = Number(item.sellingPrice || 0);

      if (price <= 0) {
        alert(
          `Selling price is not available for ${item.itemName}.`
        );
        return;
      }

      setCart((previousCart) => [
        ...previousCart,
        {
          type: "otherItem",
          id: item.otherItemId,
          name: item.itemName,
          price,
          quantity: Number(quantity),
        },
      ]);
    }

    setSelectedId("");
    setQuantity(1);
  };

  // REMOVE ITEM FROM BILL
  const removeFromBill = (index) => {
    setCart((previousCart) =>
      previousCart.filter((_, cartIndex) => cartIndex !== index)
    );
  };

  // TOTAL AMOUNT
  const totalAmount = cart.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  // CREATE SALE
  const createSale = async () => {
    if (cart.length === 0) {
      alert("Please add at least one item to the bill.");
      return;
    }

    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    // Ensure medicines in the cart are still active.
    for (const item of cart) {
      if (item.type === "medicine") {
        const medicine = medicines.find(
          (currentMedicine) =>
            Number(currentMedicine.medicineId) === Number(item.id)
        );

        if (!medicine || medicine.isActive !== true) {
          alert(
            `${item.name} is inactive and cannot be billed. Remove it from the bill and refresh the page.`
          );
          return;
        }

        const batch = batches.find(
          (currentBatch) =>
            Number(currentBatch.batchId) === Number(item.batchId)
        );

        if (
          !batch ||
          batch.isActive !== true ||
          Number(batch.quantity) <= 0
        ) {
          alert(
            `${item.name} batch is inactive or unavailable. Remove it from the bill and refresh the page.`
          );
          return;
        }
      }
    }

    try {
      setCreatingSale(true);

      const saleItems = cart.map((item) => ({
        BatchId: item.type === "medicine" ? item.batchId : null,
        OtherItemId: item.type === "otherItem" ? item.id : null,
        Quantity: Number(item.quantity),
      }));

      const saleData = {
        SaleDate: new Date().toISOString(),
        PaymentMethod: paymentMethod,
        SaleItem: saleItems,
      };

      console.log(
        "SALE REQUEST DATA:",
        JSON.stringify(saleData, null, 2)
      );

      const response = await api.post("/Sale", saleData);

      console.log("CREATE SALE RESPONSE:", response.data);

      const createdSaleId =
        response.data?.SaleId ??
        response.data?.saleId ??
        response.data?.Id ??
        response.data?.id;

      const createdTotal =
        response.data?.TotalAmount ??
        response.data?.totalAmount ??
        totalAmount;

      if (
        createdSaleId === undefined ||
        createdSaleId === null ||
        createdSaleId === ""
      ) {
        alert(
          "Sale response eke Sale ID eka hambune naha. Browser Console eka check karanna."
        );
        return;
      }

      alert(
        `Sale created successfully!\n\nSale ID: ${createdSaleId}\nTotal: ${formatCurrency(
          createdTotal
        )}`
      );

      setCart([]);
      setSelectedId("");
      setQuantity(1);

      await loadData();

      if (onSaleCreated) {
        onSaleCreated(createdSaleId);
      }
    } catch (error) {
      console.error("Failed to create sale:", error);
      console.error("HTTP STATUS:", error.response?.status);
      console.error(
        "SERVER ERROR DETAILS:",
        JSON.stringify(error.response?.data, null, 2)
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.title ||
          error.response?.data?.error ||
          "Failed to create sale. Please check the browser Console."
      );
    } finally {
      setCreatingSale(false);
    }
  };

  // UI
  return (
    <div className="medicine-page">
      <div className="medicine-header">
        <div>
          <h1>New Sale</h1>
          <p>Create a new pharmacy bill</p>
        </div>

        <button
          className="add-medicine-btn"
          onClick={onBack}
          type="button"
        >
          ← Back to Sales
        </button>
      </div>

      <div className="stock-section-card">
        <div className="stock-section-header">
          <div className="stock-section-title">
            <div className="stock-section-icon medicine-section-icon">
              🛒
            </div>

            <div>
              <h3>Add Item</h3>
              <p>Select medicine or other pharmacy item</p>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "25px",
            display: "grid",
            gridTemplateColumns: "180px 1fr 140px 140px",
            gap: "15px",
            alignItems: "end",
          }}
        >
          <div>
            <label>Item Type</label>

            <select
              value={selectedType}
              onChange={(event) => {
                setSelectedType(event.target.value);
                setSelectedId("");
              }}
              style={selectStyle}
            >
              <option value="medicine">Medicine</option>
              <option value="otherItem">Other Item</option>
            </select>
          </div>

          <div>
            <label>Item</label>

            <select
              value={selectedId}
              onChange={(event) =>
                setSelectedId(event.target.value)
              }
              disabled={loading}
              style={selectStyle}
            >
              <option value="">
                {loading ? "Loading items..." : "Select Item"}
              </option>

              {selectedType === "medicine"
                ? medicines.map((medicine) => {
                    const batch = getAvailableBatch(
                      medicine.medicineId
                    );

                    return (
                      <option
                        key={medicine.medicineId}
                        value={medicine.medicineId}
                        disabled={!batch}
                      >
                        {medicine.name}
                        {medicine.strength
                          ? ` - ${medicine.strength}`
                          : ""}
                        {batch
                          ? ` - ${formatCurrency(batch.sellingPrice)}`
                          : " - No Available Stock"}
                      </option>
                    );
                  })
                : otherItems.map((item) => (
                    <option
                      key={item.otherItemId}
                      value={item.otherItemId}
                      disabled={
                        item.status !== true ||
                        Number(item.quantity || 0) <= 0
                      }
                    >
                      {item.itemName}
                      {Number(item.quantity || 0) > 0
                        ? ` - ${formatCurrency(item.sellingPrice)}`
                        : " - Out of Stock"}
                    </option>
                  ))}
            </select>
          </div>

          <div>
            <label>Quantity</label>

            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              style={inputStyle}
            />
          </div>

          <button
            className="add-medicine-btn"
            onClick={addToBill}
            disabled={loading}
            type="button"
          >
            + Add to Bill
          </button>
        </div>
      </div>

      <div
        className="stock-section-card"
        style={{ marginTop: "25px" }}
      >
        <div className="stock-section-header">
          <div className="stock-section-title">
            <div className="stock-section-icon medicine-section-icon">
              🧾
            </div>

            <div>
              <h3>Current Bill</h3>
              <p>Items added to this sale</p>
            </div>
          </div>
        </div>

        <div className="stock-table-wrapper">
          <table className="medicine-table stock-table">
            <thead>
              <tr>
                <th>ITEM</th>
                <th>TYPE</th>
                <th>UNIT PRICE</th>
                <th>QTY</th>
                <th>SUBTOTAL</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                    }}
                  >
                    No items added to the bill.
                  </td>
                </tr>
              ) : (
                cart.map((item, index) => (
                  <tr key={`${item.type}-${item.id}-${index}`}>
                    <td>
                      <strong>{item.name}</strong>

                      {item.strength && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#777",
                            marginTop: "3px",
                          }}
                        >
                          {item.strength}
                        </div>
                      )}

                      {item.batchName && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#777",
                            marginTop: "3px",
                          }}
                        >
                          Batch: {item.batchName}
                        </div>
                      )}
                    </td>

                    <td>
                      {item.type === "medicine"
                        ? "Medicine"
                        : "Other Item"}
                    </td>

                    <td>{formatCurrency(item.price)}</td>
                    <td>{item.quantity}</td>

                    <td>
                      <strong>
                        {formatCurrency(
                          item.price * item.quantity
                        )}
                      </strong>
                    </td>

                    <td>
                      <button
                        onClick={() => removeFromBill(index)}
                        type="button"
                        style={{
                          border: "none",
                          background: "#ffe5e5",
                          color: "#d32f2f",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            padding: "25px",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "30px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label>Payment Method</label>

            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              style={{
                marginLeft: "10px",
                padding: "10px 15px",
                borderRadius: "7px",
                border: "1px solid #ddd",
              }}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div>
            <span
              style={{
                fontSize: "16px",
                marginRight: "10px",
              }}
            >
              Total:
            </span>

            <strong style={{ fontSize: "24px" }}>
              {formatCurrency(totalAmount)}
            </strong>
          </div>

          <button
            className="add-medicine-btn"
            onClick={createSale}
            disabled={creatingSale || cart.length === 0}
            type="button"
          >
            {creatingSale ? "Creating..." : "✓ Create Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  marginTop: "7px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  marginTop: "7px",
  boxSizing: "border-box",
};

export default NewSale;
