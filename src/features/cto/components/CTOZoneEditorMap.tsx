import { useEffect, useMemo } from "react";
import {
  hasGoogleMapsApiKey,
  loadGoogleMaps,
} from "../../shared/utils/googleMapsLoader";

type Coordinate = {
  lat: number;
  lng: number;
};

type MacroZone = {
  path?: Coordinate[];
};

type Props = {
  center: Coordinate;
  primaryZone: Coordinate[];
  macroZones: MacroZone[];
  activeMode: "center" | "primary" | "macro";
  activeMacroIndex: number;
  onAddPrimaryPoint: (point: Coordinate) => void;
  onAddMacroPoint: (point: Coordinate) => void;
  onSetCenter: (point: Coordinate) => void;
  onMovePrimaryPoint: (index: number, point: Coordinate) => void;
  onMoveMacroPoint: (zoneIndex: number, pointIndex: number, point: Coordinate) => void;
  onRemovePrimaryPoint: (index: number) => void;
  onRemoveMacroPoint: (zoneIndex: number, pointIndex: number) => void;
};

export default function CTOZoneEditorMap({
  center,
  primaryZone,
  macroZones,
  activeMode,
  activeMacroIndex,
  onAddPrimaryPoint,
  onAddMacroPoint,
  onSetCenter,
  onMovePrimaryPoint,
  onMoveMacroPoint,
  onRemovePrimaryPoint,
  onRemoveMacroPoint,
}: Props) {
  const containerId = "cto-zone-editor-google-map";
  const mapCenter = useMemo<[number, number]>(
    () => [center.lat || 2.3802, center.lng || 97.9892],
    [center]
  );

  useEffect(() => {
    let cancelled = false;
    const overlays: any[] = [];

    loadGoogleMaps()
      .then((google) => {
        if (!google || cancelled) return;

        const element = document.getElementById(containerId);
        if (!element) return;

        const map = new google.maps.Map(element, {
          center: { lat: mapCenter[0], lng: mapCenter[1] },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const clickListener = map.addListener("click", (event: any) => {
          const point = {
            lat: Number(event.latLng.lat().toFixed(6)),
            lng: Number(event.latLng.lng().toFixed(6)),
          };

          if (activeMode === "center") {
            onSetCenter(point);
            return;
          }

          if (activeMode === "primary") {
            onAddPrimaryPoint(point);
            return;
          }

          onAddMacroPoint(point);
        });
        overlays.push({ remove: () => clickListener.remove() });

        const makeMarker = (color: string, label: string, point: Coordinate, title: string) =>
          new google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map,
            draggable: true,
            title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 10,
              labelOrigin: new google.maps.Point(0, 1),
            },
            label: {
              text: label,
              color: "#020617",
              fontWeight: "700",
              fontSize: "11px",
            },
          });

        const centerMarker = makeMarker(
          "#34d399",
          "C",
          { lat: center.lat || mapCenter[0], lng: center.lng || mapCenter[1] },
          "Center"
        );
        centerMarker.addListener("dragend", (event: any) => {
          onSetCenter({
            lat: Number(event.latLng.lat().toFixed(6)),
            lng: Number(event.latLng.lng().toFixed(6)),
          });
        });
        overlays.push(centerMarker);

        if (primaryZone.length >= 2) {
          const polygon = new google.maps.Polygon({
            paths: primaryZone.map((point) => ({ lat: point.lat, lng: point.lng })),
            strokeColor: "#22d3ee",
            strokeOpacity: 1,
            strokeWeight: 3,
            fillColor: "#22d3ee",
            fillOpacity: 0.12,
          });
          polygon.setMap(map);
          overlays.push(polygon);
        }

        primaryZone.forEach((point, index) => {
          const marker = makeMarker("#22d3ee", "P", point, `Primary ${index + 1}`);
          marker.addListener("dragend", (event: any) => {
            onMovePrimaryPoint(index, {
              lat: Number(event.latLng.lat().toFixed(6)),
              lng: Number(event.latLng.lng().toFixed(6)),
            });
          });
          marker.addListener("click", () => onRemovePrimaryPoint(index));
          overlays.push(marker);
        });

        macroZones.forEach((zone, zoneIndex) => {
          const path = Array.isArray(zone?.path) ? zone.path : [];
          const isActive = zoneIndex === activeMacroIndex;

          if (path.length >= 2) {
            const polygon = new google.maps.Polygon({
              paths: path.map((point) => ({ lat: point.lat, lng: point.lng })),
              strokeColor: isActive ? "#fb923c" : "#cbd5e1",
              strokeOpacity: 1,
              strokeWeight: isActive ? 3 : 2,
              fillColor: isActive ? "#fb923c" : "#94a3b8",
              fillOpacity: isActive ? 0.16 : 0.08,
            });
            polygon.setMap(map);
            overlays.push(polygon);
          }

          path.forEach((point, pointIndex) => {
            const marker = makeMarker(
              "#fb923c",
              "M",
              point,
              `Macro ${zoneIndex + 1}-${pointIndex + 1}`
            );
            marker.addListener("dragend", (event: any) => {
              onMoveMacroPoint(zoneIndex, pointIndex, {
                lat: Number(event.latLng.lat().toFixed(6)),
                lng: Number(event.latLng.lng().toFixed(6)),
              });
            });
            marker.addListener("click", () => onRemoveMacroPoint(zoneIndex, pointIndex));
            overlays.push(marker);
          });
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
      overlays.forEach((overlay) => {
        if (typeof overlay.setMap === "function") overlay.setMap(null);
        if (typeof overlay.remove === "function") overlay.remove();
      });
    };
  }, [
    activeMacroIndex,
    activeMode,
    center.lat,
    center.lng,
    containerId,
    macroZones,
    mapCenter,
    onAddMacroPoint,
    onAddPrimaryPoint,
    onMoveMacroPoint,
    onMovePrimaryPoint,
    onRemoveMacroPoint,
    onRemovePrimaryPoint,
    onSetCenter,
    primaryZone,
  ]);

  return (
    <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/80">
      <div className="border-b border-cyan-500/10 px-5 py-4 text-sm text-slate-300">
        Klik peta untuk menambah titik sesuai mode aktif. Marker bisa di-drag untuk
        memindahkan koordinat, lalu klik marker untuk menghapus titik yang salah.
      </div>
      <div className="h-[420px] w-full">
        {hasGoogleMapsApiKey() ? (
          <div id={containerId} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Google Maps API key belum tersedia di ERP.
          </div>
        )}
      </div>
    </div>
  );
}
