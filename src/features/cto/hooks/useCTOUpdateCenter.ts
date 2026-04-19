import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";
import {
  subscribeCTODashboardConfig,
  subscribeCTOTrackedAppUsers,
} from "../services/ctoDashboardFeedService";

const toTimeValue = (value: any) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const useCTOUpdateCenter = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeSummaryDoc("cto_system_summary", "current", (data) => {
        setSummaryDoc(data);
        setLoading(false);
      }),
      subscribeCTODashboardConfig(setConfig),
      subscribeCTOTrackedAppUsers(setUsers),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const dashboard = useMemo(() => {
    const configSnapshot = {
      updateVersion: String(config?.settings?.updateVersion || ""),
    };

    return {
      configSnapshot,
      summary: {
        trackedAppAccounts: Number(summaryDoc?.trackedAppAccounts || users.length),
        adoptedAccounts: Number(summaryDoc?.adoptedAccounts || 0),
        outdatedAccounts: Number(summaryDoc?.outdatedAccounts || 0),
        appAdoptionRate: Number(summaryDoc?.appAdoptionRate || 0),
      },
      raw: {
        users,
      },
    };
  }, [config, summaryDoc, users]);

  const release = dashboard?.configSnapshot?.updateVersion || "-";

  const updateData = useMemo(() => {
    const releaseVersion = dashboard?.configSnapshot?.updateVersion || "";
    const versionUsers = dashboard?.raw?.users || [];

    const adopted = versionUsers.filter(
      (item: any) =>
        releaseVersion &&
        String(item?.lastSeenVersion || "").trim() === String(releaseVersion).trim()
    );

    const outdated = versionUsers.filter((item: any) => {
      const lastSeenVersion = String(item?.lastSeenVersion || "").trim();
      return !lastSeenVersion || (releaseVersion && lastSeenVersion !== String(releaseVersion).trim());
    });

    const recentChecks = [...versionUsers]
      .filter((item: any) => toTimeValue(item?.lastUpdateCheck) > 0)
      .sort((a: any, b: any) => toTimeValue(b?.lastUpdateCheck) - toTimeValue(a?.lastUpdateCheck))
      .slice(0, 12);

    const byVersion = versionUsers.reduce((acc: Record<string, number>, item: any) => {
      const key = String(item?.lastSeenVersion || "UNKNOWN").trim() || "UNKNOWN";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const versionRows = Object.entries(byVersion)
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);

    const roleSegments = ["DRIVER", "RESTAURANT"].map((role) => {
      const items = versionUsers.filter(
        (item: any) => String(item?.role || "").toUpperCase() === role
      );
      const adoptedCount = items.filter(
        (item: any) =>
          releaseVersion &&
          String(item?.lastSeenVersion || "").trim() === String(releaseVersion).trim()
      ).length;
      const outdatedCount = items.filter((item: any) => {
        const version = String(item?.lastSeenVersion || "").trim();
        return !version || (releaseVersion && version !== String(releaseVersion).trim());
      }).length;

      return {
        role,
        total: items.length,
        adopted: adoptedCount,
        outdated: outdatedCount,
        adoptionRate: items.length ? Math.round((adoptedCount / items.length) * 100) : 0,
      };
    });

    const adoptionRate = versionUsers.length
      ? Math.round((adopted.length / versionUsers.length) * 100)
      : 0;

    return {
      totalTrackable: versionUsers.length,
      adopted,
      outdated,
      recentChecks,
      versionRows,
      roleSegments,
      adoptionRate,
    };
  }, [dashboard]);

  return {
    loading,
    dashboard,
    release,
    updateData,
  };
};
