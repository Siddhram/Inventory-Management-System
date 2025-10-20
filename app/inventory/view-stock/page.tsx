"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";

interface StockItem {
  id: string;
  productType: "waterbottle" | "coldrink";
  quantity: number;
  bottleSize?: string;
  notes: string;
  amountPaid: number;
  createdAt: any;
}

export default function ViewStockPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const stockData: StockItem[] = [];
      querySnapshot.forEach((doc) => {
        stockData.push({
          id: doc.id,
          ...doc.data(),
        } as StockItem);
      });
      
      setStocks(stockData);
    } catch (err: any) {
      console.error("Error fetching stocks:", err);
      setError("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalQuantity = (productType: string, size?: string) => {
    return stocks
      .filter((stock) => {
        if (productType === "waterbottle" && size) {
          return stock.productType === productType && stock.bottleSize === size;
        }
        return stock.productType === productType;
      })
      .reduce((sum, stock) => sum + stock.quantity, 0);
  };

  const getTotalAmount = () => {
    return stocks.reduce((sum, stock) => sum + stock.amountPaid, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
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
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">View Stock</h1>
          </div>
          <Link
            href="/inventory/add-stock"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add New Stock
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Water Bottles
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {getTotalQuantity("waterbottle")}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Cold Drinks
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {getTotalQuantity("coldrink")}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Investment
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              ₹{getTotalAmount().toFixed(2)}
            </p>
          </div>
        </div>

        {/* Water Bottle Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Water Bottle Stock by Size
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {["200ml", "250ml", "500ml", "1l", "2l"].map((size) => (
              <div key={size} className="border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">{size.toUpperCase()}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getTotalQuantity("waterbottle", size)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stock List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Stock Entries</h2>
          </div>
          
          {stocks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No stock entries found</p>
              <Link
                href="/inventory/add-stock"
                className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
              >
                Add your first stock entry
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Added
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stocks.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          stock.productType === "waterbottle"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {stock.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.bottleSize ? stock.bottleSize.toUpperCase() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{stock.amountPaid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {stock.notes || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(stock.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/inventory"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Inventory Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
