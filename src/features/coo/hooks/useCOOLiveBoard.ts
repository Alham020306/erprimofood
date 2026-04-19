import { useMemo } from "react";
import { useCOODashboard } from "./useCOODashboard";
import { isMerchantOperational } from "../../shared/utils/merchantOperationalStatus";

const isValidOrder = (order: any) => {
  return order && Object.keys(order).length > 0;
};

export const useCOOLiveBoard = () => {
  const { raw, loading } = useCOODashboard();

  const board = useMemo(() => {
    const restaurants = raw?.restaurants || [];
    const users = raw?.users || [];
    const orders = (raw?.orders || []).filter(isValidOrder);

    const drivers = users.filter(
      (u: any) => String(u?.role || "").toUpperCase() === "DRIVER"
    );

    const onlineDrivers = drivers.filter((d: any) => d?.isOnline === true);

    const openMerchants = restaurants.filter((m: any) => isMerchantOperational(m));

    const pendingOrders = orders.filter(
      (o: any) => String(o?.status || "").toUpperCase() === "PENDING"
    );

    const cookingOrders = orders.filter(
      (o: any) => String(o?.status || "").toUpperCase() === "COOKING"
    );

    const readyOrders = orders.filter(
      (o: any) => String(o?.status || "").toUpperCase() === "READY"
    );

    const issues: string[] = [];

    if (drivers.length > 0 && onlineDrivers.length === 0) {
      issues.push("Tidak ada driver online");
    }

    if (openMerchants.length === 0 && restaurants.length > 0) {
      issues.push("Semua merchant sedang tutup");
    }

    if (pendingOrders.length > 10) {
      issues.push("Pending orders tinggi");
    }

    if (readyOrders.length > onlineDrivers.length && readyOrders.length > 0) {
      issues.push("Ready orders melebihi driver online");
    }

    return {
      restaurants,
      drivers,
      orders,
      stats: {
        totalMerchants: restaurants.length,
        openMerchants: openMerchants.length,
        totalDrivers: drivers.length,
        onlineDrivers: onlineDrivers.length,
        totalOrders: orders.length,
        pendingOrders: pendingOrders.length,
        cookingOrders: cookingOrders.length,
        readyOrders: readyOrders.length,
      },
      issues,
    };
  }, [raw]);

  return {
    loading,
    board,
  };
};
