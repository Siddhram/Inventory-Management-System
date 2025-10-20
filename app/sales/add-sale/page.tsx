"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

type ProductType = "waterbottle" | "coldrink";
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
  const [productType, setProductType] = useState<ProductType>("waterbottle");
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

  useEffect(() => {
    fetchAvailableStock();
  }, [productType, bottleSize]);

  useEffect(() => {
    setTotalAmount(quantity * pricePerUnit);
  }, [quantity, pricePerUnit]);

  const fetchAvailableStock = async () => {
    try {
      const db = getFirestoreDb();
      let q;
      
      if (productType === "waterbottle") {
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
    
    if (productType === "waterbottle") {
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

      if (productType === "waterbottle") {
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Sale
            </h1>
            <button
              onClick={() => router.push("/sales")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type *
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as ProductType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              >
                <option value="waterbottle">Water Bottle</option>
                <option value="coldrink">Cold Drink</option>
              </select>
            </div>

            {/* Bottle Size - Only for Water Bottles */}
            {productType === "waterbottle" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bottle Size *
                </label>
                <select
                  value={bottleSize}
                  onChange={(e) => setBottleSize(e.target.value as BottleSize)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Available Stock: <span className="text-lg font-bold">{availableStock}</span> units
              </p>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                max={availableStock}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Price Per Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Per Unit (₹) *
              </label>
              <input
                type="number"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(Number(e.target.value))}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
            </div>

            {/* Total Amount Display */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid (₹) *
              </label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                min="0"
                max={totalAmount}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
              {totalAmount > 0 && amountPaid < totalAmount && (
                <p className="mt-2 text-sm text-orange-600">
                  Pending: ₹{(totalAmount - amountPaid).toFixed(2)}
                </p>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Mode *
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>

            {/* Payment Status - Only show if amount is pending */}
            {totalAmount > 0 && amountPaid < totalAmount && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="lending">Lending</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Select "Lending" if the customer will pay later
                </p>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter customer name (optional)"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
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
