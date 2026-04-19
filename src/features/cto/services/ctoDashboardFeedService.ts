import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";

const mapDocs = (snap: any) =>
  snap.docs.map((item: any) => ({
    id: item.id,
    ...item.data(),
  }));

export const subscribeCTODashboardConfig = (callback: (data: any | null) => void) =>
  onSnapshot(
    doc(dbMain, "system", "config"),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => callback(null)
  );

export const subscribeCTODashboardSupport = (
  callback: (data: any | null) => void
) =>
  onSnapshot(
    doc(dbMain, "system", "support"),
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    () => callback(null)
  );

export const subscribeCTODashboardLogs = (callback: (rows: any[]) => void) =>
  onSnapshot(
    query(collection(dbCLevel, "system_logs"), orderBy("createdAt", "desc"), limit(80)),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCTODashboardAlerts = (callback: (rows: any[]) => void) =>
  onSnapshot(
    query(
      collection(dbCLevel, "system_alerts"),
      orderBy("createdAt", "desc"),
      limit(60)
    ),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCTODashboardErrors = (callback: (rows: any[]) => void) =>
  onSnapshot(
    query(
      collection(dbCLevel, "system_errors"),
      orderBy("lastSeenAt", "desc"),
      limit(60)
    ),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCTODashboardBackups = (callback: (rows: any[]) => void) =>
  onSnapshot(
    query(
      collection(dbCLevel, "system_backups"),
      orderBy("createdAt", "desc"),
      limit(20)
    ),
    (snap) => callback(mapDocs(snap)),
    () => callback([])
  );

export const subscribeCTOTrackedAppUsers = (callback: (rows: any[]) => void) =>
  onSnapshot(
    collection(dbMain, "users"),
    (snap) => {
      const rows = mapDocs(snap).filter((item: any) => {
        const role = String(item?.role || "").toUpperCase();
        return role === "DRIVER" || role === "RESTAURANT";
      });
      callback(rows);
    },
    () => callback([])
  );

const fetchCollectionRows = async (database: any, collectionName: string) => {
  const snap = await getDocs(collection(database, collectionName));
  return mapDocs(snap);
};

const fetchSingletonDoc = async (database: any, collectionName: string, documentId: string) => {
  const snap = await getDoc(doc(database, collectionName, documentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const fetchCTOSummaryRefreshSource = async () => {
  const [users, restaurants, orders, reviews, driverReviews, config, support] =
    await Promise.all([
      fetchCollectionRows(dbMain, "users"),
      fetchCollectionRows(dbMain, "restaurants"),
      fetchCollectionRows(dbMain, "orders"),
      fetchCollectionRows(dbMain, "reviews"),
      fetchCollectionRows(dbMain, "driver_reviews"),
      fetchSingletonDoc(dbMain, "system", "config"),
      fetchSingletonDoc(dbMain, "system", "support"),
    ]);

  return {
    users,
    restaurants,
    orders,
    reviews,
    driverReviews,
    config,
    support,
  };
};

export const fetchCTOExportSnapshotSource = async () => {
  const [
    summaryRaw,
    banners,
    categories,
    menus,
    directorUsers,
    approvalRequests,
    meetingAgendas,
    meetingRequests,
    letters,
    executiveTasks,
    syncJobs,
    systemLogs,
    systemAlerts,
    systemErrors,
    systemBackups,
    chats,
    notifications,
    voucherClaims,
    shippingVouchers,
  ] = await Promise.all([
    fetchCTOSummaryRefreshSource(),
    fetchCollectionRows(dbMain, "banners"),
    fetchCollectionRows(dbMain, "categories"),
    fetchCollectionRows(dbMain, "menus"),
    fetchCollectionRows(dbCLevel, "direction_users"),
    fetchCollectionRows(dbCLevel, "approval_requests"),
    fetchCollectionRows(dbCLevel, "meeting_agendas"),
    fetchCollectionRows(dbCLevel, "meeting_requests"),
    fetchCollectionRows(dbCLevel, "letters"),
    fetchCollectionRows(dbCLevel, "executive_tasks"),
    fetchCollectionRows(dbCLevel, "sync_jobs"),
    fetchCollectionRows(dbCLevel, "system_logs"),
    fetchCollectionRows(dbCLevel, "system_alerts"),
    fetchCollectionRows(dbCLevel, "system_errors"),
    fetchCollectionRows(dbCLevel, "system_backups"),
    fetchCollectionRows(dbMain, "chats"),
    fetchCollectionRows(dbMain, "notifications"),
    fetchCollectionRows(dbMain, "voucher_claims"),
    fetchCollectionRows(dbMain, "shipping_vouchers"),
  ]);

  return {
    ...summaryRaw,
    banners,
    categories,
    menus,
    directorUsers,
    approvalRequests,
    meetingAgendas,
    meetingRequests,
    letters,
    executiveTasks,
    syncJobs,
    systemLogs,
    systemAlerts,
    systemErrors,
    backups: systemBackups,
    chats,
    notifications,
    voucherClaims,
    shippingVouchers,
  };
};
