import { useEffect, useMemo, useState } from "react";
import { subscribeCFOData } from "../services/cfoDataService";
import { calculateCFOMetrics } from "../services/cfoMetrics";
import {
  subscribeSummaryDoc,
  upsertCFOFinancialSummary,
} from "../../shared/services/directorSummaryService";

export const useCFODashboard = () => {
  const [rawData, setRawData] = useState<any>(null);
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const unsub = subscribeSummaryDoc(
      "cfo_financial_summary",
      "current",
      setSummaryDoc
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeCFOData((data) => {
      setRawData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const dashboard = useMemo(() => {
    if (!rawData) return null;
    const computed = calculateCFOMetrics(rawData, { dateFrom, dateTo });

    return {
      ...computed,
      summary: {
        ...computed.summary,
        ...(summaryDoc || {}),
      },
      financeAlerts: Array.isArray(summaryDoc?.financeAlerts)
        ? summaryDoc.financeAlerts
        : computed.financeAlerts,
      topRestaurantExposure: Array.isArray(summaryDoc?.topRestaurantExposure)
        ? summaryDoc.topRestaurantExposure
        : computed.topRestaurantExposure,
      topDriverExposure: Array.isArray(summaryDoc?.topDriverExposure)
        ? summaryDoc.topDriverExposure
        : computed.topDriverExposure,
      orderStatusSummary:
        summaryDoc?.orderStatusSummary && typeof summaryDoc.orderStatusSummary === "object"
          ? summaryDoc.orderStatusSummary
          : computed.orderStatusSummary,
    };
  }, [rawData, dateFrom, dateTo, summaryDoc]);

  useEffect(() => {
    if (!rawData) return;
    const computed = calculateCFOMetrics(rawData, { dateFrom, dateTo });
    void upsertCFOFinancialSummary({
      ...computed.summary,
      financeAlerts: computed.financeAlerts,
      topExpenseCount: computed.topExpenses.length,
      latestTransactionCount: computed.latestTransactions.length,
      topRestaurantExposure: computed.topRestaurantExposure,
      topDriverExposure: computed.topDriverExposure,
      orderStatusSummary: computed.orderStatusSummary,
    });
  }, [rawData, dateFrom, dateTo]);

  return {
    dashboard,
    loading,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
  };
};
