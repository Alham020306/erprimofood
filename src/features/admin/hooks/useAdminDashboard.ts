import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";
import { isMerchantOperational } from "../../shared/utils/merchantOperationalStatus";
import {
  subscribeAdminOrders,
  subscribeAdminRecentDriverReviews,
  subscribeAdminRecentFrictionOrders,
  subscribeAdminRecentOrders,
  subscribeAdminRecentRestaurantReviews,
  subscribeAdminRestaurants,
  subscribeAdminSupportStatus,
  subscribeAdminUsers,
} from "../services/adminMonitoringService";

const getUserActivityTime = (item: any) =>
  Math.max(
    Number(item?.lastUpdateCheck || 0),
    Number(item?.updatedAt || 0),
    Number(item?.activatedAt || 0),
    Number(item?.createdAt || 0)
  );

export type TimeFilter = "week" | "month" | "year";

const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  // Calculate days to subtract to get to Monday
  // If Sunday (0), go back 6 days to previous Monday
  // If Monday (1), go back 0 days
  // If Tuesday-Saturday (2-6), go back 1-5 days
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

const filterOrdersByTime = (orders: any[], filter: TimeFilter) => {
  const now = Date.now();
  let startTime: number;

  switch (filter) {
    case "week":
      startTime = getStartOfWeek(new Date(now));
      break;
    case "month":
      startTime = getStartOfMonth(new Date(now));
      break;
    case "year":
      startTime = getStartOfYear(new Date(now));
      break;
    default:
      startTime = getStartOfWeek(new Date(now));
  }

  return orders.filter((order: any) => {
    const stamp = Number(order?.timestamp || order?.createdAt || 0);
    return stamp >= startTime;
  });
};

export const useAdminDashboard = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [frictionOrders, setFrictionOrders] = useState<any[]>([]);
  const [restaurantReviews, setRestaurantReviews] = useState<any[]>([]);
  const [driverReviews, setDriverReviews] = useState<any[]>([]);
  const [supportStatus, setSupportStatus] = useState({
    isOnline: false,
    reason: "",
  });
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeSummaryDoc("coo_operational_summary", "live", (data) => {
        setSummary(data);
        setLoading(false);
      }),
      subscribeAdminUsers(setUsers),
      subscribeAdminRestaurants(setRestaurants),
      subscribeAdminRecentOrders(setLatestOrders),
      subscribeAdminOrders(setAllOrders),
      subscribeAdminRecentFrictionOrders((rows) => {
        setFrictionOrders(
          rows.filter((item: any) => {
            const status = String(item?.status || "").toUpperCase();
            return status === "CANCELLED" || status === "REJECTED";
          })
        );
      }),
      subscribeAdminRecentRestaurantReviews(setRestaurantReviews),
      subscribeAdminRecentDriverReviews(setDriverReviews),
      subscribeAdminSupportStatus(setSupportStatus),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const activeUsers = useMemo(() => {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

    return users.filter((item: any) => {
      const role = String(item?.role || "").toUpperCase();

      // Driver: online now
      if (role === "DRIVER") return item?.isOnline === true;

      // Restaurant: operational (buka) now
      if (role === "RESTAURANT") {
        return isMerchantOperational(item);
      }

      // Customer: had very recent activity (likely online now)
      const lastActivity = getUserActivityTime(item);
      return lastActivity > fiveMinutesAgo;
    });
  }, [users]);

  const updatedUsers = useMemo(
    () =>
      [...users]
        .filter((item: any) => getUserActivityTime(item) > 0)
        .sort((a: any, b: any) => getUserActivityTime(b) - getUserActivityTime(a))
        .slice(0, 8),
    [users]
  );

  const platformMetrics = useMemo(() => {
    const allDrivers = users.filter((item: any) => String(item?.role || "").toUpperCase() === "DRIVER");
    const allRestaurants = restaurants;

    return {
      openMerchants: allRestaurants.filter((item: any) => isMerchantOperational(item)).length,
      totalMerchants: allRestaurants.length,
      onlineDrivers: allDrivers.filter((item: any) => item?.isOnline === true).length,
      totalDrivers: allDrivers.length,
      activeUsers: activeUsers.length,
      totalUsers: users.length,
    };
  }, [users, restaurants, activeUsers]);

  const filteredOrders = useMemo(
    () => filterOrdersByTime(allOrders, timeFilter),
    [allOrders, timeFilter]
  );

  return {
    loading,
    metrics: summary,
    platformMetrics,
    users,
    restaurants,
    activeUsers,
    updatedUsers,
    latestOrders,
    allOrders,
    filteredOrders,
    timeFilter,
    setTimeFilter,
    frictionOrders,
    restaurantReviews,
    driverReviews,
    supportStatus,
  };
};
