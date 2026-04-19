import { useEffect, useMemo, useState } from "react";
import { subscribeAdminOrders } from "../services/adminMonitoringService";

const isValidOrder = (order: any) => order && Object.keys(order).length > 0;

export const useAdminOrders = () => {
  const [loading, setLoading] = useState(true);
  const [rawOrders, setRawOrders] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState("ALL");
  const [orderSort, setOrderSort] = useState("NEWEST");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAdminOrders((rows) => {
      setRawOrders(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const orders = useMemo(() => {
    const base = rawOrders.filter(isValidOrder);
    const filteredByStatus =
      orderStatus === "ALL"
        ? base
        : base.filter(
            (order: any) =>
              String(order?.status || "").toUpperCase() === orderStatus.toUpperCase()
          );

    const keyword = searchQuery.trim().toLowerCase();
    const filtered = keyword
      ? filteredByStatus.filter((order: any) =>
          [
            order?.id,
            order?.customerName,
            order?.customerPhone,
            order?.restaurantName,
            order?.driverName,
            order?.status,
            order?.paymentMethod,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
        )
      : filteredByStatus;

    return [...filtered].sort((a: any, b: any) => {
      const aTime = Number(a?.timestamp || 0);
      const bTime = Number(b?.timestamp || 0);
      return orderSort === "NEWEST" ? bTime - aTime : aTime - bTime;
    });
  }, [orderSort, orderStatus, rawOrders, searchQuery]);

  const summary = useMemo(() => {
    const base = rawOrders.filter(isValidOrder);

    return {
      total: base.length,
      pending: base.filter(
        (item: any) => String(item?.status || "").toUpperCase() === "PENDING"
      ).length,
      completed: base.filter(
        (item: any) => String(item?.status || "").toUpperCase() === "COMPLETED"
      ).length,
      cancelled: base.filter((item: any) => {
        const status = String(item?.status || "").toUpperCase();
        return status === "CANCELLED" || status === "REJECTED";
      }).length,
      activeQueue: base.filter((item: any) =>
        ["PENDING", "ACCEPTED", "COOKING", "READY", "ON_DELIVERY"].includes(
          String(item?.status || "").toUpperCase()
        )
      ).length,
      readyHandoff: base.filter(
        (item: any) => String(item?.status || "").toUpperCase() === "READY"
      ).length,
      onDelivery: base.filter(
        (item: any) => String(item?.status || "").toUpperCase() === "ON_DELIVERY"
      ).length,
      totalValue: base.reduce(
        (sum: number, item: any) => sum + Number(item?.total || item?.totalPrice || 0),
        0
      ),
    };
  }, [rawOrders]);

  const attentionOrders = useMemo(
    () =>
      orders
        .filter((order: any) =>
          ["PENDING", "COOKING", "READY", "ON_DELIVERY", "CANCELLED", "REJECTED"].includes(
            String(order?.status || "").toUpperCase()
          )
        )
        .slice(0, 6),
    [orders]
  );

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrder(null);
      return;
    }

    if (selectedOrder) {
      const refreshed = orders.find((order: any) => order.id === selectedOrder.id);
      if (refreshed) setSelectedOrder(refreshed);
      else setSelectedOrder(null);
    }
  }, [orders]);

  return {
    loading,
    orders,
    summary,
    attentionOrders,
    searchQuery,
    setSearchQuery,
    orderStatus,
    setOrderStatus,
    orderSort,
    setOrderSort,
    selectedOrder,
    setSelectedOrder,
  };
};
