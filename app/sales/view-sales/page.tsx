"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";

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

  useEffect(() => {
    fetchSales();
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sales data...</p>
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
              href="/sales"
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
            <h1 className="text-3xl font-bold text-gray-900">View Sales</h1>
          </div>
          <Link
            href="/sales/add-sale"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Add New Sale
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
              Total Sales
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              ₹{stats.totalSales.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Amount Paid
            </h3>
            <p className="text-3xl font-bold text-green-600">
              ₹{stats.totalPaid.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Amount Pending
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              ₹{stats.totalPending.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Units Sold
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalQuantity}
            </p>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Sales Transactions</h2>
          </div>
          
          {sales.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No sales found</p>
              <Link
                href="/sales/add-sale"
                className="text-green-600 hover:text-green-700 font-medium mt-2 inline-block"
              >
                Add your first sale
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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price/Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pending
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            sale.productType === "waterbottle"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            {sale.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                          </span>
                          {sale.bottleSize && (
                            <div className="text-xs text-gray-500 mt-1">
                              {sale.bottleSize.toUpperCase()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.customerName || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sale.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{sale.pricePerUnit.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ₹{sale.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        ₹{sale.amountPaid.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        ₹{sale.amountPending.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          sale.paymentMode === "cash"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {sale.paymentMode.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          sale.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : sale.paymentStatus === "lending"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {sale.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-black"
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
                                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
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
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Sales Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
