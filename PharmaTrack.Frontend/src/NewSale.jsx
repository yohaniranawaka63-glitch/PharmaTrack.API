import { useEffect, useState } from "react";
import axios from "axios";

const API = "https://pharmatrack-api-b0035.containers.snapdeploy.app/api";

// Current logged-in Admin user.
// Later we can replace this with the actual logged-in user's ID.
const CURRENT_USER_ID = 9;

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

  // ==========================================
  // LOAD MEDICINES, OTHER ITEMS & BATCHES
  // ==========================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        medicineResponse,
        otherItemResponse,
        batchResponse,
      ] = await Promise.all([
        api.get(`${API}/Medicine`),
        api.get(`${API}/OtherItem`),
        api.get(`${API}/MedicineBatch`),
      ]);

      setMedicines(medicineResponse.data);
      setOtherItems(otherItemResponse.data);
      setBatches(batchResponse.data);
    } catch (error) {
      console.error("Failed to load sale data:", error);

      alert(
        error.response?.data?.message ||
          "Failed to load medicines and items."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GET AVAILABLE BATCH FOR MEDICINE
  // ==========================================

  const getAvailableBatch = (medicineId) => {
    const medicineBatches = batches
      .filter(
        (batch) =>
          batch.medicineId === Number(medicineId) &&
          Number(batch.quantity) > 0
      )
      .sort(
        (a, b) =>
          new Date(a.expiryDate) -
          new Date(b.expiryDate)
      );

    return medicineBatches.length > 0
      ? medicineBatches[0]
      : null;
  };

  // ==========================================
  // SELECTED ITEM
  // ==========================================

  const selectedMedicine = medicines.find(
    (medicine) =>
      medicine.medicineId === Number(selectedId)
  );

  const selectedOtherItem = otherItems.find(
    (item) =>
      item.otherItemId === Number(selectedId)
  );

  // ==========================================
  // GET PRICE
  // ==========================================

  const getMedicinePrice = (medicineId) => {
    const batch = getAvailableBatch(medicineId);

    return batch
      ? Number(batch.sellingPrice || 0)
      : 0;
  };

  const getOtherItemPrice = (itemId) => {
    const item = otherItems.find(
      (otherItem) =>
        otherItem.otherItemId === Number(itemId)
    );

    return item
      ? Number(item.sellingPrice || 0)
      : 0;
  };

  // ==========================================
  // ADD TO BILL
  // ==========================================

  const addToBill = () => {
    if (!selectedId) {
      alert("Please select an item.");
      return;
    }

    if (Number(quantity) <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    // ========================================
    // MEDICINE
    // ========================================

    if (selectedType === "medicine") {
      const medicine = selectedMedicine;

      if (!medicine) {
        alert("Medicine not found.");
        return;
      }

      const batch = getAvailableBatch(
        medicine.medicineId
      );

      if (!batch) {
        alert(
          `No available stock found for ${medicine.name}.`
        );
        return;
      }

      if (Number(quantity) > Number(batch.quantity)) {
        alert(
          `Insufficient stock for ${medicine.name}.\nAvailable stock: ${batch.quantity}`
        );
        return;
      }

      const price = Number(
        batch.sellingPrice || 0
      );

      if (price <= 0) {
        alert(
          `Selling price is not available for ${medicine.name}.`
        );
        return;
      }

      setCart([
        ...cart,
        {
          type: "medicine",
          id: medicine.medicineId,
          batchId: batch.batchId,
          name: medicine.name,
          strength: medicine.strength || "",
          batchName: batch.batchName,
          price: price,
          quantity: Number(quantity),
        },
      ]);
    }

    // ========================================
    // OTHER ITEM
    // ========================================

    else {
      const item = selectedOtherItem;

      if (!item) {
        alert("Other item not found.");
        return;
      }

      if (
        Number(quantity) >
        Number(item.quantity || 0)
      ) {
        alert(
          `Insufficient stock for ${item.itemName}.\nAvailable stock: ${item.quantity}`
        );
        return;
      }

      const price = Number(
        item.sellingPrice || 0
      );

      if (price <= 0) {
        alert(
          `Selling price is not available for ${item.itemName}.`
        );
        return;
      }

      setCart([
        ...cart,
        {
          type: "otherItem",
          id: item.otherItemId,
          name: item.itemName,
          price: price,
          quantity: Number(quantity),
        },
      ]);
    }

    setSelectedId("");
    setQuantity(1);
  };

  // ==========================================
  // REMOVE FROM BILL
  // ==========================================

  const removeFromBill = (index) => {
    setCart(
      cart.filter(
        (_, cartIndex) =>
          cartIndex !== index
      )
    );
  };

  // ==========================================
  // TOTAL
  // ==========================================

  const totalAmount = cart.reduce(
    (total, item) =>
      total +
      Number(item.price) *
        Number(item.quantity),
    0
  );

  // ==========================================
  // CREATE SALE
  // ==========================================

  const createSale = async () => {
    if (cart.length === 0) {
      alert(
        "Please add at least one item to the bill."
      );
      return;
    }

    if (!paymentMethod) {
      alert("Please select a payment method.");
      return;
    }

    try {
      setCreatingSale(true);

      const saleItems = cart.map((item) => {
        if (item.type === "medicine") {
          return {
            batchId: item.batchId,
            otherItemId: null,
            quantity: Number(item.quantity),
          };
        }

        return {
          batchId: null,
          otherItemId: item.id,
          quantity: Number(item.quantity),
        };
      });

      // IMPORTANT:
      // User ID 7 is the Admin user currently in DB.
      const saleData = {
        userId: CURRENT_USER_ID,
        paymentMethod: paymentMethod,
        items: saleItems,
      };

      console.log("Creating sale:", saleData);

      const response = await axios.post(
        `${API}/Sale`,
        saleData
      );

      const createdSaleId =
        response.data.saleId;

      const createdTotal =
        response.data.totalAmount;

      alert(
        `Sale created successfully!\n\nSale ID: ${createdSaleId}\nTotal: Rs. ${Number(
          createdTotal
        ).toFixed(2)}`
      );

      // Clear bill
      setCart([]);
      setSelectedId("");
      setQuantity(1);

      // Refresh stock data
      await loadData();

      // Open bill preview
      if (onSaleCreated) {
        onSaleCreated(createdSaleId);
      }
    } catch (error) {
      console.error(
        "Failed to create sale:",
        error
      );

      console.error(
        "Server response:",
        error.response?.data
      );

      alert(
        error.response?.data?.message ||
          "Failed to create sale."
      );
    } finally {
      setCreatingSale(false);
    }
  };

  // ==========================================
  // CURRENCY
  // ==========================================

  const formatCurrency = (amount) => {
    return `Rs. ${Number(
      amount || 0
    ).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="medicine-page">

      {/* HEADER */}
      <div className="medicine-header">

        <div>
          <h1>New Sale</h1>

          <p>
            Create a new pharmacy bill
          </p>
        </div>

        <button
          className="add-medicine-btn"
          onClick={onBack}
        >
          ← Back to Sales
        </button>

      </div>


      {/* ADD ITEM SECTION */}
      <div className="stock-section-card">

        <div className="stock-section-header">

          <div className="stock-section-title">

            <div className="stock-section-icon medicine-section-icon">
              🛒
            </div>

            <div>
              <h3>Add Item</h3>

              <p>
                Select medicine or other pharmacy item
              </p>
            </div>

          </div>

        </div>


        <div
          style={{
            padding: "25px",
            display: "grid",
            gridTemplateColumns:
              "180px 1fr 140px 140px",
            gap: "15px",
            alignItems: "end",
          }}
        >

          {/* ITEM TYPE */}
          <div>

            <label>
              Item Type
            </label>

            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(
                  e.target.value
                );

                setSelectedId("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginTop: "7px",
              }}
            >

              <option value="medicine">
                Medicine
              </option>

              <option value="otherItem">
                Other Item
              </option>

            </select>

          </div>


          {/* ITEM */}
          <div>

            <label>
              Item
            </label>

            <select
              value={selectedId}
              onChange={(e) =>
                setSelectedId(
                  e.target.value
                )
              }
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginTop: "7px",
              }}
            >

              <option value="">
                {loading
                  ? "Loading items..."
                  : "Select Item"}
              </option>


              {selectedType === "medicine"

                ? medicines.map(
                    (medicine) => {
                      const batch =
                        getAvailableBatch(
                          medicine.medicineId
                        );

                      return (
                        <option
                          key={
                            medicine.medicineId
                          }
                          value={
                            medicine.medicineId
                          }
                          disabled={!batch}
                        >
                          {medicine.name}

                          {medicine.strength
                            ? ` - ${medicine.strength}`
                            : ""}

                          {batch
                            ? ` - ${formatCurrency(
                                batch.sellingPrice
                              )}`
                            : " - Out of Stock"}
                        </option>
                      );
                    }
                  )

                : otherItems.map(
                    (item) => (
                      <option
                        key={
                          item.otherItemId
                        }
                        value={
                          item.otherItemId
                        }
                        disabled={
                          Number(
                            item.quantity || 0
                          ) <= 0
                        }
                      >
                        {item.itemName}

                        {Number(
                          item.quantity || 0
                        ) > 0
                          ? ` - ${formatCurrency(
                              item.sellingPrice
                            )}`
                          : " - Out of Stock"}
                      </option>
                    )
                  )}

            </select>

          </div>


          {/* QUANTITY */}
          <div>

            <label>
              Quantity
            </label>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Number(e.target.value)
                )
              }
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                marginTop: "7px",
              }}
            />

          </div>


          {/* ADD BUTTON */}
          <button
            className="add-medicine-btn"
            onClick={addToBill}
            disabled={loading}
          >
            + Add to Bill
          </button>

        </div>

      </div>


      {/* CURRENT BILL */}
      <div
        className="stock-section-card"
        style={{
          marginTop: "25px",
        }}
      >

        <div className="stock-section-header">

          <div className="stock-section-title">

            <div className="stock-section-icon medicine-section-icon">
              🧾
            </div>

            <div>
              <h3>Current Bill</h3>

              <p>
                Items added to this sale
              </p>
            </div>

          </div>

        </div>


        {/* TABLE */}
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

                cart.map(
                  (item, index) => (

                    <tr key={index}>

                      <td>
                        <strong>
                          {item.name}
                        </strong>

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
                      </td>


                      <td>
                        {item.type ===
                        "medicine"
                          ? "Medicine"
                          : "Other Item"}
                      </td>


                      <td>
                        {formatCurrency(
                          item.price
                        )}
                      </td>


                      <td>
                        {item.quantity}
                      </td>


                      <td>
                        <strong>
                          {formatCurrency(
                            item.price *
                              item.quantity
                          )}
                        </strong>
                      </td>


                      <td>

                        <button
                          onClick={() =>
                            removeFromBill(
                              index
                            )
                          }
                          style={{
                            border: "none",
                            background:
                              "#ffe5e5",
                            color:
                              "#d32f2f",
                            padding:
                              "8px 12px",
                            borderRadius:
                              "6px",
                            cursor:
                              "pointer",
                            fontWeight:
                              "600",
                          }}
                        >
                          Remove
                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>


        {/* TOTAL + PAYMENT */}
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

          {/* PAYMENT */}
          <div>

            <label>
              Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
              style={{
                marginLeft: "10px",
                padding: "10px 15px",
                borderRadius: "7px",
                border: "1px solid #ddd",
              }}
            >

              <option value="Cash">
                Cash
              </option>

              <option value="Card">
                Card
              </option>

            </select>

          </div>


          {/* TOTAL */}
          <div>

            <span
              style={{
                fontSize: "16px",
                marginRight: "10px",
              }}
            >
              Total:
            </span>

            <strong
              style={{
                fontSize: "24px",
              }}
            >
              {formatCurrency(totalAmount)}
            </strong>

          </div>


          {/* CREATE SALE */}
          <button
            className="add-medicine-btn"
            onClick={createSale}
            disabled={
              creatingSale ||
              cart.length === 0
            }
          >
            {creatingSale
              ? "Creating..."
              : "✓ Create Sale"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default NewSale;