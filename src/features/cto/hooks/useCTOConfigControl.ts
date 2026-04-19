import { useEffect, useMemo, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { authCLevel } from "../../../core/firebase/firebaseCLevel";
import { useCTOExecutiveDashboard } from "./useCTOExecutiveDashboard";
import {
  createBackupRecord,
  upsertSystemSupport,
  upsertSystemConfig,
} from "../services/ctoSystemService";
import {
  DIRECTOR_SUMMARY_TARGETS,
  refreshCFOFinancialSummary,
  refreshCMOGrowthSummary,
  refreshCOOOperationalSummary,
  refreshCTOSystemSummary,
  refreshExecutiveOverviewSummary,
  refreshHRPeopleSummary,
  subscribeDirectorSyncState,
  subscribeSummaryDoc,
} from "../../shared/services/directorSummaryService";
import {
  fetchCTOExportSnapshotSource,
  fetchCTOSummaryRefreshSource,
  subscribeCTODashboardConfig,
} from "../services/ctoDashboardFeedService";

type Params = {
  user: any;
};

type SummaryKey = keyof typeof DIRECTOR_SUMMARY_TARGETS;

export const useCTOConfigControl = ({ user }: Params) => {
  const { loading, dashboard } = useCTOExecutiveDashboard();
  const [rawConfig, setRawConfig] = useState<any | null>(null);
  const [summarySnapshots, setSummarySnapshots] = useState<
    Partial<Record<SummaryKey, any>>
  >({});
  const [syncState, setSyncState] = useState<any | null>(null);
  const [refreshingSummary, setRefreshingSummary] = useState<SummaryKey | "all" | "">("");

  useEffect(() => {
    const unsubConfig = subscribeCTODashboardConfig(setRawConfig);
    const unsubscribers = (Object.entries(DIRECTOR_SUMMARY_TARGETS) as Array<
      [SummaryKey, (typeof DIRECTOR_SUMMARY_TARGETS)[SummaryKey]]
    >).map(([summaryKey, target]) =>
      subscribeSummaryDoc(target.collectionName, target.documentId, (data) => {
        setSummarySnapshots((prev) => ({
          ...prev,
          [summaryKey]: data,
        }));
      })
    );

    const unsubSync = subscribeDirectorSyncState(setSyncState);

    return () => {
      unsubConfig();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      unsubSync();
    };
  }, []);

  const systemFlags = useMemo(
    () =>
      dashboard?.systemFlags || {
        maintenanceMode: false,
        enableApprovals: true,
        enableFinance: true,
        enableOrders: true,
        enableDriverRealtime: true,
        enableMerchantRegistration: true,
        enableExpansionAnalyzer: true,
        enableNotifications: true,
      },
    [dashboard]
  );

  const configSnapshot = useMemo(
    () =>
      dashboard?.configSnapshot || {
        maintenanceMode: false,
        botEnabled: false,
        updateAvailable: false,
        updateVersion: "",
        updateLink: "",
        lockedRoles: [],
        maintenanceTitle: "",
        maintenanceMessage: "",
        maintenanceETC: "",
        baseDeliveryFee: 0,
        baseDistanceKm: 0,
        pricePerKm: 0,
        serviceFeePercent: 0,
        reservationServiceFee: 0,
        driverCommissionPercent: 0,
        adminEarnings: 0,
        center: { lat: 0, lng: 0 },
        zone: [],
        zones: [],
        contact: {},
        supportOnline: false,
        supportReason: "",
      },
    [dashboard]
  );

  const saveConfig = async (nextFlags: typeof systemFlags) => {
    await upsertSystemConfig({
      settings: {
        ...(rawConfig?.settings || {}),
        isMaintenance: nextFlags.maintenanceMode,
        lockedRoles: [
          ...(nextFlags.enableOrders === false ? ["CUSTOMER"] : []),
          ...(nextFlags.enableMerchantRegistration === false ? ["RESTAURANT"] : []),
        ],
      },
      updatedByUid: user?.uid || "",
    });
  };

  const saveOperationalConfig = async (payload: {
    settings: Record<string, unknown>;
    contact: Record<string, unknown>;
  }) => {
    await upsertSystemConfig({
      settings: {
        ...(rawConfig?.settings || {}),
        ...payload.settings,
      },
      contact: {
        ...(rawConfig?.contact || {}),
        ...payload.contact,
      },
      updatedByUid: user?.uid || "",
      updatedByName: user?.fullName || "Unknown",
      updatedByRole: user?.primaryRole || "CTO",
    });
  };

  const saveSupport = async (payload: { isOnline: boolean; reason: string }) => {
    await upsertSystemSupport(payload);
  };

  const saveZoneConfig = async (payload: {
    center: { lat: number; lng: number };
    zone: Array<{ lat: number; lng: number }>;
    zones: any[];
    password: string;
  }) => {
    const currentUser = authCLevel.currentUser;

    if (!currentUser?.email) {
      throw new Error("Sesi CTO tidak ditemukan. Silakan login ulang.");
    }

    const credential = EmailAuthProvider.credential(
      currentUser.email,
      payload.password
    );

    await reauthenticateWithCredential(currentUser, credential);

    await upsertSystemConfig({
      settings: {
        ...(rawConfig?.settings || {}),
        center: payload.center,
      },
      zone: payload.zone,
      zones: payload.zones,
      updatedByUid: user?.uid || "",
      updatedByName: user?.fullName || "Unknown",
      updatedByRole: user?.primaryRole || "CTO",
    });
  };

  const triggerBackup = async (
    scope: "MAIN_DB" | "C_LEVEL_DB" | "STORAGE" | "FULL"
  ) => {
    await createBackupRecord({
      backupType: "MANUAL",
      status: "SUCCESS",
      scope,
      triggeredByUid: user?.uid || "",
      triggeredByName: user?.fullName || "Unknown",
      triggeredByRole: user?.primaryRole || "CTO",
      notes: `Manual backup initiated from CTO control for ${scope}.`,
    });
  };

  const runSummaryRefresh = async (summaryKey: SummaryKey) => {
    const raw = await fetchCTOSummaryRefreshSource();
    const actor = {
      uid: user?.uid || "",
      fullName: user?.fullName || "Unknown",
      primaryRole: user?.primaryRole || "CTO",
    };

    if (!Object.keys(raw).length) {
      throw new Error("Sumber data summary belum siap. Tunggu dashboard selesai memuat.");
    }
    if (summaryKey === "executive_overview") {
      await refreshExecutiveOverviewSummary(raw, actor);
      return;
    }

    if (summaryKey === "coo_operational_summary") {
      await refreshCOOOperationalSummary(raw, actor);
      return;
    }

    if (summaryKey === "cfo_financial_summary") {
      await refreshCFOFinancialSummary(raw, actor);
      return;
    }

    if (summaryKey === "cto_system_summary") {
      await refreshCTOSystemSummary(
        {
          ...dashboard?.summary,
          healthStatus: dashboard?.healthStatus || "UNKNOWN",
          directorHealthStatus: dashboard?.directorHealthStatus || "UNKNOWN",
          latestBackupStatus: dashboard?.latestBackup?.status || "NONE",
          latestBackupAt: dashboard?.latestBackup?.createdAt || null,
          maintenanceMode: dashboard?.configSnapshot?.maintenanceMode || false,
          supportOnline: dashboard?.configSnapshot?.supportOnline || false,
          supportReason: dashboard?.configSnapshot?.supportReason || "",
        },
        actor
      );
      return;
    }

    if (summaryKey === "cmo_growth_summary") {
      await refreshCMOGrowthSummary(raw, actor);
      return;
    }

    await refreshHRPeopleSummary(raw, actor);
  };

  const refreshSummary = async (summaryKey: SummaryKey) => {
    setRefreshingSummary(summaryKey);
    try {
      await runSummaryRefresh(summaryKey);
    } finally {
      setRefreshingSummary("");
    }
  };

  const refreshAllSummaries = async () => {
    setRefreshingSummary("all");
    try {
      const summaryKeys = Object.keys(DIRECTOR_SUMMARY_TARGETS) as SummaryKey[];
      for (const summaryKey of summaryKeys) {
        await runSummaryRefresh(summaryKey);
      }
    } finally {
      setRefreshingSummary("");
    }
  };

  return {
    loading,
    dashboard,
    systemFlags,
    configSnapshot,
    saveConfig,
    saveOperationalConfig,
    saveSupport,
    saveZoneConfig,
    triggerBackup,
    summarySnapshots,
    syncState,
    refreshingSummary,
    refreshSummary,
    refreshAllSummaries,
  };
};
