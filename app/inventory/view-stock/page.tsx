"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

interface StockItem {
  id: string;
  productType: "waterbottle" | "waterbottle_oxyjal" | "waterbottle_aarogyam" | "coldrink";
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
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const stockData: StockItem[] = [];
      querySnapshot.forEach((doc) => {
        stockData.push({ id: doc.id, ...(doc.data() as any) } as StockItem);
      });
      setStocks(stockData);
    } catch (err) {
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

  const isWaterBottle = (type: string) =>
    type === "waterbottle" || type === "waterbottle_oxyjal" || type === "waterbottle_aarogyam";

  const productLabel = (type: string) => {
    if (type === "waterbottle_oxyjal") return "Water Bottle (Oxyjal)";
    if (type === "waterbottle_aarogyam") return "Water Bottle (Aarogyam)";
    if (type === "waterbottle") return "Water Bottle";
    if (type === "coldrink") return "Cold Drink";
    return type;
  };

  const getTotalQuantity = (productType: string, size?: string) => {
    return stocks
      .filter((stock: StockItem) => {
        if (productType === "waterbottle") {
          // Treat both water bottle variants as waterbottle for summaries
          if (size) {
            return isWaterBottle(stock.productType) && stock.bottleSize === size;
          }
          return isWaterBottle(stock.productType);
        }
        if (size) {
          return stock.productType === productType && stock.bottleSize === size;
        }
        return stock.productType === productType;
      })
      .reduce((sum: number, stock: StockItem) => sum + stock.quantity, 0);
  };

  const getTotalAmount = () => {
    return stocks.reduce((sum: number, stock: StockItem) => sum + stock.amountPaid, 0);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Loading stock data...</p>
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>View Stock</h1>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Total Water Bottles</h3>
            <p className="text-3xl font-bold text-blue-500">{getTotalQuantity("waterbottle")}</p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Total Cold Drinks</h3>
            <p className="text-3xl font-bold text-green-500">{getTotalQuantity("coldrink")}</p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Total Investment</h3>
            <p className="text-3xl font-bold text-purple-400">₹{getTotalAmount().toFixed(2)}</p>
          </div>
        </div>

        {/* Water Bottle Breakdown */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6 mb-6`}>
          <h2 className={`text-xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Water Bottle Stock by Size</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {["200ml", "250ml", "500ml", "1l", "2l"].map((size) => (
              <div key={size} className={`rounded-lg p-4 text-center border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <p className={`text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{size.toUpperCase()}</p>
                <p className="text-2xl font-bold text-blue-500">{getTotalQuantity("waterbottle", size)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stock List */}
        <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Recent Stock Entries</h2>
          </div>

          {stocks.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>No stock entries found</p>
              <Link href="/inventory/add-stock" className="text-blue-400 hover:text-blue-300 font-medium mt-2 inline-block">
                Add your first stock entry
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Product</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Size</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Quantity</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Amount Paid</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Notes</th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Date Added</th>
                  </tr>
                </thead>
                <tbody className={`${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                  {stocks.map((stock: StockItem) => (
                    <tr key={stock.id} className={`${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          isWaterBottle(stock.productType)
                            ? theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                            : theme === "dark" ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                        }`}>
                          {productLabel(stock.productType)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{stock.bottleSize ? stock.bottleSize.toUpperCase() : "N/A"}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{stock.quantity}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>₹{stock.amountPaid.toFixed(2)}</td>
                      <td className={`px-6 py-4 text-sm max-w-xs truncate ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{stock.notes || "—"}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{formatDate(stock.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link href="/inventory" className={`font-medium ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}>
            ← Back to Inventory Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
