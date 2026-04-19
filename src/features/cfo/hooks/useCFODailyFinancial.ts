import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot, query, collection, orderBy, limit, getDocs } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

// Hook untuk daily financial summary - single read per date
export const useCFODailyFinancial = (selectedDate?: string) => {
  const [dailyData, setDailyData] = useState<any | null>(null);
  const [recentDays, setRecentDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const targetDate = selectedDate || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Subscribe to single daily document (1 read)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(dbCLevel, "cfo_daily_financial_summary", targetDate),
      (snap) => {
        if (snap.exists()) {
          setDailyData({ id: snap.id, ...snap.data() });
        } else {
          setDailyData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Daily financial summary error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [targetDate]);

  // Fetch recent 7 days for trend (7 reads, cached)
  useEffect(() => {
    const fetchRecentDays = async () => {
      const dates = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }

      // Fetch all 7 days in parallel
      const promises = dates.map(date => 
        getDocs(query(
          collection(dbCLevel, "cfo_daily_financial_summary"),
          orderBy("date", "desc"),
          limit(7)
        ))
      );

      // Simplified: query once for recent 7
      const q = query(
        collection(dbCLevel, "cfo_daily_financial_summary"),
        orderBy("date", "desc"),
        limit(7)
      );
      
      const snap = await getDocs(q);
      const days = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
      setRecentDays(days);
    };

    fetchRecentDays();
  }, []);

  const summary = useMemo(() => {
    if (!dailyData) return null;

    return {
      // Revenue
      grossRevenue: Number(dailyData.grossRevenue || 0),
      netRevenue: Number(dailyData.netRevenue || 0),
      platformCommission: Number(dailyData.platformCommission || 0),
      
      // Income Statement
      operatingRevenue: dailyData.operatingRevenue || {
        orderRevenue: 0, commissionIncome: 0, otherIncome: 0, total: 0
      },
      costOfRevenue: dailyData.costOfRevenue || {
        driverIncentives: 0, restaurantPromotions: 0, paymentGatewayFees: 0, total: 0
      },
      grossProfit: Number(dailyData.grossProfit || 0),
      operatingExpenses: dailyData.operatingExpenses || {
        marketing: 0, salaries: 0, technology: 0, office: 0, other: 0, total: 0
      },
      operatingIncome: Number(dailyData.operatingIncome || 0),
      netIncomeBeforeTax: Number(dailyData.netIncomeBeforeTax || 0),
      tax: Number(dailyData.tax || 0),
      netIncome: Number(dailyData.netIncome || 0),
      
      // Partner Balances
      partnerBalances: dailyData.partnerBalances || {
        totalRestaurantBalance: 0,
        totalDriverBalance: 0,
        totalUnpaidCommission: 0,
        atRiskBalance: 0
      },
      
      // Metrics
      metrics: dailyData.metrics || {
        orderCount: 0, completedOrders: 0, cancelledOrders: 0,
        averageOrderValue: 0, activeMerchants: 0, activeDrivers: 0
      },
      
      // Alerts
      alerts: dailyData.alerts || [],
      
      // Status
      status: dailyData.status || "PENDING",
      syncedAt: dailyData.syncedAt,
    };
  }, [dailyData]);

  // Chart data dari recent days
  const chartData = useMemo(() => {
    return recentDays.map(day => ({
      date: day.date?.slice(5) || day.id?.slice(5), // MM-DD
      grossRevenue: Number(day.grossRevenue || 0),
      netRevenue: Number(day.netRevenue || 0),
      netIncome: Number(day.netIncome || 0),
      grossProfit: Number(day.grossProfit || 0),
      orderCount: Number(day.metrics?.orderCount || 0),
    }));
  }, [recentDays]);

  return {
    loading,
    summary,
    chartData,
    recentDays,
    selectedDate: targetDate,
  };
};
