import { useEffect, useState } from "react";

type NetworkState = {
  isOnline: boolean;
  effectiveType: string;
  downlinkMbps: number | null;
  rttMs: number | null;
  browserHealth: string;
};

const getConnection = () =>
  (navigator as Navigator & {
    connection?: {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
    };
  }).connection;

export const useCTONetworkHealth = () => {
  const initialConnection = getConnection();
  const [state, setState] = useState<NetworkState>({
    isOnline: navigator.onLine,
    effectiveType: initialConnection?.effectiveType || "unknown",
    downlinkMbps:
      typeof initialConnection?.downlink === "number"
        ? initialConnection.downlink
        : null,
    rttMs:
      typeof initialConnection?.rtt === "number" ? initialConnection.rtt : null,
    browserHealth: navigator.onLine ? "ONLINE" : "OFFLINE",
  });

  useEffect(() => {
    const update = () => {
      const connection = getConnection();
      const rttMs = typeof connection?.rtt === "number" ? connection.rtt : null;
      const isOnline = navigator.onLine;

      setState({
        isOnline,
        effectiveType: connection?.effectiveType || "unknown",
        downlinkMbps:
          typeof connection?.downlink === "number" ? connection.downlink : null,
        rttMs,
        browserHealth:
          !isOnline ? "OFFLINE" : rttMs !== null && rttMs > 400 ? "DEGRADED" : "ONLINE",
      });
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return state;
};
