import { useEffect, useMemo, useState } from "react";
import { buildCMOUserInsights } from "../services/cmoGrowthEngine";
import {
  subscribeOperationalOrders,
  subscribeOperationalUsers,
} from "../../shared/services/operationalRealtimeService";

export const useCMOUserInsights = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeOperationalUsers((rows) => {
        setUsers(rows);
        setLoading(false);
      }),
      subscribeOperationalOrders(setOrders),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const items = useMemo(() => {
    return buildCMOUserInsights({
      users,
      orders,
    });
  }, [orders, users]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      vip: items.filter((i: any) => i.segment === "VIP").length,
      loyal: items.filter((i: any) => i.segment === "LOYAL").length,
      highRisk: items.filter((i: any) => i.churnRisk === "HIGH").length,
    };
  }, [items]);

  return {
    loading,
    items,
    summary,
  };
};
