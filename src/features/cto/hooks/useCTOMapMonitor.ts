import { useMemo, useState } from "react";
import { useCTODashboard } from "./useCTODashboard";
import { buildCTOMapData } from "../services/ctoMapIntelligence";

export const useCTOMapMonitor = () => {
  const { loading, dashboard } = useCTODashboard();
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  const mapData = useMemo(() => {
    const config = dashboard?.raw?.config || null;

    if (!dashboard?.raw) {
      return {
        mapCenter: { lat: 2.3802, lng: 97.9892 },
        zonePolygon: [],
        merchantMarkers: [],
        driverMarkers: [],
        driverList: [],
        zoneMarkers: [],
        mainZoneInsight: {
          type: "AREA",
          name: "Operational Area",
          area: "Main Zone",
          status: "DRAFT",
          points: 0,
          merchants: [],
          drivers: [],
        },
        summary: {
          merchantsInZone: 0,
          merchantsOutOfZone: 0,
          driversInZone: 0,
          driversOutOfZone: 0,
          liveDrivers: 0,
          staleDrivers: 0,
          activeOrders: 0,
          weakZones: 0,
        },
      };
    }

    return buildCTOMapData(dashboard.raw, config);
  }, [dashboard]);

  return {
    loading,
    mapData,
    selectedMarker,
    setSelectedMarker,
  };
};
