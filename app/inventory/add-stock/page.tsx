"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

type ProductType = "waterbottle" | "coldrink";
type BottleSize = "200ml" | "250ml" | "500ml" | "1l" | "2l";

interface StockData {
  productType: ProductType;
  quantity: number;
  bottleSize?: BottleSize;
  notes: string;
  amountPaid: number;
  createdAt: any;
}

export default function AddStockPage() {
  const router = useRouter();
  const [productType, setProductType] = useState<ProductType>("waterbottle");
  const [quantity, setQuantity] = useState<number>(0);
  const [bottleSize, setBottleSize] = useState<BottleSize>("500ml");
  const [notes, setNotes] = useState("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const bottleSizes: BottleSize[] = ["200ml", "250ml", "500ml", "1l", "2l"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const db = getFirestoreDb();
      
      const stockData: StockData = {
        productType,
        quantity,
        notes,
        amountPaid,
        createdAt: serverTimestamp(),
      };

      // Add bottle size only for water bottles
      if (productType === "waterbottle") {
        stockData.bottleSize = bottleSize;
      }

      await addDoc(collection(db, "inventory"), stockData);
      
      setSuccess("Stock added successfully!");
      
      // Reset form
      setQuantity(0);
      setNotes("");
      setAmountPaid(0);
      setBottleSize("500ml");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/inventory/view-stock");
      }, 2000);
    } catch (err: any) {
      console.error("Error adding stock:", err);
      setError(err.message || "Failed to add stock. Please try again.");
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
              Add New Stock
            </h1>
            <button
              onClick={() => router.push("/inventory")}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
              />
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
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                required
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
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Add any additional notes about this stock batch..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Adding..." : "Add Stock"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/inventory")}
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
