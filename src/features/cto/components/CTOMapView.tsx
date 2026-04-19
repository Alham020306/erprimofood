import { useEffect } from "react";
import {
  hasGoogleMapsApiKey,
  loadGoogleMaps,
} from "../../shared/utils/googleMapsLoader";

type Props = {
  mapCenter: { lat: number; lng: number };
  zonePolygon: { lat: number; lng: number }[];
  merchantMarkers: any[];
  driverMarkers: any[];
  zoneMarkers: any[];
  mainZoneInsight: any;
  onSelect: (item: any) => void;
};

const merchantColor = (item: any) => {
  if (!item.insideZone) return "#f97316";
  if (!item.isOperational) return "#ef4444";
  return "#34d399";
};

const driverColor = (item: any) => {
  if (!item.insideZone) return "#f97316";
  if (!item.isOnline) return "#94a3b8";
  if (item.freshness === "STALE") return "#f59e0b";
  if (item.freshness === "OFFLINE_SIGNAL") return "#ef4444";
  return "#22d3ee";
};

const zoneColor = (status: string) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "NEED_DRIVER") return "#f59e0b";
  if (normalized === "NEED_MERCHANT") return "#f97316";
  if (normalized === "LOW_ACTIVITY") return "#64748b";
  return "#22c55e";
};

const formatRupiah = (value: number | null | undefined) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

export default function CTOMapView({
  mapCenter,
  zonePolygon,
  merchantMarkers,
  driverMarkers,
  zoneMarkers,
  mainZoneInsight,
  onSelect,
}: Props) {
  const containerId = "cto-map-monitor-google-map";

  useEffect(() => {
    let cancelled = false;
    const overlays: any[] = [];

    loadGoogleMaps()
      .then((google) => {
        if (!google || cancelled) return;

        const element = document.getElementById(containerId);
        if (!element) return;

        const map = new google.maps.Map(element, {
          center: { lat: mapCenter.lat, lng: mapCenter.lng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        if (zonePolygon.length >= 3) {
          const polygon = new google.maps.Polygon({
            paths: zonePolygon.map((p) => ({ lat: p.lat, lng: p.lng })),
            strokeColor: "#f97316",
            strokeOpacity: 1,
            strokeWeight: 3,
            fillColor: "#fb923c",
            fillOpacity: 0.12,
          });
          polygon.setMap(map);
          polygon.addListener("click", () => onSelect(mainZoneInsight));
          overlays.push(polygon);
        }

        merchantMarkers.forEach((item) => {
          const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map,
            title: item.name ?? "Merchant",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: merchantColor(item),
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 9,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="min-width:220px;font-family:Arial,sans-serif;">
                <div style="font-weight:700;font-size:14px;">${item.name ?? "-"}</div>
                <div style="margin-top:4px;font-size:12px;color:#475569;">${
                  item.area ?? "Operational area belum diisi"
                }</div>
                <div style="margin-top:10px;font-size:12px;line-height:1.6;">
                  <div>Owner: <b>${item.ownerName ?? item.ownerId ?? "-"}</b></div>
                  <div>Phone: <b>${item.phone ?? "-"}</b></div>
                  <div>Status: <b>${item.isOperational ? "Operational" : "Inactive"}</b></div>
                  <div>Open: <b>${item.isOpen ? "Yes" : "No"}</b></div>
                  <div>Verified: <b>${item.isVerified ? "Yes" : "No"}</b></div>
                  <div>Zone: <b>${item.insideZone ? "Inside" : "Outside"}</b></div>
                  <div>Orders: <b>${item.totalOrders ?? 0}</b></div>
                  <div>Rating: <b>${item.rating ?? 0}</b></div>
                  <div>Balance: <b>${formatRupiah(item.balance)}</b></div>
                </div>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open({ anchor: marker, map });
            onSelect(item);
          });

          overlays.push(marker, infoWindow);
        });

        driverMarkers.forEach((item) => {
          const marker = new google.maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map,
            title: item.name ?? "Driver",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: driverColor(item),
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 8,
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="min-width:220px;font-family:Arial,sans-serif;">
                <div style="font-weight:700;font-size:14px;">${item.name ?? "-"}</div>
                <div style="margin-top:4px;font-size:12px;color:#475569;">${
                  item.area ?? "Operational area belum diisi"
                }</div>
                <div style="margin-top:10px;font-size:12px;line-height:1.6;">
                  <div>Phone: <b>${item.phone ?? "-"}</b></div>
                  <div>Email: <b>${item.email ?? "-"}</b></div>
                  <div>Status: <b>${item.isOnline ? "Online" : "Offline"}</b></div>
                  <div>Verified: <b>${item.isVerified ? "Yes" : "No"}</b></div>
                  <div>Freshness: <b>${item.freshness ?? "-"}</b></div>
                  <div>Zone: <b>${item.insideZone ? "Inside" : "Outside"}</b></div>
                  <div>Vehicle: <b>${item.vehicleBrand ?? "-"}</b></div>
                  <div>Plate: <b>${item.plateNumber ?? "-"}</b></div>
                  <div>Moving: <b>${item.isMoving ? "Yes" : "No"}</b></div>
                  <div>Speed: <b>${item.speed ?? 0} km/h</b></div>
                </div>
              </div>
            `,
          });

          marker.addListener("click", () => {
            infoWindow.open({ anchor: marker, map });
            onSelect(item);
          });

          overlays.push(marker, infoWindow);
        });

        zoneMarkers
          .filter((item) => item.centerLat && item.centerLng)
          .forEach((item) => {
            const marker = new google.maps.Marker({
              position: { lat: item.centerLat, lng: item.centerLng },
              map,
              title: item.area ?? "Zone",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: zoneColor(item.status),
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
                scale: 8,
              },
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="min-width:190px;font-family:Arial,sans-serif;">
                  <div style="font-weight:700;font-size:14px;">${item.area}</div>
                  <div style="margin-top:10px;font-size:12px;line-height:1.6;">
                    <div>Type: <b>Zone</b></div>
                    <div>Status: <b>${item.status}</b></div>
                    <div>Merchants: <b>${item.openMerchants ?? 0}/${item.totalMerchants ?? 0}</b></div>
                    <div>Drivers: <b>${item.onlineDrivers ?? 0}/${item.totalDrivers ?? 0}</b></div>
                    <div>Orders: <b>${item.totalOrders ?? 0}</b></div>
                    <div>Restaurant list: <b>${item.merchants?.length ?? 0}</b></div>
                  </div>
                </div>
              `,
            });

            marker.addListener("click", () => {
              infoWindow.open({ anchor: marker, map });
              onSelect(item);
            });

            overlays.push(marker, infoWindow);
          });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
      overlays.forEach((overlay) => {
        if (typeof overlay.setMap === "function") overlay.setMap(null);
        if (typeof overlay.close === "function") overlay.close();
      });
    };
  }, [
    containerId,
    driverMarkers,
    mainZoneInsight,
    mapCenter.lat,
    mapCenter.lng,
    merchantMarkers,
    onSelect,
    zoneMarkers,
    zonePolygon,
  ]);

  return (
    <div className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/90 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
      <div className="h-[620px] w-full">
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
