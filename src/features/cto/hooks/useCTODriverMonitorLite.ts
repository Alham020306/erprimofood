import { useEffect, useMemo, useState } from "react";
import { subscribeOperationalUsers } from "../../shared/services/operationalRealtimeService";
import { buildDriverMonitorData } from "../services/ctoOpsIntelligence";

export const useCTODriverMonitorLite = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeOperationalUsers((rows) => {
      setUsers(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const drivers = useMemo(() => buildDriverMonitorData({ users }), [users]);

  return {
    loading,
    drivers,
  };
};
