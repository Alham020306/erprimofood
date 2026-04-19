import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { buildCEOExecutiveSnapshot } from "../../ceo/services/ceoIntelligenceEngine";
import { calculateCOOMetrics } from "../../coo/services/cooMetrics";
import { calculateCFOMetrics } from "../../cfo/services/cfoMetrics";
import {
  buildCampaignROI,
  buildCMODashboardSnapshot,
} from "../../cmo/services/cmoGrowthEngine";
import { buildHRDashboardSnapshot } from "../../hr/services/hrWorkforceEngine";
import { createAuditLog } from "./governanceCoreService";

type SummaryKey =
  | "executive_overview"
  | "coo_operational_summary"
  | "cfo_financial_summary"
  | "cto_system_summary"
  | "cmo_growth_summary"
  | "hr_people_summary";

type RefreshActor = {
  uid?: string;
  fullName?: string;
  primaryRole?: string;
};

export const DIRECTOR_SUMMARY_TARGETS: Record<
  SummaryKey,
  { collectionName: string; documentId: string; label: string }
> = {
  executive_overview: {
    collectionName: "executive_overview",
    documentId: "main",
    label: "CEO Executive Overview",
  },
  coo_operational_summary: {
    collectionName: "coo_operational_summary",
    documentId: "live",
    label: "COO Operational Summary",
  },
  cfo_financial_summary: {
    collectionName: "cfo_financial_summary",
    documentId: "current",
    label: "CFO Financial Summary",
  },
  cto_system_summary: {
    collectionName: "cto_system_summary",
    documentId: "current",
    label: "CTO System Summary",
  },
  cmo_growth_summary: {
    collectionName: "cmo_growth_summary",
    documentId: "current",
    label: "CMO Growth Summary",
  },
  hr_people_summary: {
    collectionName: "hr_people_summary",
    documentId: "current",
    label: "HR People Summary",
  },
};

export const subscribeSummaryDoc = (
  collectionName: string,
  documentId: string,
  callback: (data: any | null) => void
) =>
  onSnapshot(
    doc(dbCLevel, collectionName, documentId),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    () => callback(null)
  );

export const subscribeDirectorSyncState = (callback: (data: any | null) => void) =>
  onSnapshot(
    doc(dbCLevel, "sync_state", "current"),
    (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    },
    () => callback(null)
  );

const upsertSummaryDoc = async (
  collectionName: string,
  documentId: string,
  payload: Record<string, unknown>
) => {
  await setDoc(
    doc(dbCLevel, collectionName, documentId),
    {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

const recordSummaryRefresh = async (
  summaryKey: SummaryKey,
  actor: RefreshActor,
  metadata: Record<string, unknown> = {}
) => {
  const now = Date.now();
  const target = DIRECTOR_SUMMARY_TARGETS[summaryKey];

  await setDoc(
    doc(dbCLevel, "sync_state", "current"),
    {
      lastSummaryRefreshAt: now,
      lastSummaryRefreshByUid: actor.uid || "",
      lastSummaryRefreshByName: actor.fullName || "Unknown",
      lastSummaryRefreshByRole: actor.primaryRole || "CTO",
      summaries: {
        [summaryKey]: {
          status: "SUCCESS",
          refreshedAt: now,
          refreshedByUid: actor.uid || "",
          refreshedByName: actor.fullName || "Unknown",
          refreshedByRole: actor.primaryRole || "CTO",
          collectionName: target.collectionName,
          documentId: target.documentId,
          ...metadata,
        },
      },
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );

  await addDoc(collection(dbCLevel, "sync_jobs"), {
    jobType: "SUMMARY_REFRESH",
    targetSummary: summaryKey,
    status: "SUCCESS",
    source: "direksi",
    triggeredByUid: actor.uid || "",
    triggeredByName: actor.fullName || "Unknown",
    triggeredByRole: actor.primaryRole || "CTO",
    relatedEntityType: target.collectionName,
    relatedEntityId: target.documentId,
    notes: `Manual refresh executed for ${target.label}.`,
    createdAt: now,
    createdAtServer: serverTimestamp(),
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });

  await createAuditLog({
    actorUid: actor.uid || "",
    actorRole: actor.primaryRole || "CTO",
    action: "SUMMARY_REFRESHED",
    entityType: target.collectionName,
    entityId: target.documentId,
    after: {
      summaryKey,
      refreshedAt: now,
      ...metadata,
    },
  });
};

const fetchOperationalLedger = async () => {
  const snap = await getDocs(collection(dbMain, "operational_ledger"));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

const fetchCMOCampaigns = async () => {
  const snap = await getDocs(collection(dbCLevel, "cmo_campaigns"));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
};

export const upsertExecutiveOverviewSummary = async (
  payload: Record<string, unknown>
) => upsertSummaryDoc("executive_overview", "main", payload);

export const upsertCOOOperationalSummary = async (
  payload: Record<string, unknown>
) => upsertSummaryDoc("coo_operational_summary", "live", payload);

export const upsertCFOFinancialSummary = async (
  payload: Record<string, unknown>
) => upsertSummaryDoc("cfo_financial_summary", "current", payload);

export const upsertCTOSystemSummary = async (
  payload: Record<string, unknown>
) => upsertSummaryDoc("cto_system_summary", "current", payload);

export const upsertCMOGrowthSummary = async (
  payload: Record<string, unknown>
) => upsertSummaryDoc("cmo_growth_summary", "current", payload);

export const upsertHRPeopleSummary = async (
  payload: Record<string, unknown>
) => upsertSummaryDoc("hr_people_summary", "current", payload);

export const refreshExecutiveOverviewSummary = async (
  raw: Record<string, unknown>,
  actor: RefreshActor
) => {
  const payload = buildCEOExecutiveSnapshot(raw);
  await upsertExecutiveOverviewSummary(payload);
  await recordSummaryRefresh("executive_overview", actor, {
    totalOrders: payload.totalOrders,
    totalRevenue: payload.totalRevenue,
    alertCount: Array.isArray(payload.alerts) ? payload.alerts.length : 0,
  });
  return payload;
};

export const refreshCOOOperationalSummary = async (
  raw: Record<string, unknown>,
  actor: RefreshActor
) => {
  const payload = calculateCOOMetrics(raw);
  await upsertCOOOperationalSummary({
    totalMerchants: payload.totalMerchants,
    activeMerchants: payload.activeMerchants,
    totalDrivers: payload.totalDrivers,
    activeDrivers: payload.activeDrivers,
    offlineDrivers: payload.offlineDrivers,
    activeOrders: payload.activeOrders,
    totalOrders: payload.totalOrders,
    completedOrders: payload.completedOrders,
    cancelledOrders: payload.cancelledOrders,
    totalReviews: payload.totalReviews,
    totalDriverReviews: payload.totalDriverReviews,
    incidentCount: payload.incidents.length,
    incidents: payload.incidents,
  });
  await recordSummaryRefresh("coo_operational_summary", actor, {
    totalOrders: payload.totalOrders,
    incidentCount: payload.incidents.length,
  });
  return payload;
};

export const refreshCFOFinancialSummary = async (
  raw: Record<string, unknown>,
  actor: RefreshActor
) => {
  const operationalLedger = await fetchOperationalLedger();
  const computed = calculateCFOMetrics({ ...raw, operationalLedger });

  await upsertCFOFinancialSummary({
    ...computed.summary,
    financeAlerts: computed.financeAlerts,
    topExpenseCount: computed.topExpenses.length,
    latestTransactionCount: computed.latestTransactions.length,
    topRestaurantExposure: computed.topRestaurantExposure,
    topDriverExposure: computed.topDriverExposure,
    orderStatusSummary: computed.orderStatusSummary,
  });

  await recordSummaryRefresh("cfo_financial_summary", actor, {
    totalTransactions: computed.summary.totalTransactions,
    totalOrders: computed.summary.totalOrders,
  });

  return computed;
};

export const refreshCTOSystemSummary = async (
  payload: Record<string, unknown>,
  actor: RefreshActor
) => {
  await upsertCTOSystemSummary(payload);
  await recordSummaryRefresh("cto_system_summary", actor, {
    unresolvedAlerts: payload.unresolvedAlerts || 0,
    totalErrors: payload.totalErrors || 0,
  });
};

export const refreshCMOGrowthSummary = async (
  raw: Record<string, unknown>,
  actor: RefreshActor
) => {
  const payload = buildCMODashboardSnapshot(raw);
  const campaigns = await fetchCMOCampaigns();
  const campaignROI = buildCampaignROI(campaigns, raw);

  await upsertCMOGrowthSummary(payload);
  await upsertCMOGrowthSummary({
    campaignROI,
  });
  await recordSummaryRefresh("cmo_growth_summary", actor, {
    totalMenus: payload.totalMenus,
    totalCategories: payload.totalCategories,
    areaCount: Array.isArray(payload.areaGrowth) ? payload.areaGrowth.length : 0,
    campaignCount: campaigns.length,
  });
  return {
    ...payload,
    campaignROI,
  };
};

export const refreshHRPeopleSummary = async (
  raw: Record<string, unknown>,
  actor: RefreshActor
) => {
  const payload = buildHRDashboardSnapshot(raw);
  await upsertHRPeopleSummary(payload);
  await recordSummaryRefresh("hr_people_summary", actor, {
    totalDrivers: payload.totalDrivers,
    totalEmployees: payload.totalEmployees,
    workforceAreas: Array.isArray(payload.workforceDemand)
      ? payload.workforceDemand.length
      : 0,
  });
  return payload;
};
