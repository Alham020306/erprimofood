import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";
import {
  subscribeCOOOrders,
  subscribeCOORestaurants,
  subscribeCOOUsers,
} from "../services/cooLiteDataService";
import { isMerchantOperational } from "../../shared/utils/merchantOperationalStatus";

export const useCOOLandingDashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeSummaryDoc("coo_operational_summary", "live", (data) => {
        setSummaryDoc(data);
        setLoading(false);
      }),
      subscribeCOORestaurants(setRestaurants),
      subscribeCOOUsers(setUsers),
      subscribeCOOOrders(setOrders),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const metrics = useMemo(() => {
    const drivers = users.filter(
      (item: any) => String(item?.role || "").toUpperCase() === "DRIVER"
    );
    const activeDrivers = drivers.filter((item: any) => item?.isOnline === true);
    const activeMerchants = restaurants.filter((item: any) => isMerchantOperational(item));
    const activeOrders = orders.filter((item: any) => {
      const status = String(item?.status || "").toUpperCase();
      return !["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
    });
    const completedOrders = orders.filter(
      (item: any) => String(item?.status || "").toUpperCase() === "COMPLETED"
    );

    return {
      totalMerchants: Number(summaryDoc?.totalMerchants ?? restaurants.length),
      activeMerchants: Number(summaryDoc?.activeMerchants ?? activeMerchants.length),
      totalDrivers: Number(summaryDoc?.totalDrivers ?? drivers.length),
      activeDrivers: Number(summaryDoc?.activeDrivers ?? activeDrivers.length),
      offlineDrivers: Number(
        summaryDoc?.offlineDrivers ?? drivers.length - activeDrivers.length
      ),
      activeOrders: Number(summaryDoc?.activeOrders ?? activeOrders.length),
      totalOrders: Number(summaryDoc?.totalOrders ?? orders.length),
      completedOrders: Number(summaryDoc?.completedOrders ?? completedOrders.length),
      cancelledOrders: Number(summaryDoc?.cancelledOrders ?? 0),
      totalReviews: Number(summaryDoc?.totalReviews ?? 0),
      totalDriverReviews: Number(summaryDoc?.totalDriverReviews ?? 0),
      readyCookingOrders: Number(summaryDoc?.readyCookingOrders ?? 0),
      customerCancels: Number(summaryDoc?.customerCancels ?? 0),
      incidents: Array.isArray(summaryDoc?.incidents) ? summaryDoc.incidents : [],
    };
  }, [orders, restaurants, summaryDoc, users]);

  return {
    loading,
    metrics,
    raw: {
      restaurants,
      users,
      orders,
    },
  };
};
