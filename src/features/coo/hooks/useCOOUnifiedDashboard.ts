import { useEffect, useState, useMemo } from "react";
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

// Unified dashboard hook for COO - combines real-time + summary sync
export const useCOOUnifiedDashboard = () => {
  const [rawData, setRawData] = useState<any>(null);
  const [summaryDoc, setSummaryDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to summary from direksi DB (synced by CTO/Admin)
  useEffect(() => {
    const unsub = subscribeSummaryDoc(
      "coo_operational_summary",
      "current",
      setSummaryDoc
    );
    return () => unsub();
  }, []);

  // Subscribe to real-time data from main DB
  useEffect(() => {
    setLoading(true);
    const state = {
      orders: [] as any[],
      restaurants: [] as any[],
      users: [] as any[],
      reviews: [] as any[],
    };

    const emit = () => {
      setRawData({ ...state });
      setLoading(false);
    };

    // Orders
    const unsubOrders = onSnapshot(
      collection(dbMain, "orders"),
      (snap) => {
        state.orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => console.error("orders error:", err)
    );

    // Restaurants
    const unsubRestaurants = onSnapshot(
      collection(dbMain, "restaurants"),
      (snap) => {
        state.restaurants = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => console.error("restaurants error:", err)
    );

    // Users (Drivers)
    const unsubUsers = onSnapshot(
      collection(dbMain, "users"),
      (snap) => {
        state.users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => console.error("users error:", err)
    );

    // Reviews
    const unsubReviews = onSnapshot(
      collection(dbMain, "reviews"),
      (snap) => {
        state.reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        emit();
      },
      (err) => console.error("reviews error:", err)
    );

    return () => {
      unsubOrders();
      unsubRestaurants();
      unsubUsers();
      unsubReviews();
    };
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!rawData) return null;

    const { orders, restaurants, users, reviews } = rawData;
    const drivers = users.filter((u: any) => String(u.role).toUpperCase() === "DRIVER");

    // Order metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o: any) => o.status === "COMPLETED").length;
    const activeOrders = orders.filter((o: any) => 
      ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status)
    ).length;
    const cancelledOrders = orders.filter((o: any) => o.status === "CANCELLED").length;

    // Merchant metrics
    const totalMerchants = restaurants.length;
    const activeMerchants = restaurants.filter((r: any) => r.isOpen && !r.isBanned).length;
    const newMerchantsThisMonth = restaurants.filter((r: any) => {
      const created = r.createdAt?.toMillis?.() || r.createdAt;
      if (!created) return false;
      const date = new Date(created);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    // Driver metrics
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter((d: any) => d.isOnline && !d.isBanned).length;
    const offlineDrivers = drivers.filter((d: any) => !d.isOnline && !d.isBanned).length;
    const busyDrivers = drivers.filter((d: any) => d.currentOrderId).length;

    // Revenue metrics
    const totalRevenue = orders
      .filter((o: any) => o.status === "COMPLETED")
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Reviews metrics
    const totalReviews = reviews.length;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // Incidents/Alerts
    const incidents = [];
    if (activeOrders > 50) incidents.push(`⚠️ High order volume: ${activeOrders} active orders`);
    if (activeDrivers < 5 && activeOrders > 10) incidents.push("🚨 Driver shortage detected");
    if (cancelledOrders > totalOrders * 0.1) incidents.push(`⚠️ High cancellation rate: ${((cancelledOrders/totalOrders)*100).toFixed(1)}%`);

    // Top 5 Merchants by order count
    const merchantOrderCounts = restaurants.map((r: any) => {
      const merchantOrders = orders.filter((o: any) => o.restaurantId === r.id && o.status === "COMPLETED");
      return {
        ...r,
        orderCount: merchantOrders.length,
        revenue: merchantOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
      };
    }).sort((a: any, b: any) => b.orderCount - a.orderCount).slice(0, 5);

    // Top 5 Drivers by order count
    const driverOrderCounts = drivers.map((d: any) => {
      const driverOrders = orders.filter((o: any) => o.driverId === d.id && o.status === "COMPLETED");
      return {
        ...d,
        orderCount: driverOrders.length,
        rating: d.rating || 0,
      };
    }).sort((a: any, b: any) => b.orderCount - a.orderCount).slice(0, 5);

    // Top 10 Most Ordered Menu Items
    const menuItemCounts: Record<string, { name: string; count: number; restaurantName: string }> = {};
    orders.forEach((o: any) => {
      if (o.status === "COMPLETED" && o.items) {
        o.items.forEach((item: any) => {
          const key = `${o.restaurantId}-${item.name}`;
          if (!menuItemCounts[key]) {
            const restaurant = restaurants.find((r: any) => r.id === o.restaurantId);
            menuItemCounts[key] = {
              name: item.name,
              count: 0,
              restaurantName: restaurant?.name || "Unknown",
            };
          }
          menuItemCounts[key].count += item.quantity || 1;
        });
      }
    });
    const topMenuItems = Object.values(menuItemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      // Orders
      totalOrders,
      completedOrders,
      activeOrders,
      cancelledOrders,
      totalRevenue,
      avgOrderValue,

      // Merchants
      totalMerchants,
      activeMerchants,
      newMerchantsThisMonth,
      bannedMerchants: restaurants.filter((r: any) => r.isBanned).length,

      // Drivers
      totalDrivers,
      activeDrivers,
      offlineDrivers,
      busyDrivers,
      bannedDrivers: drivers.filter((d: any) => d.isBanned).length,

      // Reviews
      totalReviews,
      avgRating: Number(avgRating.toFixed(1)),

      // Alerts
      incidents,

      // Top Performers
      topMerchants: merchantOrderCounts,
      topDrivers: driverOrderCounts,
      topMenuItems,

      // Raw data
      raw: rawData,
    };
  }, [rawData]);

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!rawData?.orders) return null;

    const { orders } = rawData;

    // Orders by status
    const ordersByStatus = orders.reduce((acc: any, o: any) => {
      const status = o.status || "UNKNOWN";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Orders by hour (last 24h)
    const now = Date.now();
    const last24h = orders.filter((o: any) => {
      const ts = o.timestamp || o.createdAt?.toMillis?.() || 0;
      return now - ts < 24 * 60 * 60 * 1000;
    });

    const ordersByHour = new Array(24).fill(0);
    last24h.forEach((o: any) => {
      const ts = o.timestamp || o.createdAt?.toMillis?.() || 0;
      const hour = new Date(ts).getHours();
      ordersByHour[hour]++;
    });

    // Revenue by day (last 7 days)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayOrders = orders.filter((o: any) => {
        const ts = o.timestamp || o.createdAt?.toMillis?.() || 0;
        const orderDate = new Date(ts).toISOString().split("T")[0];
        return orderDate === dateStr && o.status === "COMPLETED";
      });
      
      const revenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      revenueByDay.push({
        date: date.toLocaleDateString("id-ID", { weekday: "short" }),
        revenue,
        orders: dayOrders.length,
      });
    }

    return {
      ordersByStatus: Object.entries(ordersByStatus).map(([name, value]) => ({ name, value })),
      ordersByHour: ordersByHour.map((count, hour) => ({ hour: `${hour}:00`, count })),
      revenueByDay,
    };
  }, [rawData]);

  return {
    loading,
    metrics,
    chartData,
    summary: summaryDoc,
    raw: rawData,
  };
};
