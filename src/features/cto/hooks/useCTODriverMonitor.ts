import { useMemo } from "react";
import { useCTODashboard } from "./useCTODashboard";
import { buildDriverMonitorData } from "../services/ctoOpsIntelligence";

export const useCTODriverMonitor = () => {
  const { loading, dashboard } = useCTODashboard();

  const drivers = useMemo(() => {
    return buildDriverMonitorData(dashboard?.raw || {});
  }, [dashboard]);

  return {
    loading,
    drivers,
  };
};