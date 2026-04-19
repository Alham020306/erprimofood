import { useMemo } from "react";
import { useCTODashboard } from "./useCTODashboard";
import { buildMerchantZoneData } from "../services/ctoOpsIntelligence";

export const useCTOMerchantZones = () => {
  const { loading, dashboard } = useCTODashboard();

  const data = useMemo(() => {
    return buildMerchantZoneData(dashboard?.raw || {});
  }, [dashboard]);

  return {
    loading,
    merchants: data.merchants,
    zones: data.zones,
  };
};