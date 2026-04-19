import { useCMODashboard } from "../hooks/useCMODashboard";
import CMOMetricCard from "../components/CMOMetricCard";
import CMOGrowthOverview from "../components/CMOGrowthOverview";
import CMOChurnPanel from "../components/CMOChurnPanel";
import CMOGrowthCharts from "../components/CMOGrowthCharts";
import CMOCampaignROI from "../components/CMOCampaignROI";
import CMOSegmentActionPanel from "../components/CMOSegmentActionPanel";

type Props = {
  user: any;
};

export default function CMODashboardPage({ user }: Props) {
  const {
    loading,
    overview,
    areaGrowth,
    userInsights,
    dailySeries,
    segmentSummary,
    campaignROI,
  } = useCMODashboard({ user });

  if (loading) return <div>Loading CMO dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CMOMetricCard title="Total Users" value={overview.totalUsers} />
        <CMOMetricCard title="New Users 7D" value={overview.newUsers7d} />
        <CMOMetricCard title="Orders 30D" value={overview.orders30d} />
        <CMOMetricCard
          title="Revenue 30D"
          value={`Rp ${Number(overview.grossRevenue30d || 0).toLocaleString("id-ID")}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CMOMetricCard title="Conversion Rate" value={`${overview.conversionRate}%`} />
        <CMOMetricCard title="Cancel Rate" value={`${overview.cancelRate}%`} />
        <CMOMetricCard title="Banners Live" value={overview.activeAds} />
        <CMOMetricCard title="Unique Customers 30D" value={overview.uniqueCustomers30d} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CMOMetricCard title="Menus" value={overview.totalMenus} />
        <CMOMetricCard title="Promo Menus" value={overview.promoMenus} />
        <CMOMetricCard title="Trending Menus" value={overview.trendingMenus} />
        <CMOMetricCard title="Categories" value={overview.totalCategories} />
      </div>

      <CMOGrowthCharts rows={dailySeries} />

      <div className="grid gap-4 xl:grid-cols-2">
        <CMOGrowthOverview rows={areaGrowth} />
        <CMOChurnPanel rows={userInsights} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CMOCampaignROI rows={campaignROI} />
        <CMOSegmentActionPanel summary={segmentSummary} />
      </div>
    </div>
  );
}
