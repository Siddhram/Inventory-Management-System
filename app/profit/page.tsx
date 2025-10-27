"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, where, Timestamp } from "firebase/firestore";
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
  createdAt: any;
}

interface InventoryPurchase {
  id: string;
  productType: string;
  bottleSize?: string;
  quantity: number;
  amountPaid: number;
  unitCost?: number;
  createdAt: any;
}

interface MonthlyProfit {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
}

interface SizeBreakdownRow {
  size: string;
  quantity: number;
  unitCost: number; // average purchase price per unit (up to sale date)
  revenue: number;  // sum of sale pricePerUnit * quantity
  cost: number;     // sum of COGS for the size (using per-sale COGS)
  profit: number;   // revenue - cost
}

export default function ProfitPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<InventoryPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboardTheme");
      if (saved === "dark" || saved === "light") return saved;
    }
    return "light";
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("dashboardTheme", theme);
    } catch {}
  }, [theme]);

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
    
    // Grab sales for selected date
    const dailySales = sales.filter(sale => {
      const saleDate = getDateFromTimestamp(sale.createdAt);
      return isSameDay(saleDate, targetDate);
    });
    
    // Revenue = sum of (pricePerUnit * quantity) for the day, respecting bottle sizes
    const revenue = dailySales.reduce((sum, sale) => sum + (Number(sale.pricePerUnit) || 0) * (Number(sale.quantity) || 0), 0);
    const unitsSold = dailySales.reduce((sum, sale) => sum + (Number(sale.quantity) || 0), 0);
    
    // Cost = sum of COGS for each sale, computed using weighted-average unit cost per size up to that sale
    const cost = dailySales.reduce((sum, sale) => sum + getCOGSForSale(sale), 0);
    
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
      
      monthlyData[monthKey].revenue += (Number(sale.pricePerUnit) || 0) * (Number(sale.quantity) || 0);
      monthlyData[monthKey].cost += getCOGSForSale(sale);
      monthlyData[monthKey].salesCount += 1;
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
    const totalRevenue = sales.reduce((sum, sale) => sum + (Number(sale.pricePerUnit) || 0) * (Number(sale.quantity) || 0), 0);
    const totalCost = sales.reduce((sum, sale) => sum + getCOGSForSale(sale), 0);
    return totalRevenue - totalCost;
  };

  // Compute cost of goods sold for a given sale using weighted-average cost of inventory
  // Input: sale with productType, bottleSize (optional), quantity, createdAt
  // Output: numeric cost = weighted average unit purchase cost up to sale date * sale quantity
  const getCOGSForSale = (sale: Sale): number => {
    const saleDate = getDateFromTimestamp(sale.createdAt);
    // Filter purchases for matching product & bottleSize, up to the sale date
    const matchingPurchases = purchases.filter(p => {
      if (p.productType !== sale.productType) return false;
      const pSize = (p.bottleSize || '').toString();
      const sSize = (sale.bottleSize || '').toString();
      if (pSize !== sSize) return false;
      const pDate = getDateFromTimestamp(p.createdAt);
      return pDate.getTime() <= saleDate.getTime();
    });

    const computeWeightedAvg = (list: InventoryPurchase[]) => {
      const totals = list.reduce(
        (acc, itm) => {
          const qty = Number(itm.quantity) || 0;
          const unit = itm.unitCost != null ? Number(itm.unitCost) : undefined;
          const amt = unit != null ? unit * qty : (Number(itm.amountPaid) || 0);
          return { qty: acc.qty + qty, amt: acc.amt + amt };
        },
        { qty: 0, amt: 0 }
      );
      return totals.qty > 0 ? totals.amt / totals.qty : 0;
    };

    let avgUnitCost = computeWeightedAvg(matchingPurchases);
    if (avgUnitCost === 0) {
      // fall back to all-time average for this SKU if no purchases found up to sale date
      const allPurchasesForSku = purchases.filter(p => {
        if (p.productType !== sale.productType) return false;
        const pSize = (p.bottleSize || '').toString();
        const sSize = (sale.bottleSize || '').toString();
        return pSize === sSize;
      });
      avgUnitCost = computeWeightedAvg(allPurchasesForSku);
    }

    return avgUnitCost * (Number(sale.quantity) || 0);
  };

  // Get average unit cost for a SKU (productType + bottleSize) up to a given date
  const getAverageUnitCostForSku = (productType: string, bottleSize: string, upToDate?: Date): number => {
    const list = purchases.filter(p => {
      if (p.productType !== productType) return false;
      const pSize = (p.bottleSize || '').toString();
      if (pSize !== bottleSize) return false;
      if (!upToDate) return true;
      const pDate = getDateFromTimestamp(p.createdAt);
      return pDate.getTime() <= upToDate.getTime();
    });
    const totals = list.reduce(
      (acc, itm) => {
        const qty = Number(itm.quantity) || 0;
        const unit = itm.unitCost != null ? Number(itm.unitCost) : undefined;
        const amt = unit != null ? unit * qty : (Number(itm.amountPaid) || 0);
        return { qty: acc.qty + qty, amt: acc.amt + amt };
      },
      { qty: 0, amt: 0 }
    );
    return totals.qty > 0 ? totals.amt / totals.qty : 0;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-600"} mt-4`}>Loading profit data...</p>
        </div>
      </div>
    );
  }

  const dailyStats = viewMode === "daily" ? getDailyProfit() : null;
  const monthlyProfits = viewMode === "monthly" ? getMonthlyProfits() : [];
  const totalProfit = getTotalProfit();
  const dailySizeBreakdown = viewMode === "daily" ? (() => {
    const targetDate = new Date(selectedDate);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    // collect waterbottle sales only for the selected date with a size
    const rowsMap: Record<string, SizeBreakdownRow> = {};
    sales.forEach((sale) => {
      const saleDate = getDateFromTimestamp(sale.createdAt);
      if (!isSameDay(saleDate, targetDate)) return;
      if (sale.productType !== 'waterbottle' || !sale.bottleSize) return;
      const size = sale.bottleSize;
      if (!rowsMap[size]) {
        rowsMap[size] = {
          size,
          quantity: 0,
          unitCost: getAverageUnitCostForSku('waterbottle', size, endOfDay),
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }
      const revenue = (Number(sale.pricePerUnit) || 0) * (Number(sale.quantity) || 0);
      const cogs = getCOGSForSale(sale);
      rowsMap[size].quantity += Number(sale.quantity) || 0;
      rowsMap[size].revenue += revenue;
      rowsMap[size].cost += cogs;
    });
    const order = ['200ml','250ml','500ml','1l','2l'];
    return Object.values(rowsMap)
      .map(r => ({ ...r, profit: r.revenue - r.cost }))
      .sort((a,b) => order.indexOf(a.size) - order.indexOf(b.size));
  })() : [];

  return (
    <div className={`min-h-screen py-8 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Profit Analysis</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle theme={theme} onToggle={() => setTheme(theme === "light" ? "dark" : "light")} />
            <Link
              href="/"
              className={`${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"} font-medium`}
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className={`${theme === "dark" ? "bg-red-900 border border-red-700 text-red-200" : "bg-red-50 border border-red-200 text-red-700"} px-4 py-3 rounded mb-4`}>
            {error}
          </div>
        )}

        {/* Overall Profit Card */}
  <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-2">Total Profit (All Time)</h2>
          <p className="text-6xl font-bold">
            ₹{totalProfit.toFixed(2)}
          </p>
          <p className="mt-4 text-purple-100">
            Revenue - Cost = Profit
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md p-6 mb-6`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("daily")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "daily"
                    ? "bg-blue-600 text-white"
                    : theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Daily View
              </button>
              <button
                onClick={() => setViewMode("monthly")}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === "monthly"
                    ? "bg-blue-600 text-white"
                    : theme === "dark" ? "bg-gray-700 text-white hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Monthly View
              </button>
            </div>

            {viewMode === "daily" && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    theme === "dark" ? "bg-gray-900 text-white border-gray-700" : "border-gray-300 text-black"
                  }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Daily View */}
        {viewMode === "daily" && dailyStats && (
          <div>
            <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-lg p-8 mb-6`}>
              <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                Profit for {new Date(selectedDate).toLocaleDateString('en-IN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              
              <div className="text-center mb-8">
                <p className={`text-7xl font-bold ${dailyStats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{dailyStats.profit.toFixed(2)}
                </p>
                <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"} mt-2`}>
                  {dailyStats.profit >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`${theme === "dark" ? "bg-green-900" : "bg-green-50"} rounded-lg p-6`}>
                  <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Revenue</h3>
                  <p className="text-3xl font-bold text-green-500">
                    ₹{dailyStats.revenue.toFixed(2)}
                  </p>
                </div>
                <div className={`${theme === "dark" ? "bg-red-900" : "bg-red-50"} rounded-lg p-6`}>
                  <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Cost</h3>
                  <p className="text-3xl font-bold text-red-500">
                    ₹{dailyStats.cost.toFixed(2)}
                  </p>
                </div>
                <div className={`${theme === "dark" ? "bg-blue-900" : "bg-blue-50"} rounded-lg p-6`}>
                  <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Units Sold</h3>
                  <p className="text-3xl font-bold text-blue-500">
                    {dailyStats.unitsSold}
                  </p>
                </div>
                <div className={`${theme === "dark" ? "bg-purple-900" : "bg-purple-50"} rounded-lg p-6`}>
                  <h3 className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Sales Count</h3>
                  <p className="text-3xl font-bold text-purple-500">
                    {dailyStats.salesCount}
                  </p>
                </div>
              </div>
              {dailySizeBreakdown.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                  <h3 className={`text-lg font-semibold mb-3 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                    Today's Bottle Size Breakdown
                  </h3>
                  <table className="w-full">
                    <thead className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Bottle Size</th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Quantity</th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Unit Cost (₹)</th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Revenue (₹)</th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Cost (₹)</th>
                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>Profit (₹)</th>
                      </tr>
                    </thead>
                    <tbody className={`${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                      {dailySizeBreakdown.map((r) => (
                        <tr key={r.size}>
                          <td className="px-6 py-3 text-sm font-medium">{r.size.toUpperCase()}</td>
                          <td className="px-6 py-3 text-sm text-right">{r.quantity}</td>
                          <td className="px-6 py-3 text-sm text-right">₹{r.unitCost.toFixed(2)}</td>
                          <td className="px-6 py-3 text-sm text-right text-green-500">₹{r.revenue.toFixed(2)}</td>
                          <td className="px-6 py-3 text-sm text-right text-red-500">₹{r.cost.toFixed(2)}</td>
                          <td className={`px-6 py-3 text-sm text-right ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{r.profit.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monthly View */}
        {viewMode === "monthly" && (
          <div className={`${theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"} rounded-lg shadow-md overflow-hidden`}>
            <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
              <h2 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>Monthly Profit Breakdown</h2>
            </div>
            
            {monthlyProfits.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>No profit data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Month
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Revenue
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Cost
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Profit/Loss
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                        Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`${theme === "dark" ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"} divide-y`}>
                    {monthlyProfits.map((monthData) => (
                      <tr key={monthData.month} className={`${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                            {formatMonth(monthData.month)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-500">
                            ₹{monthData.revenue.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-red-500">
                            ₹{monthData.cost.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-2xl font-bold ${monthData.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ₹{monthData.profit.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
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
