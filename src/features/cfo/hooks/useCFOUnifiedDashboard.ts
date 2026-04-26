import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

const safeNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePercentToRate = (value: unknown, fallback: number) => {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw < 0) return fallback;
  return raw > 1 ? raw / 100 : raw;
};

const timestampToNumber = (value: any) => {
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return safeNumber(value, 0);
};

const dayLabel = (value: number) =>
  new Date(value).toLocaleDateString("id-ID", { weekday: "short" });

const monthLabel = (value: number) =>
  new Date(value).toLocaleDateString("id-ID", { month: "short" });

export const useCFOUnifiedDashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState<any | null>(null);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeSummaryDoc("cfo_financial_summary", "current", (data) => {
      setSummaryDoc(data);
      setSummaryLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubOrders = onSnapshot(
      collection(dbMain, "orders"),
      (snap) => {
        setOrders(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
        setOrdersLoading(false);
      },
      (error) => {
        console.error("Orders subscription error:", error);
        setOrders([]);
        setOrdersLoading(false);
      }
    );

    const unsubConfig = onSnapshot(
      doc(dbMain, "system", "config"),
      (snap) => setSystemConfig(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setSystemConfig(null)
    );

    const unsubCommissions = onSnapshot(
      collection(dbMain, "commissions"),
      (snap) => setCommissions(snap.docs.map((item) => ({ id: item.id, ...item.data() }))),
      () => setCommissions([])
    );

    return () => {
      unsubOrders();
      unsubConfig();
      unsubCommissions();
    };
  }, []);

  const commissionRates = useMemo(() => {
    const configSource = systemConfig?.settings || systemConfig || {};
    return {
      RESTAURANT: normalizePercentToRate(configSource?.serviceFeePercent, 0.05),
      DRIVER: normalizePercentToRate(configSource?.driverCommissionPercent, 0.2),
    };
  }, [systemConfig]);

  const metrics = useMemo(() => {
    if (!summaryDoc) return null;

    return {
      totalCashIn: safeNumber(summaryDoc.totalCashIn),
      totalCashOut: safeNumber(summaryDoc.totalCashOut),
      netCashflow: safeNumber(summaryDoc.netCashflow),
      totalUnpaidCommission: safeNumber(summaryDoc.totalUnpaidCommission),
      unpaidRestaurantCommission: safeNumber(summaryDoc.unpaidRestaurantCommission),
      unpaidDriverCommission: safeNumber(summaryDoc.unpaidDriverCommission),
      totalRestaurantBalance: safeNumber(summaryDoc.totalRestaurantBalance),
      totalDriverBalance: safeNumber(summaryDoc.totalDriverBalance),
      totalTransactions: safeNumber(summaryDoc.totalTransactions),
      totalOrders: safeNumber(summaryDoc.totalOrders),
      verifiedRestaurants: safeNumber(summaryDoc.verifiedRestaurants),
      verifiedDrivers: safeNumber(summaryDoc.verifiedDrivers),
      averageTransactionValue: safeNumber(summaryDoc.averageTransactionValue),
      financeAlerts: Array.isArray(summaryDoc.financeAlerts) ? summaryDoc.financeAlerts : [],
      topRestaurantExposure: Array.isArray(summaryDoc.topRestaurantExposure)
        ? summaryDoc.topRestaurantExposure.slice(0, 5)
        : [],
      topDriverExposure: Array.isArray(summaryDoc.topDriverExposure)
        ? summaryDoc.topDriverExposure.slice(0, 5)
        : [],
      orderStatusSummary:
        summaryDoc.orderStatusSummary && typeof summaryDoc.orderStatusSummary === "object"
          ? summaryDoc.orderStatusSummary
          : {},
      updatedAt: safeNumber(summaryDoc.updatedAt),
    };
  }, [summaryDoc]);

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
      subtotalTotal: 0,
      deliveryFeeTotal: 0,
      distanceTotal: 0,
      ratedDistanceCount: 0,
      byDay: new Map<string, { day: string; orders: number; revenue: number }>(),
      byMonth: new Map<string, { month: string; orders: number; revenue: number }>(),
    };

    const completedOrders: any[] = [];

    orders.forEach((order) => {
      const status = String(order?.status || "").toUpperCase();
      const total = safeNumber(order?.total);
      const deliveryFee = safeNumber(order?.deliveryFee);
      const stamp = timestampToNumber(order?.timestamp ?? order?.createdAt);

      if (status === "COMPLETED") {
        stats.completed += 1;
        stats.totalRevenue += total;
        stats.subtotalTotal += Math.max(0, total - deliveryFee);
        stats.deliveryFeeTotal += deliveryFee;
        const distance =
          safeNumber(order?.distanceKm) ||
          safeNumber(order?.distance) ||
          safeNumber(order?.routeDistanceKm);
        if (distance > 0) {
          stats.distanceTotal += distance;
          stats.ratedDistanceCount += 1;
        }
        completedOrders.push(order);
      } else if (status === "PENDING") stats.pending += 1;
      else if (status === "COOKING") stats.cooking += 1;
      else if (status === "READY") stats.ready += 1;
      else if (status === "ON_DELIVERY") stats.onDelivery += 1;
      else if (status === "CANCELLED" || status === "REJECTED") stats.cancelled += 1;

      if (stamp) {
        const dayKey = dayLabel(stamp);
        const monthKey = monthLabel(stamp);

        const dayData = stats.byDay.get(dayKey) || { day: dayKey, orders: 0, revenue: 0 };
        dayData.orders += 1;
        if (status === "COMPLETED") dayData.revenue += total;
        stats.byDay.set(dayKey, dayData);

        const monthData = stats.byMonth.get(monthKey) || {
          month: monthKey,
          orders: 0,
          revenue: 0,
        };
        monthData.orders += 1;
        if (status === "COMPLETED") monthData.revenue += total;
        stats.byMonth.set(monthKey, monthData);
      }
    });

    const active = stats.pending + stats.cooking + stats.ready + stats.onDelivery;
    const avgFoodSubtotal =
      stats.completed > 0 ? Math.round(stats.subtotalTotal / stats.completed) : 0;
    const avgDeliveryFee =
      stats.completed > 0 ? Math.round(stats.deliveryFeeTotal / stats.completed) : 0;
    const avgDistanceKm =
      stats.ratedDistanceCount > 0
        ? Number((stats.distanceTotal / stats.ratedDistanceCount).toFixed(2))
        : 0;
    const completionRate =
      stats.total > 0 ? Number(((stats.completed / stats.total) * 100).toFixed(1)) : 0;

    const dayOrder = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const latestCompletedOrders = [...completedOrders]
      .sort(
        (a, b) =>
          timestampToNumber(b?.timestamp ?? b?.createdAt) -
          timestampToNumber(a?.timestamp ?? a?.createdAt)
      )
      .slice(0, 8)
      .map((order) => ({
        id: order.id,
        customerName: order.customerName || order.customerId || "-",
        restaurantName: order.restaurantName || order.restaurantId || "-",
        driverName: order.driverName || order.driverId || "-",
        total: safeNumber(order.total),
        deliveryFee: safeNumber(order.deliveryFee),
        subtotal: Math.max(0, safeNumber(order.total) - safeNumber(order.deliveryFee)),
        distanceKm:
          safeNumber(order.distanceKm) ||
          safeNumber(order.distance) ||
          safeNumber(order.routeDistanceKm),
        timestamp: timestampToNumber(order?.timestamp ?? order?.createdAt),
      }));

    return {
      ...stats,
      active,
      avgFoodSubtotal,
      avgDeliveryFee,
      avgDistanceKm,
      completionRate,
      byDay: Array.from(stats.byDay.values()).sort(
        (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
      ),
      byMonth: Array.from(stats.byMonth.values()).sort(
        (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      ),
      latestCompletedOrders,
      statusData: [
        { label: "Completed", value: stats.completed, color: "#10b981" },
        { label: "Active", value: active, color: "#6366f1" },
        { label: "Cancelled", value: stats.cancelled, color: "#ef4444" },
      ],
    };
  }, [orders]);

  const settlementSummary = useMemo(() => {
    return commissions.reduce(
      (acc, item) => {
        const amount = safeNumber(item?.amount);
        const status = String(item?.status || "UNPAID").toUpperCase();
        if (status === "PAID") acc.totalPaid += amount;
        else acc.totalUnpaid += amount;
        acc.totalCommission += amount;
        return acc;
      },
      { totalUnpaid: 0, totalPaid: 0, totalCommission: 0 }
    );
  }, [commissions]);

  const settlementTrend = useMemo(() => {
    const recentDays = 14;
    const labels: string[] = [];
    const dayMap = new Map<
      string,
      {
        label: string;
        allRevenue: number;
        allPaid: number;
        allUnpaid: number;
        restaurantRevenue: number;
        restaurantPaid: number;
        restaurantUnpaid: number;
        driverRevenue: number;
        driverPaid: number;
        driverUnpaid: number;
      }
    >();

    for (let offset = recentDays - 1; offset >= 0; offset -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
      labels.push(key);
      dayMap.set(key, {
        label,
        allRevenue: 0,
        allPaid: 0,
        allUnpaid: 0,
        restaurantRevenue: 0,
        restaurantPaid: 0,
        restaurantUnpaid: 0,
        driverRevenue: 0,
        driverPaid: 0,
        driverUnpaid: 0,
      });
    }

    commissions.forEach((item) => {
      const stamp = timestampToNumber(item?.createdAt);
      if (!stamp) return;
      const key = new Date(stamp).toISOString().slice(0, 10);
      const bucket = dayMap.get(key);
      if (!bucket) return;

      const type = String(item?.type || "").toUpperCase();
      const amount = safeNumber(item?.amount);
      const orderTotal = safeNumber(item?.orderTotal);
      const deliveryFee = safeNumber(item?.deliveryFee);
      const grossRevenue =
        type === "RESTAURANT"
          ? Math.max(0, orderTotal - deliveryFee)
          : type === "DRIVER"
          ? deliveryFee
          : 0;

      bucket.allRevenue += grossRevenue;
      if (String(item?.status || "").toUpperCase() === "PAID") {
        bucket.allPaid += amount;
      } else {
        bucket.allUnpaid += amount;
      }

      if (type === "RESTAURANT") {
        bucket.restaurantRevenue += grossRevenue;
        if (String(item?.status || "").toUpperCase() === "PAID") {
          bucket.restaurantPaid += amount;
        } else {
          bucket.restaurantUnpaid += amount;
        }
      }

      if (type === "DRIVER") {
        bucket.driverRevenue += grossRevenue;
        if (String(item?.status || "").toUpperCase() === "PAID") {
          bucket.driverPaid += amount;
        } else {
          bucket.driverUnpaid += amount;
        }
      }
    });

    return labels
      .map((key) => dayMap.get(key))
      .filter(Boolean)
      .map((item) => item!);
  }, [commissions]);

  return {
    loading: summaryLoading || ordersLoading,
    metrics,
    orderAnalysis,
    settlementSummary,
    settlementTrend,
    commissionRates,
    rawOrders: orders,
  };
};
