"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

interface StockItem {
  id: string;
  productType: "waterbottle" | "coldrink";
  quantity: number;
  bottleSize?: string;
  notes: string;
  amountPaid: number;
  createdAt: any;
}

export default function StockHistoryPage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<"all" | "waterbottle" | "coldrink">("all");
  const [filterSize, setFilterSize] = useState<string>("all");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
    fetchStocks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stocks, filterType, filterSize]);

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
      setFilteredStocks(stockData);
    } catch (err: any) {
      console.error("Error fetching stocks:", err);
      setError("Failed to load stock history");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stocks];

    // Filter by product type
    if (filterType !== "all") {
      filtered = filtered.filter((stock) => stock.productType === filterType);
    }

    // Filter by bottle size
    if (filterSize !== "all") {
      filtered = filtered.filter((stock) => stock.bottleSize === filterSize);
    }

    setFilteredStocks(filtered);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalStats = () => {
    const totalQuantity = filteredStocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalAmount = filteredStocks.reduce((sum, stock) => sum + stock.amountPaid, 0);
    return { totalQuantity, totalAmount };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Loading stock history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen py-8 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
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
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Stock History</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            <Link
              href="/inventory/add-stock"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add New Stock
            </Link>
          </div>
        </div>

        {error && (
          <div className={`${theme === "dark" ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-50 border border-red-200 text-red-700"} px-4 py-3 rounded mb-4`}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 mb-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Product Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300"
                }`}
              >
                <option value="all">All Products</option>
                <option value="waterbottle">Water Bottle</option>
                <option value="coldrink">Cold Drink</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Bottle Size
              </label>
              <select
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300"
                }`}
                disabled={filterType !== "waterbottle"}
              >
                <option value="all">All Sizes</option>
                <option value="200ml">200ML</option>
                <option value="250ml">250ML</option>
                <option value="500ml">500ML</option>
                <option value="1l">1L</option>
                <option value="2l">2L</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Total Entries
            </h3>
            <p className="text-3xl font-bold text-blue-500">
              {filteredStocks.length}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Total Quantity
            </h3>
            <p className="text-3xl font-bold text-green-500">
              {stats.totalQuantity}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Total Amount
            </h3>
            <p className="text-3xl font-bold text-purple-400">
              ₹{stats.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        {/* History List */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Transaction History</h2>
          </div>
          
          {filteredStocks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>No stock entries found with current filters</p>
            </div>
          ) : (
            <div className={`divide-y ${theme === "dark" ? "divide-gray-700" : "divide-gray-200"}`}>
              {filteredStocks.map((stock) => (
                <div key={stock.id} className={`px-6 py-4 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          stock.productType === "waterbottle"
                            ? theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                            : theme === "dark" ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                        }`}>
                          {stock.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                        </span>
                        {stock.bottleSize && (
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                            {stock.bottleSize.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"} text-xs`}>Quantity</p>
                          <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{stock.quantity} units</p>
                        </div>
                        <div>
                          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"} text-xs`}>Amount Paid</p>
                          <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>₹{stock.amountPaid.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"} text-xs`}>Date Added</p>
                          <p className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{formatDate(stock.createdAt)}</p>
                        </div>
                      </div>
                      {stock.notes && (
                        <div className="mt-3">
                          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"} text-xs`}>Notes</p>
                          <p className={`text-sm ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>{stock.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            href="/inventory"
            className={`font-medium ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
          >
            ← Back to Inventory Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
