import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

export const useCFOSummaryDashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeSummaryDoc(
      "cfo_financial_summary",
      "current",
      (data) => {
        setSummaryDoc(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const dashboard = useMemo(() => {
    if (!summaryDoc) return null;

    return {
      summary: {
        totalCashIn: Number(summaryDoc.totalCashIn || 0),
        totalCashOut: Number(summaryDoc.totalCashOut || 0),
        netCashflow: Number(summaryDoc.netCashflow || 0),
        totalRestaurantBalance: Number(summaryDoc.totalRestaurantBalance || 0),
        totalDriverBalance: Number(summaryDoc.totalDriverBalance || 0),
        unpaidRestaurantCommission: Number(
          summaryDoc.unpaidRestaurantCommission || 0
        ),
        unpaidDriverCommission: Number(summaryDoc.unpaidDriverCommission || 0),
        totalUnpaidCommission: Number(summaryDoc.totalUnpaidCommission || 0),
        totalTransactions: Number(summaryDoc.totalTransactions || 0),
        totalOrders: Number(summaryDoc.totalOrders || 0),
        verifiedRestaurants: Number(summaryDoc.verifiedRestaurants || 0),
        verifiedDrivers: Number(summaryDoc.verifiedDrivers || 0),
        averageTransactionValue: Number(summaryDoc.averageTransactionValue || 0),
        topExpenseCount: Number(summaryDoc.topExpenseCount || 0),
        latestTransactionCount: Number(summaryDoc.latestTransactionCount || 0),
      },
      financeAlerts: Array.isArray(summaryDoc.financeAlerts)
        ? summaryDoc.financeAlerts
        : [],
      topRestaurantExposure: Array.isArray(summaryDoc.topRestaurantExposure)
        ? summaryDoc.topRestaurantExposure
        : [],
      topDriverExposure: Array.isArray(summaryDoc.topDriverExposure)
        ? summaryDoc.topDriverExposure
        : [],
      orderStatusSummary:
        summaryDoc.orderStatusSummary && typeof summaryDoc.orderStatusSummary === "object"
          ? summaryDoc.orderStatusSummary
          : {},
      updatedAt: Number(summaryDoc.updatedAt || 0),
    };
  }, [summaryDoc]);

  return {
    loading,
    dashboard,
  };
};
