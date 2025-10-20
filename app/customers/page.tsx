"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";

interface Sale {
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

interface CustomerData {
  name: string;
  totalSales: number;
  totalAmount: number;
  totalPaid: number;
  totalPending: number;
  sales: Sale[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const db = getFirestoreDb();
      const salesQuery = query(collection(db, "sales"));
      const salesSnapshot = await getDocs(salesQuery);
      
      const salesData: Sale[] = [];
      salesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.customerName) { // Only include sales with customer names
          salesData.push({
            id: doc.id,
            ...data,
          } as Sale);
        }
      });

      // Group sales by customer
      const customerMap: { [key: string]: CustomerData } = {};
      
      salesData.forEach((sale) => {
        const customerName = sale.customerName!;
        if (!customerMap[customerName]) {
          customerMap[customerName] = {
            name: customerName,
            totalSales: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalPending: 0,
            sales: [],
          };
        }
        
        customerMap[customerName].totalSales += 1;
        customerMap[customerName].totalAmount += sale.totalAmount;
        customerMap[customerName].totalPaid += sale.amountPaid;
        customerMap[customerName].totalPending += sale.amountPending;
        customerMap[customerName].sales.push(sale);
      });

      // Convert to array and sort by total amount descending
      const customersArray = Object.values(customerMap).sort((a, b) => b.totalAmount - a.totalAmount);
      setCustomers(customersArray);
    } catch (err: any) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customer data");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  const selectedCustomerData = selectedCustomer ? customers.find(c => c.name === selectedCustomer) : null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
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

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium opacity-80 mb-2">Total Customers</h3>
              <p className="text-4xl font-bold">{customers.length}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium opacity-80 mb-2">Total Revenue</h3>
              <p className="text-4xl font-bold">
                ₹{customers.reduce((sum, c) => sum + c.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium opacity-80 mb-2">Total Pending</h3>
              <p className="text-4xl font-bold">
                ₹{customers.reduce((sum, c) => sum + c.totalPending, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {customers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">No customers found</p>
            <Link
              href="/sales/add-sale"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Add a sale with customer name to get started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                  <h2 className="text-xl font-bold text-gray-900">Customer List</h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.name}
                      onClick={() => setSelectedCustomer(customer.name)}
                      className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                        selectedCustomer === customer.name
                          ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                          {customer.totalSales} sales
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Total: ₹{customer.totalAmount.toFixed(2)}</p>
                        {customer.totalPending > 0 && (
                          <p className="text-orange-600 font-medium">
                            Pending: ₹{customer.totalPending.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="lg:col-span-2">
              {selectedCustomerData ? (
                <div className="bg-white rounded-lg shadow-md">
                  <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedCustomerData.name}
                    </h2>
                  </div>

                  {/* Customer Stats */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Sales</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedCustomerData.totalSales}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                        <p className="text-2xl font-bold text-green-600">
                          ₹{selectedCustomerData.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Paid</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{selectedCustomerData.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{selectedCustomerData.totalPending.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sales History */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Sales History
                    </h3>
                    <div className="space-y-4">
                      {selectedCustomerData.sales.map((sale) => (
                        <div
                          key={sale.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                sale.productType === "waterbottle"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {sale.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                                {sale.bottleSize && ` - ${sale.bottleSize.toUpperCase()}`}
                              </span>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              sale.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : sale.paymentStatus === "lending"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {sale.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Quantity</p>
                              <p className="font-semibold text-gray-900">{sale.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total</p>
                              <p className="font-semibold text-gray-900">
                                ₹{sale.totalAmount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Paid</p>
                              <p className="font-semibold text-green-600">
                                ₹{sale.amountPaid.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Pending</p>
                              <p className="font-semibold text-orange-600">
                                ₹{sale.amountPending.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              {formatDate(sale.createdAt)} • {sale.paymentMode.toUpperCase()}
                            </p>
                            {sale.notes && (
                              <p className="text-sm text-gray-600 mt-1">{sale.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12 text-center">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-gray-500">Select a customer to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
