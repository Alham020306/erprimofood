import CTOTechMetricCard from "../components/CTOTechMetricCard";
import CTOHealthBanner from "../components/CTOHealthBanner";
import CTOActivityTable from "../components/CTOActivityTable";
import CTOConfigPanel from "../components/CTOConfigPanel";
import CTOCommandCharts from "../components/CTOCommandCharts";
import CTOSectionShell from "../components/CTOSectionShell";
import { useCTOExecutiveDashboard } from "../hooks/useCTOExecutiveDashboard";
import { useCTONetworkHealth } from "../hooks/useCTONetworkHealth";

export default function CTODashboardPage() {
  const { loading, dashboard } = useCTOExecutiveDashboard();
  const network = useCTONetworkHealth();

  if (loading) return <div>Loading CTO dashboard...</div>;
  if (!dashboard) return <div>No CTO data</div>;

  const {
    summary,
    healthStatus,
    directorHealthStatus,
    systemFlags,
    latestBackup,
    latestLogs,
    latestAlerts,
    latestErrors,
    activitySeries,
    errorModuleSeries,
  } = dashboard;

  return (
    <div className="space-y-6">
      <CTOHealthBanner
        healthStatus={healthStatus}
        latencyMs={network.rttMs}
        networkStatus={network.browserHealth}
        uptimeLabel={network.isOnline ? "Browser Online" : "Browser Offline"}
        incidentCount={summary.unresolvedAlerts + summary.pendingMeetingRequests}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Users" value={summary.totalUsers} />
        <CTOTechMetricCard title="Drivers" value={summary.totalDrivers} />
        <CTOTechMetricCard title="Online Drivers" value={summary.onlineDrivers} />
        <CTOTechMetricCard title="Restaurants" value={summary.totalRestaurants} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Open Merchants" value={summary.openMerchants} />
        <CTOTechMetricCard title="Orders" value={summary.totalOrders} />
        <CTOTechMetricCard title="Active Orders" value={summary.activeOrders} />
        <CTOTechMetricCard title="Logs" value={summary.totalLogs} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Alerts" value={summary.totalAlerts} />
        <CTOTechMetricCard
          title="Unresolved Alerts"
          value={summary.unresolvedAlerts}
        />
        <CTOTechMetricCard title="Errors" value={summary.totalErrors} />
        <CTOTechMetricCard title="Error Count" value={summary.totalErrorCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CTOTechMetricCard title="Backups" value={summary.totalBackups} />
        <CTOTechMetricCard
          title="Critical Alerts"
          value={summary.criticalAlerts}
        />
        <CTOTechMetricCard
          title="Latest Backup"
          value={latestBackup?.status ?? "No backup"}
          subtitle={
            latestBackup?.createdAt
              ? new Date(latestBackup.createdAt).toLocaleString("id-ID")
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Director Users" value={summary.totalDirectorUsers} />
        <CTOTechMetricCard
          title="Director Approvals"
          value={summary.totalDirectorApprovals}
        />
        <CTOTechMetricCard
          title="Meeting Requests"
          value={summary.pendingMeetingRequests}
        />
        <CTOTechMetricCard
          title="Director Health"
          value={directorHealthStatus}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard
          title="Meeting Agendas"
          value={summary.totalMeetingAgendas}
        />
        <CTOTechMetricCard title="Letters" value={summary.totalLetters} />
        <CTOTechMetricCard
          title="Open Exec Tasks"
          value={summary.openExecutiveTasks}
        />
        <CTOTechMetricCard
          title="Director Queue"
          value={summary.unresolvedDirectorApprovals}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Banners" value={summary.totalBanners} />
        <CTOTechMetricCard title="Menus" value={summary.totalMenus} />
        <CTOTechMetricCard title="Categories" value={summary.totalCategories} />
        <CTOTechMetricCard
          title="Support Desk"
          value={dashboard.configSnapshot.supportOnline ? "ONLINE" : "OFFLINE"}
          subtitle={dashboard.configSnapshot.supportReason || "No support message"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Chats" value={summary.totalChats} />
        <CTOTechMetricCard
          title="Notifications"
          value={summary.totalNotifications}
        />
        <CTOTechMetricCard
          title="Voucher Claims"
          value={summary.totalVoucherClaims}
        />
        <CTOTechMetricCard
          title="Shipping Vouchers"
          value={summary.totalShippingVouchers}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Restaurant Reviews" value={summary.totalRestaurantReviews} />
        <CTOTechMetricCard title="Driver Reviews" value={summary.totalDriverReviews} />
        <CTOTechMetricCard
          title="Downlink"
          value={
            network.downlinkMbps !== null ? `${network.downlinkMbps} Mbps` : "n/a"
          }
        />
        <CTOTechMetricCard
          title="Effective Network"
          value={network.effectiveType.toUpperCase()}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard
          title="Tracked App Accounts"
          value={summary.trackedAppAccounts}
        />
        <CTOTechMetricCard
          title="Adoption Rate"
          value={`${summary.appAdoptionRate}%`}
        />
        <CTOTechMetricCard
          title="Adopted Accounts"
          value={summary.adoptedAccounts}
        />
        <CTOTechMetricCard
          title="Outdated Accounts"
          value={summary.outdatedAccounts}
        />
      </div>

      <CTOCommandCharts
        activitySeries={activitySeries}
        errorModuleSeries={errorModuleSeries}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <CTOSectionShell
          title="Config Snapshot"
          subtitle="Current system feature flags."
        >
          <CTOConfigPanel systemFlags={systemFlags} />
        </CTOSectionShell>

        <CTOSectionShell
          title="Latest Alerts"
          subtitle="Most recent system alert stream."
        >
          <CTOActivityTable
            title="Latest Alerts"
            rows={latestAlerts}
            type="alerts"
          />
        </CTOSectionShell>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CTOSectionShell
          title="Latest System Logs"
          subtitle="Recent technical and business events."
        >
          <CTOActivityTable
            title="Latest System Logs"
            rows={latestLogs}
            type="logs"
          />
        </CTOSectionShell>

        <CTOSectionShell
          title="Latest Errors"
          subtitle="Recent captured error signatures."
        >
          <CTOActivityTable
            title="Latest Errors"
            rows={latestErrors}
            type="errors"
          />
        </CTOSectionShell>
      </div>
    </div>
  );
}
