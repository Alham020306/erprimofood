import { useMemo } from "react";
import { useCFODashboard } from "./useCFODashboard";

export const useCFOReports = () => {
  const { dashboard, loading } = useCFODashboard();

  const categoryBreakdown = useMemo(() => {
    return dashboard?.categorySeries || [];
  }, [dashboard]);

  const monthlyStyleSummary = useMemo(() => {
    const rows = dashboard?.raw?.operationalLedger || [];
    const map = new Map<string, { period: string; cashIn: number; cashOut: number; net: number }>();

    rows.forEach((row: any) => {
      const date = String(row?.date || "");
      const period = date.length >= 7 ? date.slice(0, 7) : "UNKNOWN";
      const current = map.get(period) || {
        period,
        cashIn: 0,
        cashOut: 0,
        net: 0,
      };

      const amount = Number(row?.amount || 0);
      const type = String(row?.type || "").toUpperCase();

      if (type === "IN") current.cashIn += amount;
      if (type === "OUT") current.cashOut += amount;

      current.net = current.cashIn - current.cashOut;
      map.set(period, current);
    });

    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [dashboard]);

  const reportSummary = useMemo(() => {
    return dashboard?.summary || {};
  }, [dashboard]);

  const latestTransactions = useMemo(() => {
    return dashboard?.latestTransactions || [];
  }, [dashboard]);

  return {
    loading,
    categoryBreakdown,
    monthlyStyleSummary,
    reportSummary,
    latestTransactions,
  };
};
