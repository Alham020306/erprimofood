import { useCEODashboard } from "../hooks/useCEODashboard";
import CEOAlertPanel from "../components/CEOAlertPanel";
import CEODecisionPanel from "../components/CEODecisionPanel";
import CEOMetricCard from "../components/CEOMetricCard";
import CEOOperationsPanel from "../components/CEOOperationsPanel";
import CEORoleReportBoard from "../components/CEORoleReportBoard";

export default function CEODashboardPage() {
  const { loading, overview, operationsFeed, alerts, roleReports, decisions } =
    useCEODashboard();

  if (loading) return <div>Loading CEO dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CEOMetricCard
          title="Total Revenue"
          value={`Rp ${Number(overview.totalRevenue || 0).toLocaleString("id-ID")}`}
        />
        <CEOMetricCard title="Total Orders" value={overview.totalOrders} />
        <CEOMetricCard title="Total Users" value={overview.totalUsers} />
        <CEOMetricCard title="Cancel Rate" value={`${overview.cancelRate}%`} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CEOMetricCard title="Merchants" value={overview.totalMerchants} />
        <CEOMetricCard title="Campaigns" value={overview.totalCampaigns} />
        <CEOMetricCard title="Employees" value={overview.totalEmployees} />
        <CEOMetricCard title="Completed Orders" value={overview.completedOrders} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CEOMetricCard
          title="Restaurant Reviews"
          value={overview.totalRestaurantReviews}
        />
        <CEOMetricCard
          title="Driver Reviews"
          value={overview.totalDriverReviews}
        />
        <CEOMetricCard
          title="Cancelled Orders"
          value={overview.cancelledOrders || 0}
        />
        <CEOMetricCard
          title="Ready / Cooking"
          value={overview.readyCookingOrders || 0}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CEOAlertPanel rows={alerts} />
        <CEODecisionPanel rows={decisions} />
      </div>

      <CEOOperationsPanel
        orders={operationsFeed?.latestOrders || []}
        reviews={operationsFeed?.latestRestaurantReviews || []}
        driverReviews={operationsFeed?.latestDriverReviews || []}
      />

      <CEORoleReportBoard rows={roleReports} />
    </div>
  );
}
