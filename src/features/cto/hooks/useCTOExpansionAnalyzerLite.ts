import { useEffect, useMemo, useState } from "react";
import {
  subscribeOperationalOrders,
  subscribeOperationalUsers,
} from "../../shared/services/operationalRealtimeService";
import { subscribeCOORestaurants } from "../../coo/services/cooLiteDataService";
import { buildExpansionData } from "../services/ctoOpsIntelligence";

export const useCTOExpansionAnalyzerLite = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeOperationalUsers((rows) => {
        setUsers(rows);
        setLoading(false);
      }),
      subscribeCOORestaurants(setRestaurants),
      subscribeOperationalOrders(setOrders),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const analysis = useMemo(
    () =>
      buildExpansionData({
        users,
        restaurants,
        orders,
      }),
    [orders, restaurants, users]
  );

  return {
    loading,
    analysis,
  };
};
