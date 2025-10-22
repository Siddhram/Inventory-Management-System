"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function SalesPage() {
  const [todayTotal, setTodayTotal] = useState<number | null>(null);
  const [todayLoading, setTodayLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    const fetchToday = async () => {
      try {
        const db = getFirestoreDb();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const tomorrow = new Date(start);
        tomorrow.setDate(start.getDate() + 1);
        const q = query(
          collection(db, "sales"),
          where("createdAt", ">=", Timestamp.fromDate(start)),
          where("createdAt", "<", Timestamp.fromDate(tomorrow))
        );
        const snap = await getDocs(q);
        let sum = 0;
        snap.forEach((doc) => {
          const data = doc.data() as any;
          const val = Number(data?.totalAmount || 0);
          if (!Number.isNaN(val)) sum += val;
        });
        setTodayTotal(sum);
      } catch {
        setTodayTotal(0);
      } finally {
        setTodayLoading(false);
      }
    };
    fetchToday();
  }, []);
  return (
    <div className={`min-h-screen py-8 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Sales Management
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            <Link
              href="/"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Today's total sales */}
        <div className="grid grid-cols-1 gap-6 mb-6">
          <div className={`${theme === "dark" ? "bg-gray-800" : "bg-white"} rounded-lg shadow-md p-6`}>
            <h2 className={`text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Today's Total Sales</h2>
            <p className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {todayLoading ? "—" : `₹${(todayTotal ?? 0).toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Sale Card */}
          <Link
            href="/sales/add-sale"
            className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Add Sale
            </h2>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              Record a new sale transaction
            </p>
          </Link>

          {/* View Sales Card */}
          <Link
            href="/sales/view-sales"
            className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow`}
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h2 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              View Sales
            </h2>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
              View all sales transactions
            </p>
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/"
            className={`font-medium ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
