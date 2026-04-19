import { useMemo, useState } from "react";
import { useCOODashboard } from "./useCOODashboard";

const isValidOrder = (order: any) => {
  return order && Object.keys(order).length > 0;
};

export const useCOOOrders = () => {
  const { raw, loading } = useCOODashboard();

  const [orderStatus, setOrderStatus] = useState("ALL");
  const [orderSort, setOrderSort] = useState("NEWEST");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const orders = useMemo(() => {
    const base = (raw?.orders || []).filter(isValidOrder);

    const filtered =
      orderStatus === "ALL"
        ? base
        : base.filter(
            (order: any) =>
              String(order?.status || "").toUpperCase() ===
              orderStatus.toUpperCase()
          );

    return [...filtered].sort((a: any, b: any) => {
      const aTime = Number(a?.timestamp || 0);
      const bTime = Number(b?.timestamp || 0);
      return orderSort === "NEWEST" ? bTime - aTime : aTime - bTime;
    });
  }, [raw, orderStatus, orderSort]);

  const summary = useMemo(() => {
    const base = (raw?.orders || []).filter(isValidOrder);

    const pending = base.filter(
      (o: any) => String(o?.status || "").toUpperCase() === "PENDING"
    ).length;

    const completed = base.filter(
      (o: any) => String(o?.status || "").toUpperCase() === "COMPLETED"
    ).length;

    const cancelled = base.filter((o: any) => {
      const status = String(o?.status || "").toUpperCase();
      return status === "CANCELLED" || status === "REJECTED";
    }).length;

    const totalValue = base.reduce(
      (sum: number, o: any) => sum + Number(o?.total || o?.totalPrice || 0),
      0
    );

    return {
      total: base.length,
      pending,
      completed,
      cancelled,
      totalValue,
    };
  }, [raw]);

  return {
    loading,
    orders,
    summary,
    orderStatus,
    setOrderStatus,
    orderSort,
    setOrderSort,
    selectedOrder,
    setSelectedOrder,
  };
};