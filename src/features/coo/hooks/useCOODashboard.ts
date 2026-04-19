import { useEffect, useMemo, useState } from "react";
import { subscribeCOOData } from "../services/cooDataService";
import { calculateCOOMetrics } from "../services/cooMetrics";
import {
  subscribeSummaryDoc,
  upsertCOOOperationalSummary,
} from "../../shared/services/directorSummaryService";

export const useCOODashboard = () => {
  const [baseMetrics, setBaseMetrics] = useState<any>(null);
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [raw, setRaw] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeSummaryDoc(
      "coo_operational_summary",
      "live",
      setSummaryDoc
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = subscribeCOOData((data) => {
      setRaw(data);
      const computedMetrics = calculateCOOMetrics(data);
      setBaseMetrics(computedMetrics);
      setLoading(false);

      void upsertCOOOperationalSummary({
        totalMerchants: computedMetrics.totalMerchants,
        activeMerchants: computedMetrics.activeMerchants,
        totalDrivers: computedMetrics.totalDrivers,
        activeDrivers: computedMetrics.activeDrivers,
        offlineDrivers: computedMetrics.offlineDrivers,
        activeOrders: computedMetrics.activeOrders,
        totalOrders: computedMetrics.totalOrders,
        completedOrders: computedMetrics.completedOrders,
        cancelledOrders: computedMetrics.cancelledOrders,
        readyCookingOrders: computedMetrics.readyCookingOrders,
        customerCancels: computedMetrics.customerCancels,
        totalReviews: computedMetrics.totalReviews,
        totalDriverReviews: computedMetrics.totalDriverReviews,
        incidentCount: computedMetrics.incidents.length,
        incidents: computedMetrics.incidents,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const metrics = useMemo(
    () =>
      baseMetrics
        ? {
            ...baseMetrics,
            ...(summaryDoc || {}),
          }
        : null,
    [baseMetrics, summaryDoc]
  );

  return {
    metrics,
    raw,
    loading,
  };
};
