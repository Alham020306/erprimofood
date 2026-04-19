import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";
import {
  subscribeCTODashboardAlerts,
  subscribeCTODashboardBackups,
  subscribeCTODashboardConfig,
  subscribeCTODashboardErrors,
  subscribeCTODashboardLogs,
  subscribeCTODashboardSupport,
} from "../services/ctoDashboardFeedService";

const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");
const safeBoolean = (value: any) => value === true;

const groupLogsByDay = (logs: any[]) => {
  const map = new Map<string, number>();

  logs.forEach((log) => {
    const raw = log?.createdAt;
    const date =
      typeof raw === "number" ? new Date(raw).toISOString().slice(0, 10) : "UNKNOWN";

    map.set(date, (map.get(date) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const groupErrorsByModule = (errors: any[]) => {
  const map = new Map<string, number>();

  errors.forEach((item) => {
    const module = safeString(item?.module) || "UNKNOWN";
    const count = safeNumber(item?.count || 1);
    map.set(module, (map.get(module) || 0) + count);
  });

  return Array.from(map.entries())
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count);
};

export const useCTOExecutiveDashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [config, setConfig] = useState<any | null>(null);
  const [support, setSupport] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeSummaryDoc("cto_system_summary", "current", (data) => {
        setSummaryDoc(data);
        setLoading(false);
      }),
      subscribeCTODashboardConfig(setConfig),
      subscribeCTODashboardSupport(setSupport),
      subscribeCTODashboardLogs(setLogs),
      subscribeCTODashboardAlerts(setAlerts),
      subscribeCTODashboardErrors(setErrors),
      subscribeCTODashboardBackups(setBackups),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const dashboard = useMemo(() => {
    if (!summaryDoc) return null;

    const settings = config?.settings || {};
    const latestBackup =
      [...backups].sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))[0] ||
      null;

    return {
      summary: {
        totalUsers: safeNumber(summaryDoc.totalUsers),
        totalCustomers: safeNumber(summaryDoc.totalCustomers),
        totalDrivers: safeNumber(summaryDoc.totalDrivers),
        onlineDrivers: safeNumber(summaryDoc.onlineDrivers),
        totalRestaurants: safeNumber(summaryDoc.totalRestaurants),
        totalMerchantsFromUsers: safeNumber(summaryDoc.totalMerchantsFromUsers),
        openMerchants: safeNumber(summaryDoc.openMerchants),
        totalOrders: safeNumber(summaryDoc.totalOrders),
        activeOrders: safeNumber(summaryDoc.activeOrders),
        totalLogs: safeNumber(summaryDoc.totalLogs),
        totalAlerts: safeNumber(summaryDoc.totalAlerts),
        unresolvedAlerts: safeNumber(summaryDoc.unresolvedAlerts),
        criticalAlerts: safeNumber(summaryDoc.criticalAlerts),
        totalErrors: safeNumber(summaryDoc.totalErrors),
        totalErrorCount: safeNumber(summaryDoc.totalErrorCount),
        totalBackups: safeNumber(summaryDoc.totalBackups),
        totalBanners: safeNumber(summaryDoc.totalBanners),
        totalMenus: safeNumber(summaryDoc.totalMenus),
        totalCategories: safeNumber(summaryDoc.totalCategories),
        totalDirectorUsers: safeNumber(summaryDoc.totalDirectorUsers),
        totalDirectorApprovals: safeNumber(summaryDoc.totalDirectorApprovals),
        unresolvedDirectorApprovals: safeNumber(summaryDoc.unresolvedDirectorApprovals),
        totalMeetingAgendas: safeNumber(summaryDoc.totalMeetingAgendas),
        pendingMeetingRequests: safeNumber(summaryDoc.pendingMeetingRequests),
        totalLetters: safeNumber(summaryDoc.totalLetters),
        openExecutiveTasks: safeNumber(summaryDoc.openExecutiveTasks),
        totalSyncJobs: safeNumber(summaryDoc.totalSyncJobs),
        totalRestaurantReviews: safeNumber(summaryDoc.totalRestaurantReviews),
        totalDriverReviews: safeNumber(summaryDoc.totalDriverReviews),
        totalChats: safeNumber(summaryDoc.totalChats),
        totalNotifications: safeNumber(summaryDoc.totalNotifications),
        totalVoucherClaims: safeNumber(summaryDoc.totalVoucherClaims),
        totalShippingVouchers: safeNumber(summaryDoc.totalShippingVouchers),
        trackedAppAccounts: safeNumber(summaryDoc.trackedAppAccounts),
        adoptedAccounts: safeNumber(summaryDoc.adoptedAccounts),
        outdatedAccounts: safeNumber(summaryDoc.outdatedAccounts),
        appAdoptionRate: safeNumber(summaryDoc.appAdoptionRate),
      },
      healthStatus: safeString(summaryDoc.healthStatus) || "UNKNOWN",
      directorHealthStatus: safeString(summaryDoc.directorHealthStatus) || "UNKNOWN",
      latestBackup,
      systemFlags: {
        maintenanceMode: safeBoolean(settings?.isMaintenance),
        enableApprovals: true,
        enableFinance: true,
        enableOrders: !safeArray(settings?.lockedRoles).includes("CUSTOMER"),
        enableDriverRealtime: true,
        enableMerchantRegistration: !safeArray(settings?.lockedRoles).includes(
          "RESTAURANT"
        ),
        enableExpansionAnalyzer: Array.isArray(config?.zone) && config.zone.length >= 3,
        enableNotifications: true,
      },
      configSnapshot: {
        maintenanceMode: safeBoolean(settings?.isMaintenance),
        botEnabled: safeBoolean(settings?.isRimoBotEnabled),
        updateAvailable: safeBoolean(settings?.updateAvailable),
        updateVersion: safeString(settings?.updateVersion),
        updateLink: safeString(settings?.updateLink),
        lockedRoles: safeArray(settings?.lockedRoles),
        maintenanceTitle: safeString(settings?.maintenanceTitle),
        maintenanceMessage: safeString(settings?.maintenanceMessage),
        maintenanceETC: safeString(settings?.maintenanceETC),
        baseDeliveryFee: safeNumber(settings?.baseDeliveryFee),
        baseDistanceKm: safeNumber(settings?.baseDistanceKm),
        pricePerKm: safeNumber(settings?.pricePerKm),
        serviceFeePercent: safeNumber(settings?.serviceFeePercent),
        reservationServiceFee: safeNumber(settings?.reservationServiceFee),
        driverCommissionPercent: safeNumber(settings?.driverCommissionPercent),
        adminEarnings: safeNumber(settings?.adminEarnings),
        center: settings?.center || { lat: 0, lng: 0 },
        zone: safeArray(config?.zone),
        zones: safeArray(config?.zones),
        contact: config?.contact || {},
        supportOnline: support?.isOnline === true,
        supportReason: safeString(support?.reason),
      },
      activitySeries: groupLogsByDay(logs),
      errorModuleSeries: groupErrorsByModule(errors),
      latestLogs: [...logs]
        .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
        .slice(0, 20),
      latestAlerts: [...alerts]
        .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
        .slice(0, 20),
      latestErrors: [...errors]
        .sort((a, b) => safeNumber(b?.lastSeenAt) - safeNumber(a?.lastSeenAt))
        .slice(0, 20),
    };
  }, [alerts, backups, config, errors, logs, summaryDoc, support]);

  return {
    loading,
    dashboard,
  };
};
