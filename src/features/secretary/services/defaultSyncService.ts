import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

type SyncKind = "collection" | "document";

type SyncTableDefinition = {
  key: string;
  source: string;
  target: string;
  kind: SyncKind;
  sourceDocId?: string;
  targetDocId?: string;
  note: string;
};

const DEFAULT_SYNC_TABLES: SyncTableDefinition[] = [
  {
    key: "users",
    source: "users",
    target: "sync_users",
    kind: "collection",
    note: "Mirror akun operasional dari dbMain untuk kebutuhan ERP.",
  },
  {
    key: "restaurants",
    source: "restaurants",
    target: "sync_restaurants",
    kind: "collection",
    note: "Mirror merchant/resto untuk panel direksi dan admin.",
  },
  {
    key: "orders",
    source: "orders",
    target: "sync_orders",
    kind: "collection",
    note: "Mirror order operasional tanpa menimpa collection kerja direksi.",
  },
  {
    key: "reviews",
    source: "reviews",
    target: "sync_reviews",
    kind: "collection",
    note: "Mirror review merchant/customer.",
  },
  {
    key: "driver_reviews",
    source: "driver_reviews",
    target: "sync_driver_reviews",
    kind: "collection",
    note: "Mirror review driver.",
  },
  {
    key: "menus",
    source: "menus",
    target: "sync_menus",
    kind: "collection",
    note: "Mirror menu merchant untuk lookup operasional.",
  },
  {
    key: "operational_ledger",
    source: "operational_ledger",
    target: "sync_operational_ledger",
    kind: "collection",
    note: "Mirror ledger operasional untuk finance/reporting ERP.",
  },
  {
    key: "banners",
    source: "banners",
    target: "sync_banners",
    kind: "collection",
    note: "Mirror banner dan aset promosi.",
  },
  {
    key: "categories",
    source: "categories",
    target: "sync_categories",
    kind: "collection",
    note: "Mirror kategori menu.",
  },
  {
    key: "system_support",
    source: "system",
    sourceDocId: "support",
    target: "sync_system_support",
    targetDocId: "current",
    kind: "document",
    note: "Mirror status support singleton dari dbMain.",
  },
];

const liveSyncUnsubscribers = new Map<string, Unsubscribe>();
const SYNC_META_DOC_ID = "sync_meta";

const isMetaDocId = (id: string) => id === SYNC_META_DOC_ID;

const stripUndefined = (value: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );

const asNumber = (value: any) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
};

const asSafeRemoteUrl = (value: any, max = 2000) => {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^https?:\/\//i.test(normalized)) return null;
  return normalized.length > max ? normalized.slice(0, max) : normalized;
};

const asText = (value: any, max = 500) => {
  if (typeof value !== "string") return value ?? null;
  return value.length > max ? `${value.slice(0, max)}…` : value;
};

const buildOrderSyncPayload = (id: string, data: Record<string, any>) => {
  const items = Array.isArray(data.items) ? data.items : [];
  const customerLocation =
    data.customerLocation && typeof data.customerLocation === "object"
      ? stripUndefined({
          lat: data.customerLocation.lat,
          lng: data.customerLocation.lng,
          address: asText(data.customerLocation.address, 180),
        })
      : undefined;
  const restaurantLocation =
    data.restaurantLocation && typeof data.restaurantLocation === "object"
      ? stripUndefined({
          lat: data.restaurantLocation.lat,
          lng: data.restaurantLocation.lng,
          address: asText(data.restaurantLocation.address, 180),
        })
      : undefined;
  const bankDetails =
    data.bankDetails && typeof data.bankDetails === "object"
      ? stripUndefined({
          bankName: asText(data.bankDetails.bankName, 80),
          accountName: asText(data.bankDetails.accountName, 120),
          accountNumber: asText(data.bankDetails.accountNumber, 80),
        })
      : undefined;

  return stripUndefined({
    sourceId: id,
    orderNumber: data.orderNumber || data.code || null,
    status: data.status || null,
    type: data.type || data.orderType || null,
    paymentMethod: data.paymentMethod || null,
    paymentStatus: data.paymentStatus || null,
    timestamp: data.timestamp || null,
    updatedAt: data.updatedAt || data.timestamp || null,
    customerId: data.customerId || data.userId || null,
    customerName: data.customerName || data.userName || null,
    customerPhone: data.customerPhone || null,
    customerLocation,
    restaurantId: data.restaurantId || null,
    restaurantName: data.restaurantName || null,
    restaurantLocation,
    driverId: data.driverId || null,
    driverName: data.driverName || null,
    driverPhone: data.driverPhone || null,
    driverVehicle: asText(data.driverVehicle, 80),
    driverPlate: asText(data.driverPlate, 40),
    total: asNumber(data.total ?? data.totalAmount ?? data.grandTotal),
    subtotal: asNumber(data.subtotal),
    deliveryFee: asNumber(data.deliveryFee),
    originalDeliveryFee: asNumber(data.originalDeliveryFee),
    serviceFee: asNumber(data.serviceFee),
    adminCommission: asNumber(data.adminCommission),
    restaurantEarnings: asNumber(data.restaurantEarnings),
    restoEarnings: asNumber(data.restoEarnings),
    driverEarnings: asNumber(data.driverEarnings),
    discountAmount: asNumber(data.discountAmount),
    voucherSubsidy: asNumber(data.voucherSubsidy),
    voucherApplied: data.voucherApplied === true,
    appliedVoucherCode: asText(data.appliedVoucherCode, 80),
    distanceKm: asNumber(data.distanceKm ?? data.distance),
    itemCount: items.length,
    itemPreview: items.slice(0, 8).map((item: any) =>
      stripUndefined({
        name: asText(item?.name || item?.menuName || "Item", 80),
        quantity: asNumber(item?.quantity || 1),
        price: asNumber(item?.price),
      })
    ),
    note: asText(data.note, 300),
    cancellationReason: asText(data.cancellationReason, 300),
    cancelledAt: data.cancelledAt || null,
    cancelledBy: data.cancelledBy || null,
    customerAddress: asText(data.customerAddress, 180),
    restaurantAddress: asText(data.restaurantAddress, 180),
    acceptedAt: data.acceptedAt || null,
    pickedUpAt: data.pickedUpAt || null,
    completedAt: data.completedAt || null,
    isReviewed: data.isReviewed === true,
    earningsDistributed: data.earningsDistributed === true,
    voucherClaimStatus: asText(data.voucherClaimStatus, 80),
    proofOfTransfer: asSafeRemoteUrl(data.proofOfTransfer),
    bankDetails,
    hasPayloadPruned: true,
  });
};

const buildUserSyncPayload = (id: string, data: Record<string, any>) =>
  stripUndefined({
    sourceId: id,
    uid: data.uid || id,
    role: data.role || data.primaryRole || null,
    fullName: asText(
      data.fullName ||
        data.name ||
        data.restaurantName ||
        data.displayName ||
        data.ownerName,
      120
    ),
    email: asText(data.email, 160),
    phoneNumber: asText(data.phoneNumber || data.phone, 40),
    address: asText(data.address, 200),
    isActive:
      typeof data.isActive === "boolean"
        ? data.isActive
        : data.isBanned === true
        ? false
        : true,
    isOnline: data.isOnline === true,
    isVerified: data.isVerified === true,
    isSuspended: data.isSuspended === true,
    isBanned: data.isBanned === true,
    tokenVerified: data.tokenVerified === true,
    verificationToken: asText(data.verificationToken, 120),
    appVersion: asText(data.appVersion || data.versionName || data.version, 60),
    currentVersion: asText(data.currentVersion, 60),
    updateVersion: asText(data.updateVersion, 60),
    lastUpdateCheck: data.lastUpdateCheck || null,
    activatedAt: data.activatedAt || null,
    lastSeenAt: data.lastSeenAt || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || data.lastUpdatedAt || null,
    latitude:
      typeof data.latitude === "number"
        ? data.latitude
        : typeof data.lat === "number"
        ? data.lat
        : undefined,
    longitude:
      typeof data.longitude === "number"
        ? data.longitude
        : typeof data.lng === "number"
        ? data.lng
        : undefined,
    vehicleType: asText(data.vehicleType || data.vehicleName, 80),
    vehiclePlate: asText(data.vehiclePlate || data.plateNumber, 40),
    restaurantId: data.restaurantId || null,
    restaurantName: asText(data.restaurantName, 120),
    balance: asNumber(data.balance),
    hasPayloadPruned: true,
  });

const normalizeForFingerprint = (value: any): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForFingerprint(item));
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .filter((key) => key !== "_syncMeta")
      .sort()
      .reduce<Record<string, any>>((acc, key) => {
        acc[key] = normalizeForFingerprint(value[key]);
        return acc;
      }, {});
  }

  return value;
};

const createFingerprint = (value: Record<string, any>) =>
  JSON.stringify(normalizeForFingerprint(value));

const buildFallbackPayload = (
  table: SyncTableDefinition,
  id: string,
  data: Record<string, any>
) =>
  stripUndefined({
    sourceId: id,
    sourceCollection: table.source,
    status: data.status || null,
    updatedAt: data.updatedAt || data.timestamp || null,
    title: asText(data.title || data.name || data.restaurantName || data.fullName, 120),
    restaurantId: data.restaurantId || null,
    driverId: data.driverId || null,
    userId: data.userId || data.customerId || null,
    total: asNumber(data.total ?? data.totalAmount ?? data.grandTotal),
    itemCount: Array.isArray(data.items) ? data.items.length : 0,
    oversizedSource: true,
  });

const buildSyncPayload = (
  table: SyncTableDefinition,
  id: string,
  data: Record<string, any>
) => {
  const basePayload =
    table.key === "orders"
      ? buildOrderSyncPayload(id, data)
      : table.key === "users"
      ? buildUserSyncPayload(id, data)
      : data;

  const payloadSize = createFingerprint(basePayload).length;

  if (payloadSize > 900_000) {
    return buildFallbackPayload(table, id, data);
  }

  return basePayload;
};

const writeSyncTableSeed = async (table: SyncTableDefinition) => {
  await setDoc(
    doc(dbCLevel, "default_sync_tables", table.key),
    {
      key: table.key,
      sourceCollection: table.source,
      targetCollection: table.target,
      kind: table.kind,
      sourceDocId: table.sourceDocId || null,
      targetDocId: table.targetDocId || null,
      note: table.note,
      status: "SEEDED",
      liveSyncEnabled: false,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

const ensureTargetCollectionExists = async (table: SyncTableDefinition) => {
  if (table.kind === "document") {
    await setDoc(
      doc(dbCLevel, table.target, table.targetDocId!),
      {
        _syncMeta: {
          sourceDatabase: "default",
          sourceCollection: table.source,
          bootstrap: true,
          status: "READY_FOR_SYNC",
          createdAt: Date.now(),
          createdAtServer: serverTimestamp(),
        },
      },
      { merge: true }
    );
    return;
  }

  await setDoc(
    doc(dbCLevel, table.target, SYNC_META_DOC_ID),
    {
      _syncMeta: {
        sourceDatabase: "default",
        sourceCollection: table.source,
        bootstrap: true,
        status: "READY_FOR_SYNC",
        createdAt: Date.now(),
        createdAtServer: serverTimestamp(),
      },
    },
    { merge: true }
  );
};

const updateGlobalSyncState = async (payload: Record<string, any>) => {
  await setDoc(
    doc(dbCLevel, "sync_state", "current"),
    {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

const updateTableStatus = async (
  table: SyncTableDefinition,
  payload: Record<string, any>
) => {
  await setDoc(
    doc(dbCLevel, "default_sync_tables", table.key),
    {
      ...payload,
      updatedAt: Date.now(),
      updatedAtServer: serverTimestamp(),
    },
    { merge: true }
  );
};

const hasSeededSyncData = async (table: SyncTableDefinition) => {
  if (table.kind === "document") {
    const snap = await getDoc(doc(dbCLevel, table.target, table.targetDocId!));
    return snap.exists() && !!snap.data()?._syncMeta?.sourceFingerprint;
  }

  const snap = await getDocs(collection(dbCLevel, table.target));
  return snap.docs.some(
    (item) =>
      !isMetaDocId(item.id) && !!item.data()?._syncMeta?.sourceFingerprint
  );
};

const writeSyncJob = async (
  jobType: string,
  payload: Record<string, any>
) => {
  await addDoc(collection(dbCLevel, "sync_jobs"), {
    jobType,
    sourceDatabase: "default",
    targetDatabase: "direksi",
    ...payload,
    createdAt: Date.now(),
    createdAtServer: serverTimestamp(),
  });
};

const upsertCollectionIncremental = async (table: SyncTableDefinition) => {
  const sourceSnap = await getDocs(collection(dbMain, table.source));
  const targetSnap = await getDocs(collection(dbCLevel, table.target));

  const targetMap = new Map<string, any>();
  targetSnap.forEach((item) => {
    if (isMetaDocId(item.id)) return;
    targetMap.set(item.id, item.data());
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let deleted = 0;
  let pendingOps = 0;
  let batch = writeBatch(dbCLevel);
  const sourceIds = new Set<string>();

  const flush = async () => {
    if (pendingOps === 0) return;
    await batch.commit();
    batch = writeBatch(dbCLevel);
    pendingOps = 0;
  };

  for (const sourceDoc of sourceSnap.docs) {
    sourceIds.add(sourceDoc.id);
    const sourceData = buildSyncPayload(table, sourceDoc.id, sourceDoc.data());
    const fingerprint = createFingerprint(sourceData);
    const existing = targetMap.get(sourceDoc.id);
    const existingFingerprint = existing?._syncMeta?.sourceFingerprint;

    if (existingFingerprint === fingerprint) {
      skipped += 1;
      continue;
    }

    const targetRef = doc(dbCLevel, table.target, sourceDoc.id);
    batch.set(
      targetRef,
      {
        ...sourceData,
        _syncMeta: {
          sourceDatabase: "default",
          sourceCollection: table.source,
          sourceId: sourceDoc.id,
          sourceFingerprint: fingerprint,
          syncedAt: Date.now(),
          syncedAtServer: serverTimestamp(),
        },
      }
    );

    if (existing) {
      updated += 1;
    } else {
      created += 1;
    }

    pendingOps += 1;

    if (pendingOps >= 350) {
      await flush();
    }
  }

  await flush();

  for (const targetDoc of targetSnap.docs) {
    if (isMetaDocId(targetDoc.id) || sourceIds.has(targetDoc.id)) continue;

    batch.delete(doc(dbCLevel, table.target, targetDoc.id));
    deleted += 1;
    pendingOps += 1;

    if (pendingOps >= 350) {
      await flush();
    }
  }

  await flush();

  await updateTableStatus(table, {
    status: "SYNCED",
    mode: "INCREMENTAL",
    sourceCount: sourceSnap.size,
    targetCount: sourceSnap.size,
    createdCount: created,
    updatedCount: updated,
    skippedCount: skipped,
    deletedCount: deleted,
    lastSyncedAt: Date.now(),
    lastSyncedAtServer: serverTimestamp(),
  });

  return {
    key: table.key,
    sourceCount: sourceSnap.size,
    created,
    updated,
    skipped,
    deleted,
  };
};

const upsertSingleDocumentIncremental = async (table: SyncTableDefinition) => {
  const sourceRef = doc(dbMain, table.source, table.sourceDocId!);
  const targetRef = doc(dbCLevel, table.target, table.targetDocId!);
  const [sourceSnap, targetSnap] = await Promise.all([
    getDoc(sourceRef),
    getDoc(targetRef),
  ]);

  if (!sourceSnap.exists()) {
    await updateTableStatus(table, {
      status: "SOURCE_MISSING",
      lastSyncedAt: Date.now(),
      lastSyncedAtServer: serverTimestamp(),
    });

    return {
      key: table.key,
      sourceCount: 0,
      created: 0,
      updated: 0,
      skipped: 1,
    };
  }

  const sourceData = sourceSnap.data();
  const syncPayload = buildSyncPayload(
    table,
    table.sourceDocId || table.targetDocId || "current",
    sourceData
  );
  const targetData = targetSnap.exists() ? targetSnap.data() : null;
  const fingerprint = createFingerprint(syncPayload);
  const existingFingerprint = targetData?._syncMeta?.sourceFingerprint;

  if (existingFingerprint !== fingerprint) {
    await setDoc(
      targetRef,
      {
        ...syncPayload,
        _syncMeta: {
          sourceDatabase: "default",
          sourceCollection: table.source,
          sourceId: table.sourceDocId,
          sourceFingerprint: fingerprint,
          syncedAt: Date.now(),
          syncedAtServer: serverTimestamp(),
        },
      }
    );
  }

  await updateTableStatus(table, {
    status: "SYNCED",
    mode: "INCREMENTAL",
    sourceCount: 1,
    targetCount: 1,
    createdCount: targetSnap.exists() ? 0 : 1,
    updatedCount: targetSnap.exists() && existingFingerprint !== fingerprint ? 1 : 0,
    skippedCount: existingFingerprint === fingerprint ? 1 : 0,
    lastSyncedAt: Date.now(),
    lastSyncedAtServer: serverTimestamp(),
  });

  return {
    key: table.key,
    sourceCount: 1,
    created: targetSnap.exists() ? 0 : 1,
    updated: targetSnap.exists() && existingFingerprint !== fingerprint ? 1 : 0,
    skipped: existingFingerprint === fingerprint ? 1 : 0,
    deleted: 0,
  };
};

const syncSingleTableIncremental = async (table: SyncTableDefinition) => {
  return table.kind === "document"
    ? upsertSingleDocumentIncremental(table)
    : upsertCollectionIncremental(table);
};

const syncChangedDoc = async (
  table: SyncTableDefinition,
  id: string,
  data: Record<string, any>
) => {
  const syncPayload = buildSyncPayload(table, id, data);
  const fingerprint = createFingerprint(syncPayload);
  const targetDocId = table.kind === "document" ? table.targetDocId! : id;
  const targetRef = doc(dbCLevel, table.target, targetDocId);
  const existing = await getDoc(targetRef);
  const existingFingerprint = existing.exists()
    ? existing.data()?._syncMeta?.sourceFingerprint
    : null;

  if (existingFingerprint === fingerprint) {
    return false;
  }

  await setDoc(
    targetRef,
    {
      ...syncPayload,
      _syncMeta: {
        sourceDatabase: "default",
        sourceCollection: table.source,
        sourceId: id,
        sourceFingerprint: fingerprint,
        syncedAt: Date.now(),
        syncedAtServer: serverTimestamp(),
      },
    }
  );

  return true;
};

export const seedDefaultSyncTables = async () => {
  for (const table of DEFAULT_SYNC_TABLES) {
    await writeSyncTableSeed(table);
    await ensureTargetCollectionExists(table);
  }

  await updateGlobalSyncState({
    sourceDatabase: "default",
    targetDatabase: "direksi",
    defaultSyncSeeded: true,
    defaultSyncTableCount: DEFAULT_SYNC_TABLES.length,
  });

  return {
    tableCount: DEFAULT_SYNC_TABLES.length,
  };
};

export const runIncrementalDefaultSync = async () => {
  const startedAt = Date.now();
  await updateGlobalSyncState({
    status: "RUNNING",
    defaultSyncMode: "INCREMENTAL",
    lastDefaultSyncStartedAt: startedAt,
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let deleted = 0;
  const errors: string[] = [];

  for (const table of DEFAULT_SYNC_TABLES) {
    try {
      const result = await syncSingleTableIncremental(table);
      created += result.created;
      updated += result.updated;
      skipped += result.skipped;
      deleted += result.deleted || 0;
    } catch (error: any) {
      errors.push(`${table.key}: ${error?.message || String(error)}`);
      await updateTableStatus(table, {
        status: "FAILED",
        lastError: error?.message || String(error),
        lastSyncedAt: Date.now(),
        lastSyncedAtServer: serverTimestamp(),
      });
    }
  }

  const completedAt = Date.now();

  await updateGlobalSyncState({
    status: errors.length ? "FAILED" : "SYNCED",
    defaultSyncMode: "INCREMENTAL",
    lastDefaultSyncCompletedAt: completedAt,
    lastDefaultSyncCreated: created,
    lastDefaultSyncUpdated: updated,
    lastDefaultSyncSkipped: skipped,
    lastDefaultSyncDeleted: deleted,
    lastDefaultSyncErrors: errors,
  });

  await writeSyncJob("DEFAULT_INCREMENTAL_SYNC", {
    status: errors.length ? "FAILED" : "COMPLETED",
    startedAt,
    completedAt,
    tableCount: DEFAULT_SYNC_TABLES.length,
    createdCount: created,
    updatedCount: updated,
    skippedCount: skipped,
    deletedCount: deleted,
    errors,
  });

  return {
    tableCount: DEFAULT_SYNC_TABLES.length,
    created,
    updated,
    skipped,
    deleted,
    errors,
  };
};

export const startDefaultLiveSync = async () => {
  if (liveSyncUnsubscribers.size > 0) {
    await updateGlobalSyncState({
      liveDefaultSyncEnabled: true,
    });

    return {
      listenerCount: liveSyncUnsubscribers.size,
      alreadyRunning: true,
    };
  }

  for (const table of DEFAULT_SYNC_TABLES) {
    try {
      const alreadySeeded = await hasSeededSyncData(table);
      if (!alreadySeeded) {
        await syncSingleTableIncremental(table);
      }
    } catch (error: any) {
      console.error(`Initial sync bootstrap failed for ${table.key}:`, error);
      await updateTableStatus(table, {
        status: "FAILED",
        liveSyncEnabled: false,
        lastError: error?.message || String(error),
      });
    }

    const unsubscribe =
      table.kind === "document"
        ? onSnapshot(doc(dbMain, table.source, table.sourceDocId!), async (snap) => {
            try {
              if (!snap.exists()) return;

              const wrote = await syncChangedDoc(table, table.sourceDocId!, snap.data());
              await updateTableStatus(table, {
                liveSyncEnabled: true,
                lastLiveEventAt: Date.now(),
                lastLiveEventAtServer: serverTimestamp(),
                status: wrote ? "LIVE_SYNCED" : "LIVE_IDLE",
              });
            } catch (error: any) {
              console.error(`Live sync failed for ${table.key}:`, error);
              await updateTableStatus(table, {
                status: "FAILED",
                liveSyncEnabled: true,
                lastError: error?.message || String(error),
              });
            }
          })
        : onSnapshot(collection(dbMain, table.source), async (snap) => {
            try {
              for (const change of snap.docChanges()) {
                if (change.type === "removed") {
                  await deleteDoc(doc(dbCLevel, table.target, change.doc.id));
                  continue;
                }
                await syncChangedDoc(table, change.doc.id, change.doc.data());
              }

              await updateTableStatus(table, {
                liveSyncEnabled: true,
                sourceCount: snap.size,
                lastLiveEventAt: Date.now(),
                lastLiveEventAtServer: serverTimestamp(),
                status: "LIVE_SYNCED",
              });
            } catch (error: any) {
              console.error(`Live sync failed for ${table.key}:`, error);
              await updateTableStatus(table, {
                status: "FAILED",
                liveSyncEnabled: true,
                lastError: error?.message || String(error),
              });
            }
          });

    liveSyncUnsubscribers.set(table.key, unsubscribe);
    await updateTableStatus(table, {
      liveSyncEnabled: true,
    });
  }

  await updateGlobalSyncState({
    liveDefaultSyncEnabled: true,
    liveDefaultSyncStartedAt: Date.now(),
    status: "LIVE_SYNC_ACTIVE",
  });

  await writeSyncJob("DEFAULT_LIVE_SYNC_START", {
    status: "COMPLETED",
    tableCount: DEFAULT_SYNC_TABLES.length,
    listenerCount: liveSyncUnsubscribers.size,
  });

  return {
    listenerCount: liveSyncUnsubscribers.size,
    alreadyRunning: false,
  };
};

export const stopDefaultLiveSync = async () => {
  liveSyncUnsubscribers.forEach((unsubscribe) => unsubscribe());
  liveSyncUnsubscribers.clear();

  for (const table of DEFAULT_SYNC_TABLES) {
    await updateTableStatus(table, {
      liveSyncEnabled: false,
      status: "SYNCED",
    });
  }

  await updateGlobalSyncState({
    liveDefaultSyncEnabled: false,
    liveDefaultSyncStoppedAt: Date.now(),
    status: "IDLE",
  });

  await writeSyncJob("DEFAULT_LIVE_SYNC_STOP", {
    status: "COMPLETED",
    tableCount: DEFAULT_SYNC_TABLES.length,
  });

  return {
    listenerCount: 0,
  };
};

export const isDefaultLiveSyncRunning = () => liveSyncUnsubscribers.size > 0;

export const getDefaultSyncTableDefinitions = () => DEFAULT_SYNC_TABLES;
