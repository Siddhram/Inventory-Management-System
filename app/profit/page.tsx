"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, Timestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import Link from "next/link";

interface Sale {
  id: string;
  productType: string;
  bottleSize?: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  createdAt: any;
}

interface InventoryPurchase {
  id: string;
  productType: string;
  bottleSize?: string;
  quantity: number;
  amountPaid: number;
  createdAt: any;
}

interface MonthlyProfit {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
}

export default function ProfitPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const db = getFirestoreDb();

      // Fetch all sales
      const salesQuery = query(collection(db, "sales"));
      const salesSnapshot = await getDocs(salesQuery);
      const salesData: Sale[] = [];
      salesSnapshot.forEach((doc) => {
        salesData.push({
          id: doc.id,
          ...doc.data(),
        } as Sale);
      });
      setSales(salesData);

      // Fetch all inventory purchases
      const inventoryQuery = query(collection(db, "inventory"));
      const inventorySnapshot = await getDocs(inventoryQuery);
      const purchasesData: InventoryPurchase[] = [];
      inventorySnapshot.forEach((doc) => {
        purchasesData.push({
          id: doc.id,
          ...doc.data(),
        } as InventoryPurchase);
      });
      setPurchases(purchasesData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load profit data");
    } finally {
      setLoading(false);
    }
  };

  const getDateFromTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date(0);
    return timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isSameMonth = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth()
    );
  };

  const getDailyProfit = () => {
    const targetDate = new Date(selectedDate);
    
    // Calculate revenue from sales on this date
    const dailySales = sales.filter(sale => {
      const saleDate = getDateFromTimestamp(sale.createdAt);
      return isSameDay(saleDate, targetDate);
    });
    
    const revenue = dailySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const unitsSold = dailySales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Calculate cost from purchases on this date
    const dailyPurchases = purchases.filter(purchase => {
      const purchaseDate = getDateFromTimestamp(purchase.createdAt);
      return isSameDay(purchaseDate, targetDate);
    });
    
    const cost = dailyPurchases.reduce((sum, purchase) => sum + purchase.amountPaid, 0);
    
    const profit = revenue - cost;
    
    return { revenue, cost, profit, unitsSold, salesCount: dailySales.length };
  };

  const getMonthlyProfits = (): MonthlyProfit[] => {
    const monthlyData: { [key: string]: MonthlyProfit } = {};
    
    // Process sales
    sales.forEach(sale => {
      const saleDate = getDateFromTimestamp(sale.createdAt);
      const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          cost: 0,
          profit: 0,
          salesCount: 0,
        };
      }
      
      monthlyData[monthKey].revenue += sale.totalAmount;
      monthlyData[monthKey].salesCount += 1;
    });
    
    // Process purchases
    purchases.forEach(purchase => {
      const purchaseDate = getDateFromTimestamp(purchase.createdAt);
      const monthKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          cost: 0,
          profit: 0,
          salesCount: 0,
        };
      }
      
      monthlyData[monthKey].cost += purchase.amountPaid;
    });
    
    // Calculate profit
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].profit = monthlyData[key].revenue - monthlyData[key].cost;
    });
    
    // Convert to array and sort by month descending
    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
  };

  const formatMonth = (monthString: string): string => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  const getTotalProfit = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalCost = purchases.reduce((sum, purchase) => sum + purchase.amountPaid, 0);
    return totalRevenue - totalCost;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profit data...</p>
        </div>
      </div>
    );
  }

  const dailyStats = viewMode === "daily" ? getDailyProfit() : null;
  const monthlyProfits = viewMode === "monthly" ? getMonthlyProfits() : [];
  const totalProfit = getTotalProfit();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profit Analysis</h1>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Overall Profit Card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-2">Total Profit (All Time)</h2>
          <p className="text-6xl font-bold">
            ₹{totalProfit.toFixed(2)}
          </p>
          <p className="mt-4 text-purple-100">
            Revenue - Cost = Profit
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "daily"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "monthly"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Monthly View
              </button>
            </div>

            {viewMode === "daily" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                />
              </div>
            )}
          </div>
        </div>

        {/* Daily View */}
        {viewMode === "daily" && dailyStats && (
          <div>
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Profit for {new Date(selectedDate).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              
              <div className="text-center mb-8">
                <p className={`text-7xl font-bold ${
                  dailyStats.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{dailyStats.profit.toFixed(2)}
                </p>
                <p className="text-gray-500 mt-2">
                  {dailyStats.profit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    ₹{dailyStats.revenue.toFixed(2)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Cost</h3>
                  <p className="text-3xl font-bold text-red-600">
                    ₹{dailyStats.cost.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Units Sold</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {dailyStats.unitsSold}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Sales Count</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {dailyStats.salesCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly View */}
        {viewMode === "monthly" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Monthly Profit Breakdown</h2>
            </div>
            
            {monthlyProfits.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No profit data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Profit/Loss
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyProfits.map((monthData) => (
                      <tr key={monthData.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">
                            {formatMonth(monthData.month)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            ₹{monthData.revenue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-red-600">
                            ₹{monthData.cost.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-2xl font-bold ${
                            monthData.profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ₹{monthData.profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-gray-900">
                            {monthData.salesCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
