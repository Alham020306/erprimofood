import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

// Unified hook yang menggabungkan summary (efficient) + real-time orders (critical)
export const useCFOUnifiedDashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  // Real-time orders untuk chart (dibatasi 500 untuk performance)
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Summary subscription (C-Level database - efficient)
  useEffect(() => {
    const unsubscribe = subscribeSummaryDoc(
      "cfo_financial_summary",
      "current",
      (data) => {
        setSummaryDoc(data);
        setSummaryLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);
  
  // Real-time orders (Main database - untuk chart & analysis)
  useEffect(() => {
    const q = query(
      collection(dbMain, "orders"),
      orderBy("timestamp", "desc"),
      limit(500)
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setOrdersLoading(false);
    }, (error) => {
      console.error("Orders subscription error:", error);
      setOrdersLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const metrics = useMemo(() => {
    if (!summaryDoc) return null;
    
    return {
      // Summary dari C-Level (single document read)
      totalCashIn: Number(summaryDoc.totalCashIn || 0),
      totalCashOut: Number(summaryDoc.totalCashOut || 0),
      netCashflow: Number(summaryDoc.netCashflow || 0),
      totalUnpaidCommission: Number(summaryDoc.totalUnpaidCommission || 0),
      unpaidRestaurantCommission: Number(summaryDoc.unpaidRestaurantCommission || 0),
      unpaidDriverCommission: Number(summaryDoc.unpaidDriverCommission || 0),
      totalRestaurantBalance: Number(summaryDoc.totalRestaurantBalance || 0),
      totalDriverBalance: Number(summaryDoc.totalDriverBalance || 0),
      totalTransactions: Number(summaryDoc.totalTransactions || 0),
      verifiedRestaurants: Number(summaryDoc.verifiedRestaurants || 0),
      verifiedDrivers: Number(summaryDoc.verifiedDrivers || 0),
      
      // Alerts
      financeAlerts: Array.isArray(summaryDoc.financeAlerts) 
        ? summaryDoc.financeAlerts 
        : [],
      
      // Exposure data
      topRestaurantExposure: Array.isArray(summaryDoc.topRestaurantExposure) 
        ? summaryDoc.topRestaurantExposure.slice(0, 5) 
        : [],
      topDriverExposure: Array.isArray(summaryDoc.topDriverExposure) 
        ? summaryDoc.topDriverExposure.slice(0, 5) 
        : [],
      
      updatedAt: Number(summaryDoc.updatedAt || 0),
    };
  }, [summaryDoc]);
  
  // Order analysis (dari real-time data)
  const orderAnalysis = useMemo(() => {
    const stats = {
      total: orders.length,
      completed: 0,
      pending: 0,
      cooking: 0,
      ready: 0,
      onDelivery: 0,
      cancelled: 0,
      totalRevenue: 0,
      byDay: new Map<string, { day: string; orders: number; revenue: number }>(),
      byMonth: new Map<string, { month: string; orders: number; revenue: number }>(),
    };
    
    orders.forEach(order => {
      const status = String(order?.status || "").toUpperCase();
      const total = Number(order?.total || 0);
      const stamp = Number(order?.timestamp || order?.createdAt || 0);
      
      // Count by status
      if (status === "COMPLETED") {
        stats.completed += 1;
        stats.totalRevenue += total;
      } else if (status === "PENDING") stats.pending += 1;
      else if (status === "COOKING") stats.cooking += 1;
      else if (status === "READY") stats.ready += 1;
      else if (status === "ON_DELIVERY") stats.onDelivery += 1;
      else if (status === "CANCELLED" || status === "REJECTED") stats.cancelled += 1;
      
      // Group by day (last 7 days)
      if (stamp) {
        const date = new Date(stamp);
        const dayKey = date.toLocaleDateString("id-ID", { weekday: "short" });
        const dayData = stats.byDay.get(dayKey) || { day: dayKey, orders: 0, revenue: 0 };
        dayData.orders += 1;
        if (status === "COMPLETED") dayData.revenue += total;
        stats.byDay.set(dayKey, dayData);
        
        // Group by month
        const monthKey = date.toLocaleDateString("id-ID", { month: "short" });
        const monthData = stats.byMonth.get(monthKey) || { month: monthKey, orders: 0, revenue: 0 };
        monthData.orders += 1;
        if (status === "COMPLETED") monthData.revenue += total;
        stats.byMonth.set(monthKey, monthData);
      }
    });
    
    // Convert maps to sorted arrays
    const dayOrder = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const byDayArray = Array.from(stats.byDay.values()).sort((a, b) => {
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    });
    
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const byMonthArray = Array.from(stats.byMonth.values()).sort((a, b) => {
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
    
    return {
      ...stats,
      active: stats.pending + stats.cooking + stats.ready + stats.onDelivery,
      byDay: byDayArray,
      byMonth: byMonthArray,
      statusData: [
        { label: "Completed", value: stats.completed, color: "#10b981" },
        { label: "Active", value: stats.pending + stats.cooking + stats.ready + stats.onDelivery, color: "#6366f1" },
        { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
      ],
    };
  }, [orders]);
  
  return {
    loading: summaryLoading || ordersLoading,
    metrics,
    orderAnalysis,
    rawOrders: orders,
  };
};
