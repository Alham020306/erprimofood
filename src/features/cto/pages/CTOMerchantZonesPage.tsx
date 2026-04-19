import { useState } from "react";
import { useCTOMerchantZonesLite } from "../hooks/useCTOMerchantZonesLite";
import CTOMerchantZoneTable from "../components/CTOMerchantZoneTable";
import CTOMerchantDetailPanel from "../components/CTOMerchantDetailPanel";
import CTOTechMetricCard from "../components/CTOTechMetricCard";

export default function CTOMerchantZonesPage() {
  const { loading, zones } = useCTOMerchantZonesLite();
  const [selected, setSelected] = useState<any | null>(null);

  if (loading) return <div>Loading CTO merchant zones...</div>;

  const totalZones = zones.length;
  const weakZones = zones.filter((z) => z.openMerchants === 0).length;
  const activeZones = zones.filter((z) => z.openMerchants > 0).length;
  const closedHeavyZones = zones.filter((z) => z.closedMerchants > z.openMerchants).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Zones" value={totalZones} />
        <CTOTechMetricCard title="Active Zones" value={activeZones} />
        <CTOTechMetricCard title="Weak Zones" value={weakZones} />
        <CTOTechMetricCard title="Closed Heavy Zones" value={closedHeavyZones} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CTOMerchantZoneTable rows={zones} onSelect={setSelected} />
        <CTOMerchantDetailPanel item={selected} />
      </div>
    </div>
  );
}
