import { useEffect, useMemo, useState } from "react";
import { subscribeCTOSystemData } from "../services/ctoSystemService";
import {
    subscribeSummaryDoc,
    upsertCTOSystemSummary,
} from "../../shared/services/directorSummaryService";

const safeArray = (value: any) => (Array.isArray(value) ? value : []);
const safeNumber = (value: any) => Number(value || 0);
const safeString = (value: any) => String(value || "");
const safeBoolean = (value: any) => value === true;

const isDriver = (user: any) =>
    safeString(user?.role).toUpperCase() === "DRIVER";

const isCustomer = (user: any) =>
    safeString(user?.role).toUpperCase() === "CUSTOMER";

const isMerchant = (item: any) =>
    safeString(item?.role).toUpperCase() === "RESTAURANT";

const isOpenMerchant = (item: any) => {
    const isOpen = item?.isOpen ?? true;
    const isBanned = item?.isBanned === true;
    return isOpen && !isBanned;
};

const isActiveOrder = (order: any) => {
    const status = safeString(order?.status).toUpperCase();
    if (!status) return false;
    return !["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
};

const groupLogsByDay = (logs: any[]) => {
    const map = new Map<string, number>();

    logs.forEach((log) => {
        const raw = log?.createdAt;
        const date =
            typeof raw === "number"
                ? new Date(raw).toISOString().slice(0, 10)
                : "UNKNOWN";

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

const buildSystemHealth = (params: {
    errorCount: number;
    criticalAlerts: number;
    activeOrders: number;
    onlineDrivers: number;
}) => {
    const { errorCount, criticalAlerts, activeOrders, onlineDrivers } = params;

    if (criticalAlerts > 0) return "CRITICAL";
    if (errorCount > 20) return "UNSTABLE";
    if (activeOrders > 10 && onlineDrivers === 0) return "RISK";
    return "HEALTHY";
};

const buildDirectorHealth = (params: {
    unresolvedApprovals: number;
    pendingMeetingRequests: number;
    openExecutiveTasks: number;
    totalBackups: number;
}) => {
    const { unresolvedApprovals, pendingMeetingRequests, openExecutiveTasks, totalBackups } = params;

    if (totalBackups === 0) return "NO_BACKUP";
    if (pendingMeetingRequests > 5) return "QUEUE_BUILDUP";
    if (unresolvedApprovals > 12) return "BOTTLENECK";
    if (openExecutiveTasks > 10) return "BUSY";
    return "STABLE";
};

export const useCTODashboard = () => {
    const [raw, setRaw] = useState<any>(null);
    const [summaryDoc, setSummaryDoc] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        const unsubscribe = subscribeCTOSystemData((data) => {
            setRaw(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsub = subscribeSummaryDoc(
            "cto_system_summary",
            "current",
            setSummaryDoc
        );

        return () => unsub();
    }, []);

    const computedDashboard = useMemo(() => {
        if (!raw) return null;

        const users = safeArray(raw.users);
        const restaurants = safeArray(raw.restaurants);
        const orders = safeArray(raw.orders);
        const logs = safeArray(raw.systemLogs);
        const alerts = safeArray(raw.systemAlerts);
        const errors = safeArray(raw.systemErrors);
        const backups = safeArray(raw.backups);
        const banners = safeArray(raw.banners);
        const categories = safeArray(raw.categories);
        const menus = safeArray(raw.menus);
        const config = raw.config || null;
        const support = raw.support || null;
        const directorUsers = safeArray(raw.directorUsers);
        const approvalRequests = safeArray(raw.approvalRequests);
        const meetingAgendas = safeArray(raw.meetingAgendas);
        const meetingRequests = safeArray(raw.meetingRequests);
        const letters = safeArray(raw.letters);
        const executiveTasks = safeArray(raw.executiveTasks);
        const syncJobs = safeArray(raw.syncJobs);
        const reviews = safeArray(raw.reviews);
        const driverReviews = safeArray(raw.driverReviews);

        const drivers = users.filter(isDriver);
        const customers = users.filter(isCustomer);
        const merchantsFromUsers = users.filter(isMerchant);

        const onlineDrivers = drivers.filter((driver) => driver?.isOnline === true);
        const openMerchants = restaurants.filter(isOpenMerchant);
        const activeOrders = orders.filter(isActiveOrder);

        const unresolvedAlerts = alerts.filter((alert) => alert?.isResolved !== true);
        const criticalAlerts = unresolvedAlerts.filter(
            (alert) => safeString(alert?.severity).toUpperCase() === "CRITICAL"
        );

        const totalErrorCount = errors.reduce(
            (sum, item) => sum + safeNumber(item?.count || 1),
            0
        );

        const latestBackup = [...backups].sort(
            (a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt)
        )[0] || null;

        const unresolvedApprovals = approvalRequests.filter((item) => {
            const status = safeString(item?.status).toUpperCase();
            return status && !["APPROVED", "REJECTED", "COMPLETED"].includes(status);
        });

        const pendingMeetingRequests = meetingRequests.filter(
            (item) => safeString(item?.status).toUpperCase() === "PENDING"
        );

        const openExecutiveTasks = executiveTasks.filter((item) => {
            const status = safeString(item?.status).toUpperCase();
            return status && !["DONE", "COMPLETED", "CLOSED"].includes(status);
        });

        const settings = config?.settings || {};

        const trackedAppAccounts = users.filter((item) => {
            const role = safeString(item?.role).toUpperCase();
            return role === "DRIVER" || role === "RESTAURANT";
        });
        const targetVersion = safeString(settings?.updateVersion).trim();
        const adoptedAccounts = trackedAppAccounts.filter(
            (item) => safeString(item?.lastSeenVersion).trim() === targetVersion
        );
        const outdatedAccounts = trackedAppAccounts.filter((item) => {
            const version = safeString(item?.lastSeenVersion).trim();
            return !version || (targetVersion && version !== targetVersion);
        });
        const adoptionRate = trackedAppAccounts.length
            ? Math.round((adoptedAccounts.length / trackedAppAccounts.length) * 100)
            : 0;

        const healthStatus = buildSystemHealth({
            errorCount: totalErrorCount,
            criticalAlerts: criticalAlerts.length,
            activeOrders: activeOrders.length,
            onlineDrivers: onlineDrivers.length,
        });

        const activitySeries = groupLogsByDay(logs);
        const errorModuleSeries = groupErrorsByModule(errors);
        const directorHealthStatus = buildDirectorHealth({
            unresolvedApprovals: unresolvedApprovals.length,
            pendingMeetingRequests: pendingMeetingRequests.length,
            openExecutiveTasks: openExecutiveTasks.length,
            totalBackups: backups.length,
        });

        const latestLogs = [...logs]
            .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
            .slice(0, 20);

        const latestAlerts = [...alerts]
            .sort((a, b) => safeNumber(b?.createdAt) - safeNumber(a?.createdAt))
            .slice(0, 20);

        const latestErrors = [...errors]
            .sort((a, b) => safeNumber(b?.lastSeenAt) - safeNumber(a?.lastSeenAt))
            .slice(0, 20);

        const systemFlags = {
            maintenanceMode: safeBoolean(settings?.isMaintenance),
            enableApprovals: true,
            enableFinance: true,
            enableOrders: !safeBoolean(settings?.lockedRoles?.includes?.("CUSTOMER")),
            enableDriverRealtime: true,
            enableMerchantRegistration: !safeBoolean(settings?.lockedRoles?.includes?.("RESTAURANT")),
            enableExpansionAnalyzer: Array.isArray(config?.zone) && config.zone.length >= 3,
            enableNotifications: true,
        };

        const configSnapshot = {
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
        };

        return {
            summary: {
                totalUsers: users.length,
                totalCustomers: customers.length,
                totalDrivers: drivers.length,
                onlineDrivers: onlineDrivers.length,
                totalRestaurants: restaurants.length,
                totalMerchantsFromUsers: merchantsFromUsers.length,
                openMerchants: openMerchants.length,
                totalOrders: orders.length,
                activeOrders: activeOrders.length,
                totalLogs: logs.length,
                totalAlerts: alerts.length,
                unresolvedAlerts: unresolvedAlerts.length,
                criticalAlerts: criticalAlerts.length,
                totalErrors: errors.length,
                totalErrorCount,
                totalBackups: backups.length,
                totalBanners: banners.length,
                totalMenus: menus.length,
                totalCategories: categories.length,
                totalDirectorUsers: directorUsers.length,
                totalDirectorApprovals: approvalRequests.length,
                unresolvedDirectorApprovals: unresolvedApprovals.length,
                totalMeetingAgendas: meetingAgendas.length,
                pendingMeetingRequests: pendingMeetingRequests.length,
                totalLetters: letters.length,
                openExecutiveTasks: openExecutiveTasks.length,
                totalSyncJobs: syncJobs.length,
                totalRestaurantReviews: reviews.length,
                totalDriverReviews: driverReviews.length,
                totalChats: safeArray(raw.chats).length,
                totalNotifications: safeArray(raw.notifications).length,
                totalVoucherClaims: safeArray(raw.voucherClaims).length,
                totalShippingVouchers: safeArray(raw.shippingVouchers).length,
                trackedAppAccounts: trackedAppAccounts.length,
                adoptedAccounts: adoptedAccounts.length,
                outdatedAccounts: outdatedAccounts.length,
                appAdoptionRate: adoptionRate,
            },
            healthStatus,
            directorHealthStatus,
            latestBackup,
            systemFlags,
            configSnapshot,
            activitySeries,
            errorModuleSeries,
            latestLogs,
            latestAlerts,
            latestErrors,
            raw: {
                users,
                restaurants,
                orders,
                logs,
                alerts,
                errors,
                backups,
                banners,
                categories,
                menus,
                config,
                support,
                directorUsers,
                approvalRequests,
                meetingAgendas,
                meetingRequests,
                letters,
                executiveTasks,
                syncJobs,
                reviews,
                driverReviews,
                chats: safeArray(raw.chats),
                notifications: safeArray(raw.notifications),
                voucherClaims: safeArray(raw.voucherClaims),
                shippingVouchers: safeArray(raw.shippingVouchers),
                drivers,
                customers,
                merchantsFromUsers,
            },
        };
    }, [raw]);

    useEffect(() => {
        if (!computedDashboard) return;

        void upsertCTOSystemSummary({
            ...computedDashboard.summary,
            healthStatus: computedDashboard.healthStatus,
            directorHealthStatus: computedDashboard.directorHealthStatus,
            latestBackupStatus: computedDashboard.latestBackup?.status || "NONE",
            latestBackupAt: computedDashboard.latestBackup?.createdAt || null,
            maintenanceMode: computedDashboard.configSnapshot.maintenanceMode,
            supportOnline: computedDashboard.configSnapshot.supportOnline,
            supportReason: computedDashboard.configSnapshot.supportReason,
            trackedAppAccounts: computedDashboard.summary.trackedAppAccounts,
            adoptedAccounts: computedDashboard.summary.adoptedAccounts,
            outdatedAccounts: computedDashboard.summary.outdatedAccounts,
            appAdoptionRate: computedDashboard.summary.appAdoptionRate,
        });
    }, [computedDashboard]);

    const dashboard = useMemo(() => {
        if (!computedDashboard) return null;

        return {
            ...computedDashboard,
            summary: {
                ...computedDashboard.summary,
                ...(summaryDoc || {}),
            },
        };
    }, [computedDashboard, summaryDoc]);

    return {
        loading,
        raw,
        dashboard,
    };
};
