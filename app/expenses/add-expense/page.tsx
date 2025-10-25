"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import ThemeToggle from "@/app/components/ThemeToggle";

type ExpenseCategory = "labour" | "miscellaneous";

interface ExpenseData {
  category: ExpenseCategory;
  amount: number;
  reason: string;
  description?: string;
  createdAt: any;
}

export default function AddExpensePage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });
  const [category, setCategory] = useState<ExpenseCategory>("labour");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      if (!reason.trim()) {
        throw new Error("Please provide a reason for the expense");
      }

      const db = getFirestoreDb();
      
      const expenseData: ExpenseData = {
        category,
        amount,
        reason: reason.trim(),
        description: description.trim() || undefined,
        createdAt: serverTimestamp(),
      };

      // Write to separate collections per request
      const targetCollection = category === "labour" ? "labourExpenses" : "miscExpenses";
      await addDoc(collection(db, targetCollection), expenseData);
      
      setSuccess("Expense added successfully!");
      
      // Reset form
      setAmount(0);
      setReason("");
      setDescription("");
      setCategory("labour");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/expenses/view-expenses");
      }, 2000);
    } catch (err: any) {
      console.error("Error adding expense:", err);
      setError(err.message || "Failed to add expense. Please try again.");
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
              Add Labour & Miscellaneous Cost
            </h1>
            <div className="flex items-center gap-3">
              <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
              <button
                onClick={() => router.push("/expenses")}
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
            {/* Category */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              >
                <option value="labour">Labour Cost</option>
                <option value="miscellaneous">Miscellaneous Cost</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Amount (₹) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                required
              />
            </div>

            {/* Reason */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Reason / Purpose *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                placeholder="e.g., Daily wage, Transportation, Utilities"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Additional Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                }`}
                placeholder="Add any additional details about this expense..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/expenses")}
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
