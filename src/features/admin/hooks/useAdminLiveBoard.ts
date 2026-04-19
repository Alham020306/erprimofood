import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";
import {
  subscribeAdminOrders,
  subscribeAdminRestaurants,
  subscribeAdminUsers,
} from "../services/adminMonitoringService";
import { isMerchantOperational } from "../../shared/utils/merchantOperationalStatus";

const isValidOrder = (order: any) => order && Object.keys(order).length > 0;

export const useAdminLiveBoard = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeSummaryDoc("coo_operational_summary", "live", (data) => {
        setSummary(data);
        setLoading(false);
      }),
      subscribeAdminUsers(setUsers),
      subscribeAdminRestaurants(setRestaurants),
      subscribeAdminOrders(setOrders),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const board = useMemo(() => {
    const validOrders = orders.filter(isValidOrder);
    const drivers = users.filter(
      (item: any) => String(item?.role || "").toUpperCase() === "DRIVER"
    );
    const onlineDrivers = drivers.filter((item: any) => item?.isOnline === true);
    const openMerchants = restaurants.filter((item: any) => isMerchantOperational(item));
    const pendingOrders = validOrders.filter(
      (item: any) => String(item?.status || "").toUpperCase() === "PENDING"
    );
    const cookingOrders = validOrders.filter(
      (item: any) => String(item?.status || "").toUpperCase() === "COOKING"
    );
    const readyOrders = validOrders.filter(
      (item: any) => String(item?.status || "").toUpperCase() === "READY"
    );

    return {
      users,
      restaurants,
      drivers,
      orders: validOrders,
      stats: {
        totalMerchants: Number(summary?.totalMerchants ?? restaurants.length),
        openMerchants: Number(summary?.activeMerchants ?? openMerchants.length),
        totalDrivers: Number(summary?.totalDrivers ?? drivers.length),
        onlineDrivers: Number(summary?.activeDrivers ?? onlineDrivers.length),
        totalOrders: Number(summary?.totalOrders ?? validOrders.length),
        pendingOrders: pendingOrders.length,
        cookingOrders: cookingOrders.length,
        readyOrders: readyOrders.length,
      },
      issues: Array.isArray(summary?.incidents) ? summary.incidents : [],
    };
  }, [orders, restaurants, summary, users]);

  return {
    loading,
    board,
  };
};
