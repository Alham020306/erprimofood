import CTOMapView from "../components/CTOMapView";
import CTOMapLegend from "../components/CTOMapLegend";
import CTOMapInsightPanel from "../components/CTOMapInsightPanel";
import CTOMapEntityLists from "../components/CTOMapEntityLists";
import CTOTechMetricCard from "../components/CTOTechMetricCard";
import { useCTOMapMonitorLite } from "../hooks/useCTOMapMonitorLite";

export default function CTOMapMonitorPage() {
  const { loading, mapData, selectedMarker, setSelectedMarker } =
    useCTOMapMonitorLite();

  if (loading) {
    return <div className="p-6 text-slate-400">Loading CTO operational map...</div>;
  }

  if (!mapData) {
    return <div className="p-6 text-slate-400">No map data available.</div>;
  }

  const {
    mapCenter,
    zonePolygon,
    merchantMarkers,
    driverMarkers,
    driverList,
    zoneMarkers,
    mainZoneInsight,
    summary,
  } = mapData;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Merchants In Zone" value={summary.merchantsInZone} />
        <CTOTechMetricCard title="Drivers In Zone" value={summary.driversInZone} />
        <CTOTechMetricCard title="Live Drivers" value={summary.liveDrivers} />
        <CTOTechMetricCard title="Weak Zones" value={summary.weakZones} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CTOTechMetricCard title="Merchants Out Zone" value={summary.merchantsOutOfZone} />
        <CTOTechMetricCard title="Drivers Out Zone" value={summary.driversOutOfZone} />
        <CTOTechMetricCard title="Active Orders" value={summary.activeOrders} />
        <CTOTechMetricCard title="Zone Points" value={zonePolygon.length} />
      </div>

      <CTOMapView
        mapCenter={mapCenter}
        zonePolygon={zonePolygon}
        merchantMarkers={merchantMarkers}
        driverMarkers={driverMarkers}
        zoneMarkers={zoneMarkers}
        mainZoneInsight={mainZoneInsight}
        onSelect={setSelectedMarker}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <CTOMapLegend />
        <CTOMapInsightPanel selectedMarker={selectedMarker} />
      </div>

      <CTOMapEntityLists
        merchants={merchantMarkers}
        drivers={driverList}
        onSelect={setSelectedMarker}
      />
    </div>
    
  );
}
