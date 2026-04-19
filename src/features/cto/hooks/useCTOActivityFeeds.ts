import { useEffect, useMemo, useState } from "react";
import {
  subscribeCTODashboardAlerts,
  subscribeCTODashboardErrors,
  subscribeCTODashboardLogs,
} from "../services/ctoDashboardFeedService";

const safeNumber = (value: any) => Number(value || 0);

export const useCTOActivityFeeds = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let initialized = false;
    const markReady = () => {
      if (!initialized) {
        initialized = true;
        setLoading(false);
      }
    };

    const unsubs = [
      subscribeCTODashboardLogs((rows) => {
        setLogs(rows);
        markReady();
      }),
      subscribeCTODashboardAlerts((rows) => {
        setAlerts(rows);
        markReady();
      }),
      subscribeCTODashboardErrors((rows) => {
        setErrors(rows);
        markReady();
      }),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const latestLogs = useMemo(
    () =>
      [...logs]
        .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
        .slice(0, 50),
    [logs]
  );

  const latestAlerts = useMemo(
    () =>
      [...alerts]
        .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
        .slice(0, 50),
    [alerts]
  );

  const latestErrors = useMemo(
    () =>
      [...errors]
        .sort((a, b) => safeNumber(b?.lastSeenAt) - safeNumber(a?.lastSeenAt))
        .slice(0, 50),
    [errors]
  );

  return {
    loading,
    latestLogs,
    latestAlerts,
    latestErrors,
  };
};
