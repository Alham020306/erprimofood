import {
  addDoc,
  collection,
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
    targetMap.set(item.id, item.data());
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let pendingOps = 0;
  let batch = writeBatch(dbCLevel);

  const flush = async () => {
    if (pendingOps === 0) return;
    await batch.commit();
    batch = writeBatch(dbCLevel);
    pendingOps = 0;
  };

  for (const sourceDoc of sourceSnap.docs) {
    const sourceData = sourceDoc.data();
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
      },
      { merge: true }
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

  await updateTableStatus(table, {
    status: "SYNCED",
    mode: "INCREMENTAL",
    sourceCount: sourceSnap.size,
    targetCount: targetSnap.size + created,
    createdCount: created,
    updatedCount: updated,
    skippedCount: skipped,
    lastSyncedAt: Date.now(),
    lastSyncedAtServer: serverTimestamp(),
  });

  return {
    key: table.key,
    sourceCount: sourceSnap.size,
    created,
    updated,
    skipped,
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
  const targetData = targetSnap.exists() ? targetSnap.data() : null;
  const fingerprint = createFingerprint(sourceData);
  const existingFingerprint = targetData?._syncMeta?.sourceFingerprint;

  if (existingFingerprint !== fingerprint) {
    await setDoc(
      targetRef,
      {
        ...sourceData,
        _syncMeta: {
          sourceDatabase: "default",
          sourceCollection: table.source,
          sourceId: table.sourceDocId,
          sourceFingerprint: fingerprint,
          syncedAt: Date.now(),
          syncedAtServer: serverTimestamp(),
        },
      },
      { merge: true }
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
  const fingerprint = createFingerprint(data);
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
      ...data,
      _syncMeta: {
        sourceDatabase: "default",
        sourceCollection: table.source,
        sourceId: id,
        sourceFingerprint: fingerprint,
        syncedAt: Date.now(),
        syncedAtServer: serverTimestamp(),
      },
    },
    { merge: true }
  );

  return true;
};

export const seedDefaultSyncTables = async () => {
  for (const table of DEFAULT_SYNC_TABLES) {
    await writeSyncTableSeed(table);
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
  const errors: string[] = [];

  for (const table of DEFAULT_SYNC_TABLES) {
    try {
      const result = await syncSingleTableIncremental(table);
      created += result.created;
      updated += result.updated;
      skipped += result.skipped;
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
    errors,
  });

  return {
    tableCount: DEFAULT_SYNC_TABLES.length,
    created,
    updated,
    skipped,
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
    const unsubscribe =
      table.kind === "document"
        ? onSnapshot(doc(dbMain, table.source, table.sourceDocId!), async (snap) => {
            if (!snap.exists()) return;

            const wrote = await syncChangedDoc(table, table.sourceDocId!, snap.data());
            await updateTableStatus(table, {
              liveSyncEnabled: true,
              lastLiveEventAt: Date.now(),
              lastLiveEventAtServer: serverTimestamp(),
              status: wrote ? "LIVE_SYNCED" : "LIVE_IDLE",
            });
          })
        : onSnapshot(collection(dbMain, table.source), async (snap) => {
            for (const change of snap.docChanges()) {
              if (change.type === "removed") continue;
              await syncChangedDoc(table, change.doc.id, change.doc.data());
            }

            await updateTableStatus(table, {
              liveSyncEnabled: true,
              sourceCount: snap.size,
              lastLiveEventAt: Date.now(),
              lastLiveEventAtServer: serverTimestamp(),
              status: "LIVE_SYNCED",
            });
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
