import CTOActivityTable from "../components/CTOActivityTable";
import CTOSectionShell from "../components/CTOSectionShell";
import { useCTOActivityFeeds } from "../hooks/useCTOActivityFeeds";

export default function CTOAlertsPage() {
  const { loading, latestAlerts, latestErrors } = useCTOActivityFeeds();

  if (loading) return <div>Loading CTO alerts...</div>;

  return (
    <div className="space-y-6">
      <CTOSectionShell
        title="System Alerts"
        subtitle="Operational and technical alerts that require attention."
      >
        <CTOActivityTable
          title="Latest Alerts"
          rows={latestAlerts}
          type="alerts"
        />
      </CTOSectionShell>

      <CTOSectionShell
        title="System Errors"
        subtitle="Most recent captured error events across modules."
      >
        <CTOActivityTable
          title="Latest Errors"
          rows={latestErrors}
          type="errors"
        />
      </CTOSectionShell>
    </div>
  );
}
