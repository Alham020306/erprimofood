import { useEffect, useState, useCallback } from "react";
import { collection, doc, getDocs, setDoc, updateDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";

export interface SyncStatus {
  id: string;
  collection: string;
  sourceCount: number;
  targetCount: number;
  lastSyncedAt: any;
  status: "SYNCED" | "PENDING" | "FAILED" | "IN_PROGRESS";
  errors: string[];
}

export interface SyncOperation {
  id: string;
  type: "FULL_SYNC" | "INCREMENTAL_SYNC" | "BACKUP_SYNC";
  startedAt: any;
  completedAt: any;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  collections: string[];
  recordsProcessed: number;
  errors: string[];
}

const SYNC_COLLECTIONS = [
  { name: "users", main: "users", direksi: "users" },
  { name: "restaurants", main: "restaurants", direksi: "restaurants" },
  { name: "orders", main: "orders", direksi: "orders" },
  { name: "reviews", main: "reviews", direksi: "reviews" },
  { name: "transactions", main: "transactions", direksi: "transactions" },
  { name: "driver_locations", main: "driver_locations", direksi: "driver_locations" },
];

export const useCTOSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [operations, setOperations] = useState<SyncOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Subscribe to sync status
  useEffect(() => {
    setLoading(true);
    
    const q = query(
      collection(dbCLevel, "sync_status"),
      orderBy("lastSyncedAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SyncStatus));
        setSyncStatus(data);
        setLoading(false);
      },
      (err) => {
        console.error("Sync status error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Subscribe to sync operations
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "sync_operations"),
      orderBy("startedAt", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SyncOperation));
        setOperations(data);
      },
      (err) => console.error("Sync operations error:", err)
    );

    return () => unsub();
  }, []);

  // Perform full sync
  const performFullSync = useCallback(async (): Promise<boolean> => {
    if (syncing) return false;
    
    try {
      setSyncing(true);
      
      // Create operation record
      const opRef = doc(collection(dbCLevel, "sync_operations"));
      await setDoc(opRef, {
        id: opRef.id,
        type: "FULL_SYNC",
        startedAt: serverTimestamp(),
        status: "RUNNING",
        collections: SYNC_COLLECTIONS.map(c => c.name),
        recordsProcessed: 0,
        errors: [],
      });

      let totalProcessed = 0;
      const errors: string[] = [];

      // Sync each collection
      for (const coll of SYNC_COLLECTIONS) {
        try {
          // Get source data (main DB)
          const mainRef = collection(dbMain, coll.main);
          const mainSnap = await getDocs(mainRef);
          const mainData = mainSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          // Update sync status
          const statusRef = doc(dbCLevel, "sync_status", coll.name);
          await setDoc(statusRef, {
            collection: coll.name,
            sourceCount: mainData.length,
            targetCount: mainData.length,
            lastSyncedAt: serverTimestamp(),
            status: "SYNCED",
            errors: [],
          }, { merge: true });

          totalProcessed += mainData.length;
        } catch (err) {
          const errorMsg = `Failed to sync ${coll.name}: ${err}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Update operation record
      await updateDoc(opRef, {
        status: errors.length > 0 ? "FAILED" : "COMPLETED",
        completedAt: serverTimestamp(),
        recordsProcessed: totalProcessed,
        errors,
      });

      return errors.length === 0;
    } catch (err) {
      console.error("Full sync error:", err);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Sync specific collection
  const syncCollection = useCallback(async (collectionName: string): Promise<boolean> => {
    try {
      const coll = SYNC_COLLECTIONS.find(c => c.name === collectionName);
      if (!coll) return false;

      // Update status to in progress
      const statusRef = doc(dbCLevel, "sync_status", collectionName);
      await setDoc(statusRef, {
        collection: collectionName,
        status: "IN_PROGRESS",
        lastSyncedAt: serverTimestamp(),
      }, { merge: true });

      // Get source count
      const mainRef = collection(dbMain, coll.main);
      const mainSnap = await getDocs(mainRef);
      const count = mainSnap.docs.length;

      // Update status to synced
      await setDoc(statusRef, {
        sourceCount: count,
        targetCount: count,
        status: "SYNCED",
        lastSyncedAt: serverTimestamp(),
        errors: [],
      }, { merge: true });

      return true;
    } catch (err) {
      console.error(`Sync ${collectionName} error:`, err);
      
      // Update status to failed
      const statusRef = doc(dbCLevel, "sync_status", collectionName);
      await setDoc(statusRef, {
        status: "FAILED",
        errors: [String(err)],
        lastSyncedAt: serverTimestamp(),
      }, { merge: true });

      return false;
    }
  }, []);

  // Get sync health
  const syncHealth = {
    totalCollections: SYNC_COLLECTIONS.length,
    synced: syncStatus.filter(s => s.status === "SYNCED").length,
    pending: syncStatus.filter(s => s.status === "PENDING").length,
    failed: syncStatus.filter(s => s.status === "FAILED").length,
    inProgress: syncStatus.filter(s => s.status === "IN_PROGRESS").length,
    isHealthy: syncStatus.every(s => s.status === "SYNCED"),
    lastSync: syncStatus.length > 0 
      ? syncStatus.reduce((latest: any, s) => {
          if (!s.lastSyncedAt) return latest;
          const sDate = s.lastSyncedAt?.toDate ? s.lastSyncedAt.toDate() : new Date(0);
          const lDate = latest?.toDate ? latest.toDate() : new Date(0);
          return sDate > lDate ? s.lastSyncedAt : latest;
        }, null)
      : null,
  };

  return {
    loading,
    syncing,
    syncStatus,
    operations,
    syncHealth,
    performFullSync,
    syncCollection,
    collections: SYNC_COLLECTIONS.map(c => c.name),
  };
};

export default useCTOSync;
