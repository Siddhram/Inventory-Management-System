"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import ThemeToggle from "@/app/components/ThemeToggle";

type ProductType = "waterbottle_oxyjal" | "waterbottle_aarogyam" | "coldrink";
type BottleSize = "200ml" | "250ml" | "500ml" | "1l" | "2l";
type PaymentMode = "cash" | "online";
type PaymentStatus = "paid" | "pending" | "lending";

interface SaleData {
  productType: ProductType;
  bottleSize?: BottleSize;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  customerName?: string;
  notes: string;
  createdAt: any;
}

interface InventoryItem {
  id: string;
  productType: ProductType;
  quantity: number;
  bottleSize?: string;
}

export default function AddSalePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });
  const [productType, setProductType] = useState<ProductType>("waterbottle_oxyjal");
  const [bottleSize, setBottleSize] = useState<BottleSize>("500ml");
  const [quantity, setQuantity] = useState<number>(0);
  const [pricePerUnit, setPricePerUnit] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableStock, setAvailableStock] = useState<number>(0);

  const bottleSizes: BottleSize[] = ["200ml", "250ml", "500ml", "1l", "2l"];
  const isWaterBottle = (p: string) => p === "waterbottle_oxyjal" || p === "waterbottle_aarogyam" || p === "waterbottle"; // include legacy

  useEffect(() => {
    fetchAvailableStock();
  }, [productType, bottleSize]);

  useEffect(() => {
    setTotalAmount(quantity * pricePerUnit);
  }, [quantity, pricePerUnit]);

  // persist theme choice when toggled here
  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

  const fetchAvailableStock = async () => {
    try {
      const db = getFirestoreDb();
      let q;
      
      if (isWaterBottle(productType)) {
        q = query(
          collection(db, "inventory"),
          where("productType", "==", productType),
          where("bottleSize", "==", bottleSize)
        );
      } else {
        q = query(
          collection(db, "inventory"),
          where("productType", "==", productType)
        );
      }

      const querySnapshot = await getDocs(q);
      let total = 0;
      querySnapshot.forEach((doc) => {
        total += doc.data().quantity;
      });
      
      setAvailableStock(total);
    } catch (err) {
      console.error("Error fetching stock:", err);
    }
  };

  const updateInventory = async (saleQuantity: number) => {
    const db = getFirestoreDb();
    let q;
    
    if (isWaterBottle(productType)) {
      q = query(
        collection(db, "inventory"),
        where("productType", "==", productType),
        where("bottleSize", "==", bottleSize)
      );
    } else {
      q = query(
        collection(db, "inventory"),
        where("productType", "==", productType)
      );
    }

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    let remainingQty = saleQuantity;

    querySnapshot.forEach((docSnapshot) => {
      if (remainingQty <= 0) return;
      
      const data = docSnapshot.data();
      const currentQty = data.quantity;
      
      if (currentQty >= remainingQty) {
        batch.update(doc(db, "inventory", docSnapshot.id), {
          quantity: currentQty - remainingQty
        });
        remainingQty = 0;
      } else {
        batch.update(doc(db, "inventory", docSnapshot.id), {
          quantity: 0
        });
        remainingQty -= currentQty;
      }
    });

    await batch.commit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (quantity > availableStock) {
        throw new Error(`Insufficient stock. Available: ${availableStock} units`);
      }

      if (amountPaid > totalAmount) {
        throw new Error("Amount paid cannot be greater than total amount");
      }

      const db = getFirestoreDb();
      
      const amountPending = totalAmount - amountPaid;
      const finalPaymentStatus: PaymentStatus = amountPending > 0 ? paymentStatus : "paid";

      const saleData: SaleData = {
        productType,
        quantity,
        pricePerUnit,
        totalAmount,
        amountPaid,
        amountPending,
        paymentMode,
        paymentStatus: finalPaymentStatus,
        customerName: customerName || undefined,
        notes,
        createdAt: serverTimestamp(),
      };

      if (isWaterBottle(productType)) {
        saleData.bottleSize = bottleSize;
      }

      // Add sale record
      await addDoc(collection(db, "sales"), saleData);
      
      // Update inventory
      await updateInventory(quantity);
      
      setSuccess("Sale added successfully!");
      
      // Reset form
      setQuantity(0);
      setPricePerUnit(0);
      setAmountPaid(0);
      setCustomerName("");
      setNotes("");
      setBottleSize("500ml");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/sales/view-sales");
      }, 2000);
    } catch (err: any) {
      console.error("Error adding sale:", err);
      setError(err.message || "Failed to add sale. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-8 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-2xl mx-auto px-4">
        <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-8`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Add New Sale
            </h1>
            <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
              <button
                onClick={() => router.push("/sales")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                  theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </div>
          </div>

          {error && (
            <div className={`${theme === "dark" ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-50 border border-red-200 text-red-700"} px-4 py-3 rounded mb-4`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`${theme === "dark" ? "bg-green-900 border border-green-700 text-green-200" : "bg-green-50 border border-green-200 text-green-700"} px-4 py-3 rounded mb-4`}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Type */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Product Type *
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              >
                <option value="waterbottle_oxyjal">Water Bottle (Oxyjal)</option>
                <option value="waterbottle_aarogyam">Water Bottle (Aarogyam)</option>
                <option value="coldrink">Cold Drink</option>
              </select>
            </div>

            {/* Bottle Size - Only for Water Bottles */}
            {isWaterBottle(productType) && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Bottle Size *
                </label>
                <select
                  value={bottleSize}
                  onChange={(e) => setBottleSize(e.target.value as BottleSize)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                  }`}
                  required
                >
                  {bottleSizes.map((size) => (
                    <option key={size} value={size}>
                      {size.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Available Stock Display */}
            <div className={`${theme === "dark" ? "bg-blue-900 border-blue-700" : "bg-blue-50 border-blue-200"} border p-4 rounded-lg`}>
              <p className={`text-sm font-medium ${theme === "dark" ? "text-blue-200" : "text-blue-900"}`}>
                Available Stock: <span className="text-lg font-bold">{availableStock}</span> units
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                max={availableStock}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              />
            </div>

            {/* Price Per Unit */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Price Per Unit (₹) *
              </label>
              <input
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              />
            </div>

            {/* Total Amount Display */}
            <div className={`${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"} border p-4 rounded-lg`}>
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} text-sm`}>Total Amount</p>
              <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>₹{totalAmount.toFixed(2)}</p>
            </div>

            {/* Amount Paid */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min="0"
                max={totalAmount}
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              />
              {totalAmount > 0 && amountPaid < totalAmount && (
                <p className="mt-2 text-sm text-orange-500">
                  Pending: ₹{(totalAmount - amountPaid).toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>

            {/* Payment Status - Only show if amount is pending */}
            {totalAmount > 0 && amountPaid < totalAmount && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Payment Status *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                  }`}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="lending">Lending</option>
                </select>
                <p className={`mt-2 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                  Select "Lending" if the customer will pay later
                </p>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                placeholder="Enter customer name (optional)"
              />
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                placeholder="Add any additional notes..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || availableStock === 0}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Processing..." : "Add Sale"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/sales")}
                className={`flex-1 py-3 px-6 rounded-lg transition-colors font-medium ${
                  theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
