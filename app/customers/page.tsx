"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, orderBy } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

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
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

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
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-4`}>Loading customer data...</p>
        </div>
      </div>
    );
  }

  const selectedCustomerData = selectedCustomer ? customers.find(c => c.name === selectedCustomer) : null;

  return (
    <div className={`min-h-screen py-8 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Customers</h1>
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

        {error && (
          <div className={`${theme === "dark" ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-50 border border-red-200 text-red-700"} px-4 py-3 rounded mb-4`}>
            {error}
          </div>
        )}

        {/* Summary Card */}
  <div className="bg-linear-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
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
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-12 text-center`}>
            <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"} mb-4`}>No customers found</p>
            <Link
              href="/sales/add-sale"
              className="text-green-500 hover:text-green-400 font-medium"
            >
              Add a sale with customer name to get started
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer List */}
            <div className="lg:col-span-1">
              <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md overflow-hidden`}>
                <div className={`px-6 py-4 ${theme === "dark" ? "bg-indigo-900 border-indigo-800" : "bg-indigo-50 border-indigo-100"} border-b`}>
                  <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Customer List</h2>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {customers.map((customer) => (
                    <div
                      key={customer.name}
                      onClick={() => setSelectedCustomer(customer.name)}
                      className={`p-4 border-b cursor-pointer transition-colors ${
                        selectedCustomer === customer.name
                          ? theme === "dark" ? "bg-indigo-900 border-l-4 border-l-indigo-600 border-gray-700" : "bg-indigo-50 border-l-4 border-l-indigo-600 border-gray-200"
                          : theme === "dark" ? "hover:bg-gray-700 border-gray-700" : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{customer.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${theme === "dark" ? "bg-indigo-900 text-indigo-200" : "bg-indigo-100 text-indigo-800"}`}>
                          {customer.totalSales} sales
                        </span>
                      </div>
                      <div className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                        <p>Total: ₹{customer.totalAmount.toFixed(2)}</p>
                        {customer.totalPending > 0 && (
                          <p className="text-orange-500 font-medium">
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
                <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md`}>
                  <div className={`px-6 py-4 ${theme === "dark" ? "bg-indigo-900 border-indigo-800" : "bg-indigo-50 border-indigo-100"} border-b`}>
                    <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      {selectedCustomerData.name}
                    </h2>
                  </div>

                  {/* Customer Stats */}
                  <div className={`p-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"} rounded-lg p-4`}>
                        <p className={`text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Total Sales</p>
                        <p className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                          {selectedCustomerData.totalSales}
                        </p>
                      </div>
                      <div className={`${theme === "dark" ? "bg-green-900" : "bg-green-50"} rounded-lg p-4`}>
                        <p className={`text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Total Amount</p>
                        <p className="text-2xl font-bold text-green-500">
                          ₹{selectedCustomerData.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className={`${theme === "dark" ? "bg-blue-900" : "bg-blue-50"} rounded-lg p-4`}>
                        <p className={`text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Paid</p>
                        <p className="text-2xl font-bold text-blue-500">
                          ₹{selectedCustomerData.totalPaid.toFixed(2)}
                        </p>
                      </div>
                      <div className={`${theme === "dark" ? "bg-orange-900" : "bg-orange-50"} rounded-lg p-4`}>
                        <p className={`text-sm mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Pending</p>
                        <p className="text-2xl font-bold text-orange-500">
                          ₹{selectedCustomerData.totalPending.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sales History */}
                  <div className="p-6">
                    <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                      Sales History
                    </h3>
                    <div className="space-y-4">
                      {selectedCustomerData.sales.map((sale) => (
                        <div key={sale.id} className={`border rounded-lg p-4 transition-shadow ${theme === "dark" ? "border-gray-700 hover:shadow-none bg-gray-800" : "border-gray-200 hover:shadow-md"}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                sale.productType === "waterbottle"
                                  ? theme === "dark" ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"
                                  : theme === "dark" ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                              }`}>
                                {sale.productType === "waterbottle" ? "Water Bottle" : "Cold Drink"}
                                {sale.bottleSize && ` - ${sale.bottleSize.toUpperCase()}`}
                              </span>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              sale.paymentStatus === "paid"
                                ? theme === "dark" ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800"
                                : sale.paymentStatus === "lending"
                                ? theme === "dark" ? "bg-purple-900 text-purple-200" : "bg-purple-100 text-purple-800"
                                : theme === "dark" ? "bg-orange-900 text-orange-200" : "bg-orange-100 text-orange-800"
                            }`}>
                              {sale.paymentStatus.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Quantity</p>
                              <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{sale.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Total</p>
                              <p className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                                ₹{sale.totalAmount.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Paid</p>
                              <p className="font-semibold text-green-500">
                                ₹{sale.amountPaid.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Pending</p>
                              <p className="font-semibold text-orange-500">
                                ₹{sale.amountPending.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                            <p className={`text-xs ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                              {formatDate(sale.createdAt)} • {sale.paymentMode.toUpperCase()}
                            </p>
                            {sale.notes && (
                              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{sale.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-12 text-center`}>
                  <svg
                    className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}
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
                  <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Select a customer to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
