import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

const defaultOverview = {
  totalRevenue: 0,
  totalOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  readyCookingOrders: 0,
  cancelRate: 0,
  totalUsers: 0,
  totalMerchants: 0,
  totalCampaigns: 0,
  totalEmployees: 0,
  totalRestaurantReviews: 0,
  totalDriverReviews: 0,
};

export const useCEODashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeSummaryDoc("executive_overview", "main", (data) => {
      setSummaryDoc(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const data = useMemo(() => {
    const snapshot = summaryDoc || {};

    return {
      overview: {
        ...defaultOverview,
        ...snapshot,
      },
      operationsFeed: {
        latestOrders: Array.isArray(snapshot.latestOrders) ? snapshot.latestOrders : [],
        latestRestaurantReviews: Array.isArray(snapshot.latestRestaurantReviews)
          ? snapshot.latestRestaurantReviews
          : [],
        latestDriverReviews: Array.isArray(snapshot.latestDriverReviews)
          ? snapshot.latestDriverReviews
          : [],
      },
      alerts: Array.isArray(snapshot.alerts) ? snapshot.alerts : [],
      roleReports: Array.isArray(snapshot.roleReports) ? snapshot.roleReports : [],
      decisions: Array.isArray(snapshot.decisions) ? snapshot.decisions : [],
      raw: {},
    };
  }, [summaryDoc]);

  return {
    loading,
    ...data,
  };
};
