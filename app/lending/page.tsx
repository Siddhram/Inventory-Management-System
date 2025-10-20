"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, doc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";

interface LendingSale {
  id: string;
  productType: string;
  bottleSize?: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  amountPaid: number;
  amountPending: number;
  paymentMode: string;
  paymentStatus: string;
  customerName?: string;
  notes: string;
  createdAt: any;
}

export default function LendingPage() {
  const [lendingSales, setLendingSales] = useState<LendingSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchLendingSales();
  }, []);

  const fetchLendingSales = async () => {
    try {
      const db = getFirestoreDb();
      const q = query(
        collection(db, "sales"),
        where("paymentStatus", "==", "lending")
      );
      const querySnapshot = await getDocs(q);
      
      const salesData: LendingSale[] = [];
      querySnapshot.forEach((doc) => {
        salesData.push({
          id: doc.id,
          ...doc.data(),
        } as LendingSale);
      });
      
      // Sort by creation date descending
      salesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setLendingSales(salesData);
    } catch (err: any) {
      console.error("Error fetching lending sales:", err);
      setError("Failed to load lending data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (saleId: string, currentPending: number, currentPaid: number) => {
    if (paymentAmount <= 0 || paymentAmount > currentPending) {
      alert("Please enter a valid payment amount");
      return;
    }

    setProcessingPayment(true);
    try {
      const db = getFirestoreDb();
      
      const newAmountPaid = currentPaid + paymentAmount;
      const newAmountPending = currentPending - paymentAmount;
      const newPaymentStatus = newAmountPending <= 0 ? "paid" : "lending";

      await updateDoc(doc(db, "sales", saleId), {
        amountPaid: newAmountPaid,
        amountPending: newAmountPending,
        paymentStatus: newPaymentStatus,
      });

      // Update local state
      if (newPaymentStatus === "paid") {
        // Remove from lending list if fully paid
        setLendingSales(lendingSales.filter(s => s.id !== saleId));
      } else {
        // Update the sale in the list
        setLendingSales(lendingSales.map(s => 
          s.id === saleId 
            ? { 
                ...s, 
                amountPaid: newAmountPaid, 
                amountPending: newAmountPending,
                paymentStatus: newPaymentStatus 
              }
            : s
        ));
      }

      setEditingId(null);
      setPaymentAmount(0);
      alert("Payment updated successfully!");
    } catch (err: any) {
      console.error("Error updating payment:", err);
      alert("Failed to update payment");
    } finally {
      setProcessingPayment(false);
    }
  };

  const markAsPending = async (saleId: string) => {
    try {
      const db = getFirestoreDb();
      await updateDoc(doc(db, "sales", saleId), {
        paymentStatus: "pending",
      });

      // Remove from lending list
      setLendingSales(lendingSales.filter(s => s.id !== saleId));
      alert("Status changed to Pending successfully!");
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
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
    const totalAmount = lendingSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPending = lendingSales.reduce((sum, sale) => sum + sale.amountPending, 0);
    const totalPaid = lendingSales.reduce((sum, sale) => sum + sale.amountPaid, 0);
    return { totalAmount, totalPending, totalPaid };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lending data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lending Management</h1>
          <Link
            href="/"
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
            Back to Dashboard
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
              Total Lending Sales
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {lendingSales.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Total Amount
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              ₹{stats.totalAmount.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Amount to Collect
            </h3>
            <p className="text-3xl font-bold text-orange-600">
              ₹{stats.totalPending.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Lending Sales List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Lending Transactions</h2>
            <p className="text-sm text-gray-500 mt-1">
              Sales marked as "Lending" - customers who will pay later
            </p>
          </div>
          
          {lendingSales.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500 mb-4">No lending transactions found</p>
              <Link
                href="/sales/add-sale"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Add a sale with lending status
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {lendingSales.map((sale) => (
                <div key={sale.id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          sale.productType === "waterbottle"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          {sale.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                          {sale.bottleSize && ` - ${sale.bottleSize.toUpperCase()}`}
                        </span>
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          LENDING
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-semibold text-gray-900">
                            {sale.customerName || "Anonymous"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-semibold text-gray-900">{sale.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="font-semibold text-gray-900">
                            ₹{sale.totalAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-sm text-gray-900">{formatDate(sale.createdAt)}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-6">
                        <div>
                          <span className="text-sm text-gray-500">Paid: </span>
                          <span className="font-semibold text-green-600">
                            ₹{sale.amountPaid.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Pending: </span>
                          <span className="font-semibold text-orange-600">
                            ₹{sale.amountPending.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Payment: </span>
                          <span className="font-semibold text-gray-900">
                            {sale.paymentMode.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {sale.notes && (
                        <p className="text-sm text-gray-600 mt-2">Note: {sale.notes}</p>
                      )}
                    </div>

                    <div className="lg:min-w-[280px]">
                      {editingId === sale.id ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Amount (₹)
                          </label>
                          <input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            min="0"
                            max={sale.amountPending}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-black mb-3"
                            placeholder="Enter amount"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePayment(sale.id, sale.amountPending, sale.amountPaid)}
                              disabled={processingPayment}
                              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium"
                            >
                              {processingPayment ? "Processing..." : "Save Payment"}
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setPaymentAmount(0);
                              }}
                              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              setEditingId(sale.id);
                              setPaymentAmount(0);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                          >
                            💰 Record Payment
                          </button>
                          <button
                            onClick={() => markAsPending(sale.id)}
                            className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-200 font-medium text-sm"
                          >
                            Mark as Pending
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
