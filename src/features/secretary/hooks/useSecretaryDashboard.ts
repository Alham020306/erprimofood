import { useEffect, useMemo, useState } from "react";
import { buildSecretaryTasks, buildNotifications } from "../services/secretaryEngine";
import {
  subscribeOperationalOrders,
  subscribeOperationalUsers,
} from "../../shared/services/operationalRealtimeService";

export const useSecretaryDashboard = () => {
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

  const raw = {
    users,
    orders,
    ads: [],
  };

  const tasks = useMemo(() => buildSecretaryTasks(raw), [raw]);
  const notifications = useMemo(() => buildNotifications(raw), [raw]);

  return {
    loading,
    tasks,
    notifications,
  };
};
