import { useMemo } from "react";
import { useCTODashboard } from "./useCTODashboard";
import { buildExpansionData } from "../services/ctoOpsIntelligence";

export const useCTOExpansionAnalyzer = () => {
  const { loading, dashboard } = useCTODashboard();

  const analysis = useMemo(() => {
    return buildExpansionData(dashboard?.raw || {});
  }, [dashboard]);

  return {
    loading,
    analysis,
  };
};