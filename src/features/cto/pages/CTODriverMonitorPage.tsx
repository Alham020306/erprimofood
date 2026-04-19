import { useState } from "react";
import { useCTODriverMonitorLite } from "../hooks/useCTODriverMonitorLite";
import CTODriverMonitorTable from "../components/CTODriverMonitorTable";
import CTODriverDetailPanel from "../components/CTODriverDetailPanel";
import CTOTechMetricCard from "../components/CTOTechMetricCard";

export default function CTODriverMonitorPage() {
  const { loading, drivers } = useCTODriverMonitorLite();
  const [selected, setSelected] = useState<any | null>(null);

  if (loading) return <div>Loading CTO driver monitor...</div>;

  const live = drivers.filter((d) => d.freshness === "LIVE").length;
  const stale = drivers.filter((d) => d.freshness === "STALE").length;
  const noSignal = drivers.filter((d) => d.risk === "NO_SIGNAL").length;
  const idle = drivers.filter((d) => d.risk === "IDLE").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Drivers" value={drivers.length} />
        <CTOTechMetricCard title="Live Signal" value={live} />
        <CTOTechMetricCard title="Stale Signal" value={stale} />
        <CTOTechMetricCard title="Idle / No Signal" value={idle + noSignal} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CTODriverMonitorTable rows={drivers} onSelect={setSelected} />
        <CTODriverDetailPanel item={selected} />
      </div>
    </div>
  );
}
