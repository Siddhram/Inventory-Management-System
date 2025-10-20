"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";

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

  useEffect(() => {
    fetchAllExpenses();
  }, []);

  const fetchAllExpenses = async () => {
    try {
      const db = getFirestoreDb();
      const allExpenses: Expense[] = [];

      // Fetch labour and miscellaneous expenses
      const expensesQuery = query(collection(db, "expenses"), orderBy("createdAt", "desc"));
      const expensesSnapshot = await getDocs(expensesQuery);
      expensesSnapshot.forEach((doc) => {
        const data = doc.data();
        allExpenses.push({
          id: doc.id,
          type: data.category,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expenses data...</p>
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
              href="/expenses"
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
            <h1 className="text-3xl font-bold text-gray-900">All Expenses</h1>
          </div>
          <Link
            href="/expenses/add-expense"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Add New Expense
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-red-600">
              ₹{stats.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Labour Cost
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              ₹{stats.labourCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Miscellaneous Cost
            </h3>
            <p className="text-3xl font-bold text-yellow-600">
              ₹{stats.miscCost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Inventory Purchase Cost
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              ₹{stats.inventoryCost.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Expenses</h2>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          >
            <option value="all">All Expenses</option>
            <option value="labour">Labour Cost</option>
            <option value="miscellaneous">Miscellaneous Cost</option>
            <option value="inventory">Inventory Purchases</option>
          </select>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Expense Transactions</h2>
          </div>
          
          {filteredExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No expenses found</p>
              <Link
                href="/expenses/add-expense"
                className="text-red-600 hover:text-red-700 font-medium mt-2 inline-block"
              >
                Add your first expense
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          expense.type === "labour"
                            ? "bg-orange-100 text-orange-800"
                            : expense.type === "miscellaneous"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {expense.type === "labour" ? "Labour" : expense.type === "miscellaneous" ? "Miscellaneous" : "Inventory Purchase"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.type === "inventory" ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {expense.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                              {expense.bottleSize && ` - ${expense.bottleSize.toUpperCase()}`}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {expense.quantity}
                            </p>
                            {expense.notes && (
                              <p className="text-sm text-gray-500 mt-1">{expense.notes}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {expense.reason}
                            </p>
                            {expense.description && (
                              <p className="text-sm text-gray-500 mt-1">{expense.description}</p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-red-600">
                          ₹{expense.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Expenses Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
