"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

interface Expense {
  id: string;
  type: "labour" | "miscellaneous" | "inventory";
  category?: string;
  amount: number;
  reason?: string;
  description?: string;
  productType?: string;
  bottleSize?: string;
  quantity?: number;
  notes?: string;
  createdAt: any;
}

export default function ViewExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

  const fetchAllExpenses = async () => {
    try {
      const db = getFirestoreDb();
      const allExpenses: Expense[] = [];

      // Fetch labour expenses
      const labourQueryRef = query(collection(db, "labourExpenses"), orderBy("createdAt", "desc"));
      const labourSnapshot = await getDocs(labourQueryRef);
      labourSnapshot.forEach((doc) => {
        const data = doc.data();
        allExpenses.push({
          id: doc.id,
          type: "labour",
          amount: data.amount,
          reason: data.reason,
          description: data.description,
          createdAt: data.createdAt,
        });
      });

      // Fetch miscellaneous expenses
      const miscQueryRef = query(collection(db, "miscExpenses"), orderBy("createdAt", "desc"));
      const miscSnapshot = await getDocs(miscQueryRef);
      miscSnapshot.forEach((doc) => {
        const data = doc.data();
        allExpenses.push({
          id: doc.id,
          type: "miscellaneous",
          amount: data.amount,
          reason: data.reason,
          description: data.description,
          createdAt: data.createdAt,
        });
      });

      // Fetch inventory purchases
      const inventoryQuery = query(collection(db, "inventory"), orderBy("createdAt", "desc"));
      const inventorySnapshot = await getDocs(inventoryQuery);
      inventorySnapshot.forEach((doc) => {
        const data = doc.data();
        allExpenses.push({
          id: doc.id,
          type: "inventory",
          amount: data.amountPaid,
          productType: data.productType,
          bottleSize: data.bottleSize,
          quantity: data.quantity,
          notes: data.notes,
          createdAt: data.createdAt,
        });
      });

      // Sort all expenses by date
      allExpenses.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setExpenses(allExpenses);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError("Failed to load expenses data");
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

  const getFilteredExpenses = () => {
    if (filterType === "all") return expenses;
    return expenses.filter(exp => exp.type === filterType);
  };

  const filteredExpenses = getFilteredExpenses();

  const getTotalStats = () => {
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const labourCost = expenses.filter(e => e.type === "labour").reduce((sum, exp) => sum + exp.amount, 0);
    const miscCost = expenses.filter(e => e.type === "miscellaneous").reduce((sum, exp) => sum + exp.amount, 0);
    const inventoryCost = expenses.filter(e => e.type === "inventory").reduce((sum, exp) => sum + exp.amount, 0);
    
    return { totalExpenses, labourCost, miscCost, inventoryCost };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-4`}>Loading expenses data...</p>
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
              href="/expenses"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>All Expenses</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            <Link
              href="/expenses/add-expense"
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Add New Expense
            </Link>
          </div>
        </div>

        {error && (
          <div className={`${theme === "dark" ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-50 border border-red-200 text-red-700"} px-4 py-3 rounded mb-4`}>
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-red-500">
              ₹{stats.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Labour Cost
            </h3>
            <p className="text-3xl font-bold text-orange-500">
              ₹{stats.labourCost.toFixed(2)}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Miscellaneous Cost
            </h3>
            <p className="text-3xl font-bold text-yellow-500">
              ₹{stats.miscCost.toFixed(2)}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Inventory Purchase Cost
            </h3>
            <p className="text-3xl font-bold text-blue-500">
              ₹{stats.inventoryCost.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6 mb-6`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Filter Expenses</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`w-full md:w-64 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
            }`}
          >
            <option value="all">All Expenses</option>
            <option value="labour">Labour Cost</option>
            <option value="miscellaneous">Miscellaneous Cost</option>
            <option value="inventory">Inventory Purchases</option>
          </select>
        </div>

        {/* Expenses List */}
        <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Expense Transactions</h2>
          </div>
          
          {filteredExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>No expenses found</p>
              <Link
                href="/expenses/add-expense"
                className="text-red-500 hover:text-red-400 font-medium mt-2 inline-block"
              >
                Add your first expense
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Type
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Details
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Amount
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className={`${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className={`${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          expense.type === "labour"
                            ? theme === "dark" ? "bg-orange-900 text-orange-200" : "bg-orange-100 text-orange-800"
                            : expense.type === "miscellaneous"
                            ? theme === "dark" ? "bg-yellow-900 text-yellow-200" : "bg-yellow-100 text-yellow-800"
                            : theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                        }`}>
                          {expense.type === "labour" ? "Labour" : expense.type === "miscellaneous" ? "Miscellaneous" : "Inventory Purchase"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.type === "inventory" ? (
                          <div>
                            <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {expense.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                              {expense.bottleSize && ` - ${expense.bottleSize.toUpperCase()}`}
                            </p>
                            <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                              Quantity: {expense.quantity}
                            </p>
                            {expense.notes && (
                              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{expense.notes}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                              {expense.reason}
                            </p>
                            {expense.description && (
                              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>{expense.description}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-red-500">
                          ₹{expense.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        {formatDate(expense.createdAt)}
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
            href="/expenses"
            className={`${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} font-medium`}
          >
            ← Back to Expenses Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
