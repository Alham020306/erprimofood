import { useEffect, useMemo, useState } from "react";
import {
  subscribeOperationalOrders,
  subscribeOperationalUsers,
} from "../../shared/services/operationalRealtimeService";
import { subscribeCOORestaurants } from "../../coo/services/cooLiteDataService";
import { subscribeCTODashboardConfig } from "../services/ctoDashboardFeedService";
import { buildCTOMapData } from "../services/ctoMapIntelligence";

export const useCTOMapMonitorLite = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [config, setConfig] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribeOperationalUsers((rows) => {
        setUsers(rows);
        setLoading(false);
      }),
      subscribeCOORestaurants(setRestaurants),
      subscribeOperationalOrders(setOrders),
      subscribeCTODashboardConfig(setConfig),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const mapData = useMemo(
    () =>
      buildCTOMapData(
        {
          users,
          restaurants,
          orders,
        },
        config
      ),
    [config, orders, restaurants, users]
  );

  return {
    loading,
    mapData,
    selectedMarker,
    setSelectedMarker,
  };
};
