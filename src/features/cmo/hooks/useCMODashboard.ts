import { useEffect, useMemo, useState } from "react";
import { buildCampaignROI } from "../services/cmoGrowthEngine";
import { useCMOCampaigns } from "./useCMOCampaigns";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";

type Params = {
  user: any;
};

const defaultOverview = {
  totalUsers: 0,
  newUsers7d: 0,
  orders30d: 0,
  grossRevenue30d: 0,
  conversionRate: 0,
  cancelRate: 0,
  activeAds: 0,
  uniqueCustomers30d: 0,
  totalMenus: 0,
  promoMenus: 0,
  trendingMenus: 0,
  totalCategories: 0,
};

export const useCMODashboard = ({ user }: Params) => {
  const campaignState = useCMOCampaigns({ user });
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const unsub = subscribeSummaryDoc("cmo_growth_summary", "current", (data) => {
      setSummaryDoc(data);
      setLoadingSummary(false);
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
      areaGrowth: Array.isArray(snapshot.areaGrowth) ? snapshot.areaGrowth : [],
      userInsights: Array.isArray(snapshot.highRiskUsers) ? snapshot.highRiskUsers : [],
      dailySeries: Array.isArray(snapshot.dailySeries) ? snapshot.dailySeries : [],
      segmentSummary:
        snapshot.segmentSummary && typeof snapshot.segmentSummary === "object"
          ? snapshot.segmentSummary
          : {
              vipCount: 0,
              loyalCount: 0,
              activeCount: 0,
              highRiskCount: 0,
              vipRevenue: 0,
              loyalRevenue: 0,
            },
      campaignROI: Array.isArray(snapshot.campaignROI)
        ? snapshot.campaignROI
        : buildCampaignROI(campaignState.items, {
            orders: [],
          }),
    };
  }, [summaryDoc, campaignState.items]);

  return {
    loading: loadingSummary || campaignState.loading,
    ...data,
  };
};
