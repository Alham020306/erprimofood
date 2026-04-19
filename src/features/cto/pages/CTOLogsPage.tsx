import CTOActivityTable from "../components/CTOActivityTable";
import CTOSectionShell from "../components/CTOSectionShell";
import { useCTOActivityFeeds } from "../hooks/useCTOActivityFeeds";

export default function CTOLogsPage() {
  const { loading, latestLogs } = useCTOActivityFeeds();

  if (loading) return <div>Loading CTO logs...</div>;

  return (
    <div className="space-y-6">
      <CTOSectionShell
        title="System Logs"
        subtitle="Realtime log stream for core platform events."
      >
        <CTOActivityTable
          title="Latest System Logs"
          rows={latestLogs}
          type="logs"
        />
      </CTOSectionShell>
    </div>
  );
}
