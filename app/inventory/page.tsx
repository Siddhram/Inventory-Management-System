"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function InventoryPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {}
  }, []);

  return (
    <div className={`min-h-screen py-8 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Inventory Management
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            <Link
              href="/"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add Stock Card */}
          <Link
            href="/inventory/add-stock"
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            } rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Add Stock
            </h2>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Add new inventory items to your stock
            </p>
          </Link>

          {/* View Stock Card */}
          <Link
            href="/inventory/view-stock"
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            } rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              View Stock
            </h2>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              View current inventory levels
            </p>
          </Link>

          {/* Stock History Card */}
          <Link
            href="/inventory/stock-history"
            className={`${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            } rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Stock History
            </h2>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              View past inventory transactions
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
