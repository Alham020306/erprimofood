import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

export type CFOTimeFilter = "week" | "month" | "year";

type TrendPoint = {
  label: string;
  sortKey: number;
  bucketKey: string;
  orders: number;
  revenue: number;
};

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
  if (typeof value === "string") {
    const direct = Date.parse(value);
    if (Number.isFinite(direct)) return direct;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    return 0;
  }
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  return safeNumber(value, 0);
};

const getOrderTimestamp = (order: any) =>
  timestampToNumber(
    order?.timestamp ??
      order?.createdAt ??
      order?.createdAtServer ??
      order?.updatedAt ??
      order?.acceptedAt
  );

const dayLabel = (value: number) =>
  new Date(value).toLocaleDateString("id-ID", { weekday: "short" });

const monthLabel = (value: number) =>
  new Date(value).toLocaleDateString("id-ID", { month: "short" });

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const daysToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getStartOfMonth = (date: Date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getStartOfYear = (date: Date) => {
  const d = new Date(date);
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const filterOrdersByTime = (orders: any[], filter: CFOTimeFilter) => {
  const now = Date.now();
  let startTime = getStartOfWeek(new Date(now));

  if (filter === "month") startTime = getStartOfMonth(new Date(now));
  if (filter === "year") startTime = getStartOfYear(new Date(now));

  return orders.filter((order: any) => {
    const stamp = getOrderTimestamp(order);
    return stamp >= startTime;
  });
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createTrendBuckets = (filter: CFOTimeFilter) => {
  if (filter === "week") {
    const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const monday = new Date(getStartOfWeek(new Date()));
    return labels.map((label, index) => {
      const bucketDate = new Date(monday);
      bucketDate.setDate(monday.getDate() + index);
      return {
        label,
        sortKey: index,
        bucketKey: toDateKey(bucketDate),
        orders: 0,
        revenue: 0,
      };
    });
  }

  if (filter === "month") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Array.from({ length: totalDays }, (_, index) => {
      const dayNumber = index + 1;
      const bucketDate = new Date(year, month, dayNumber);
      const weekday = bucketDate.toLocaleDateString("id-ID", { weekday: "short" });
      return {
        label: `${dayNumber} ${weekday}`,
        sortKey: dayNumber,
        bucketKey: `${dayNumber}`,
        orders: 0,
        revenue: 0,
      };
    });
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return monthLabels.map((label, index) => ({
    label,
    sortKey: index,
    bucketKey: `${index}`,
    orders: 0,
    revenue: 0,
  }));
};

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
      const stamp = getOrderTimestamp(order);

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
          getOrderTimestamp(b) - getOrderTimestamp(a)
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
        timestamp: getOrderTimestamp(order),
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

  const getOrderTrendByFilter = useMemo(
    () => (filter: CFOTimeFilter) => {
      const filteredOrders = filterOrdersByTime(orders, filter);
      const grouped = new Map<string, TrendPoint>(
        createTrendBuckets(filter).map((item) => [item.label, item])
      );

      filteredOrders.forEach((order) => {
        const stamp = getOrderTimestamp(order);
        if (!stamp) return;

        const date = new Date(stamp);
        let key = "";

        if (filter === "week") {
          key = toDateKey(date);
        } else if (filter === "month") {
          key = `${date.getDate()}`;
        } else {
          key = `${date.getMonth()}`;
        }

        const current = Array.from(grouped.values()).find((item) => item.bucketKey === key);
        if (!current) return;
        current.orders += 1;
        if (String(order?.status || "").toUpperCase() === "COMPLETED") {
          current.revenue += safeNumber(order?.total || order?.totalPrice || 0);
        }
      });

      return Array.from(grouped.values()).sort((a, b) => a.sortKey - b.sortKey);
    },
    [orders]
  );

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
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
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
      const d = new Date(stamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${year}-${month}-${day}`;
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
    getOrderTrendByFilter,
    settlementSummary,
    settlementTrend,
    commissionRates,
    rawOrders: orders,
  };
};
