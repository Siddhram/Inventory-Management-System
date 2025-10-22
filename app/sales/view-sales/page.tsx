"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

type PaymentMode = "cash" | "online";
type PaymentStatus = "paid" | "pending" | "lending";

interface Sale {
  id: string;
  productType: "waterbottle" | "coldrink";
  bottleSize?: string;
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

export default function ViewSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSale, setEditingSale] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

  const fetchSales = async () => {
    try {
      const db = getFirestoreDb();
      const q = query(collection(db, "sales"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const salesData: Sale[] = [];
      querySnapshot.forEach((doc) => {
        salesData.push({
          id: doc.id,
          ...doc.data(),
        } as Sale);
      });
      
      setSales(salesData);
    } catch (err: any) {
      console.error("Error fetching sales:", err);
      setError("Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (saleId: string, currentPending: number) => {
    if (paymentAmount <= 0 || paymentAmount > currentPending) {
      alert("Please enter a valid payment amount");
      return;
    }

    setProcessingPayment(true);
    try {
      const db = getFirestoreDb();
      const sale = sales.find(s => s.id === saleId);
      if (!sale) return;

      const newAmountPaid = sale.amountPaid + paymentAmount;
      const newAmountPending = sale.amountPending - paymentAmount;
      const newPaymentStatus: PaymentStatus = newAmountPending <= 0 ? "paid" : "pending";

      await updateDoc(doc(db, "sales", saleId), {
        amountPaid: newAmountPaid,
        amountPending: newAmountPending,
        paymentStatus: newPaymentStatus,
      });

      // Update local state
      setSales(sales.map(s => 
        s.id === saleId 
          ? { 
              ...s, 
              amountPaid: newAmountPaid, 
              amountPending: newAmountPending,
              paymentStatus: newPaymentStatus 
            }
          : s
      ));

      setEditingSale(null);
      setPaymentAmount(0);
      alert("Payment updated successfully!");
    } catch (err: any) {
      console.error("Error updating payment:", err);
      alert("Failed to update payment");
    } finally {
      setProcessingPayment(false);
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

  const getTotalStats = () => {
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPaid = sales.reduce((sum, sale) => sum + sale.amountPaid, 0);
    const totalPending = sales.reduce((sum, sale) => sum + sale.amountPending, 0);
    const totalQuantity = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    return { totalSales, totalPaid, totalPending, totalQuantity };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-4`}>Loading sales data...</p>
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
              href="/sales"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>View Sales</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            <Link
              href="/sales/add-sale"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Add New Sale
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
              Total Sales
            </h3>
            <p className="text-3xl font-bold text-blue-500">
              ₹{stats.totalSales.toFixed(2)}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Amount Paid
            </h3>
            <p className="text-3xl font-bold text-green-500">
              ₹{stats.totalPaid.toFixed(2)}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Amount Pending
            </h3>
            <p className="text-3xl font-bold text-orange-500">
              ₹{stats.totalPending.toFixed(2)}
            </p>
          </div>
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6`}>
            <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
              Total Units Sold
            </h3>
            <p className="text-3xl font-bold text-purple-500">
              {stats.totalQuantity}
            </p>
          </div>
        </div>

        {/* Sales List */}
        <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
            <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Sales Transactions</h2>
          </div>
          
          {sales.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>No sales found</p>
              <Link
                href="/sales/add-sale"
                className="text-green-500 hover:text-green-400 font-medium mt-2 inline-block"
              >
                Add your first sale
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Product
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Customer
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Quantity
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Price/Unit
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Total
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Paid
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Pending
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Payment
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                  {sales.map((sale) => (
                    <tr key={sale.id} className={`${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            sale.productType === "waterbottle"
                              ? theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                              : theme === "dark" ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                          }`}>
                            {sale.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                          </span>
                          {sale.bottleSize && (
                            <div className={`text-xs mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                              {sale.bottleSize.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {sale.customerName || "—"}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {sale.quantity}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        ₹{sale.pricePerUnit.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        ₹{sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-500">
                        ₹{sale.amountPaid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-500">
                        ₹{sale.amountPending.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          sale.paymentMode === "cash"
                            ? theme === "dark" ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"
                            : theme === "dark" ? "bg-purple-900 text-purple-200" : "bg-purple-100 text-purple-800"
                        }`}>
                          {sale.paymentMode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          sale.paymentStatus === "paid"
                            ? theme === "dark" ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                            : sale.paymentStatus === "lending"
                            ? theme === "dark" ? "bg-purple-900 text-purple-200" : "bg-purple-100 text-purple-800"
                            : theme === "dark" ? "bg-orange-900 text-orange-200" : "bg-orange-100 text-orange-800"
                        }`}>
                          {sale.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        {formatDate(sale.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(sale.paymentStatus === "pending" || sale.paymentStatus === "lending") && (
                          <div>
                            {editingSale === sale.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                  min="0"
                                  max={sale.amountPending}
                                  step="0.01"
                                  className={`w-24 px-2 py-1 border rounded ${theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"}`}
                                  placeholder="Amount"
                                />
                                <button
                                  onClick={() => handlePayment(sale.id, sale.amountPending)}
                                  disabled={processingPayment}
                                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-400"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSale(null);
                                    setPaymentAmount(0);
                                  }}
                                  className={`${theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} px-3 py-1 rounded`}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSale(sale.id);
                                  setPaymentAmount(0);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                              >
                                Edit Payment
                              </button>
                            )}
                          </div>
                        )}
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
            href="/sales"
            className={`${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} font-medium`}
          >
            ← Back to Sales Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
