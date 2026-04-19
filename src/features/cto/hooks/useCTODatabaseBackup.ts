import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, getDocs, serverTimestamp, query, orderBy, limit, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";

export interface BackupJob {
  id: string;
  name: string;
  type: "FULL" | "INCREMENTAL" | "SCHEDULED";
  source: "main" | "direksi" | "both";
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  startedAt: any;
  completedAt: any;
  size: number; // in MB
  collections: string[];
  recordsCount: number;
  downloadUrl?: string;
  error?: string;
  scheduledFor?: any;
  frequency?: "DAILY" | "WEEKLY" | "MONTHLY";
}

export interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: any;
  lastBackupStatus: string;
  autoBackupEnabled: boolean;
  nextScheduledBackup: any;
}

const BACKUP_COLLECTIONS = [
  "users",
  "restaurants",
  "orders",
  "transactions",
  "reviews",
  "driver_locations",
  "banners",
  "categories",
];

export const useCTODatabaseBackup = () => {
  const [backups, setBackups] = useState<BackupJob[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Subscribe to backups
  useEffect(() => {
    setLoading(true);
    
    const q = query(
      collection(dbCLevel, "backup_jobs"),
      orderBy("startedAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BackupJob));
        setBackups(data);
        setLoading(false);
      },
      (err) => {
        console.error("Backups error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Subscribe to backup stats
  useEffect(() => {
    const unsub = onSnapshot(
      doc(dbCLevel, "backup_stats", "current"),
      (snap) => {
        if (snap.exists()) {
          setStats(snap.data() as BackupStats);
        } else {
          // Initialize default stats
          setStats({
            totalBackups: 0,
            totalSize: 0,
            lastBackup: null,
            lastBackupStatus: "NEVER",
            autoBackupEnabled: true,
            nextScheduledBackup: null,
          });
        }
      },
      (err) => {
        console.error("Backup stats error:", err);
      }
    );

    return () => unsub();
  }, []);

  // Create manual backup
  const createBackup = useCallback(async (
    type: "FULL" | "INCREMENTAL" = "FULL",
    source: "main" | "direksi" | "both" = "both"
  ): Promise<boolean> => {
    if (creating) return false;

    try {
      setCreating(true);

      // Create backup job
      const jobRef = doc(collection(dbCLevel, "backup_jobs"));
      const backupJob: Partial<BackupJob> = {
        id: jobRef.id,
        name: `Manual ${type} Backup - ${new Date().toLocaleString("id-ID")}`,
        type,
        source,
        status: "RUNNING",
        startedAt: serverTimestamp(),
        collections: BACKUP_COLLECTIONS,
        recordsCount: 0,
        size: 0,
      };

      await setDoc(jobRef, backupJob);

      let totalRecords = 0;
      let totalSize = 0;

      // Backup main database
      if (source === "main" || source === "both") {
        for (const coll of BACKUP_COLLECTIONS) {
          try {
            const snap = await getDocs(collection(dbMain, coll));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Store backup data
            const backupDataRef = doc(dbCLevel, "backup_data", `${jobRef.id}_${coll}`);
            await setDoc(backupDataRef, {
              jobId: jobRef.id,
              collection: coll,
              source: "main",
              data,
              count: data.length,
              size: JSON.stringify(data).length / (1024 * 1024), // MB
              backedUpAt: serverTimestamp(),
            });

            totalRecords += data.length;
            totalSize += JSON.stringify(data).length / (1024 * 1024);
          } catch (e) {
            console.error(`Failed to backup ${coll}:`, e);
          }
        }
      }

      // Backup direksi database
      if (source === "direksi" || source === "both") {
        const direksiCollections = [
          "directors",
          "meetings",
          "approvals",
          "chat_messages",
          "recruitment_requests",
          "attendance",
        ];

        for (const coll of direksiCollections) {
          try {
            const snap = await getDocs(collection(dbCLevel, coll));
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            const backupDataRef = doc(dbCLevel, "backup_data", `${jobRef.id}_${coll}`);
            await setDoc(backupDataRef, {
              jobId: jobRef.id,
              collection: coll,
              source: "direksi",
              data,
              count: data.length,
              size: JSON.stringify(data).length / (1024 * 1024),
              backedUpAt: serverTimestamp(),
            });

            totalRecords += data.length;
            totalSize += JSON.stringify(data).length / (1024 * 1024);
          } catch (e) {
            console.error(`Failed to backup direksi ${coll}:`, e);
          }
        }
      }

      // Update job as completed
      await updateDoc(jobRef, {
        status: "COMPLETED",
        completedAt: serverTimestamp(),
        recordsCount: totalRecords,
        size: Math.round(totalSize * 100) / 100,
      });

      // Update stats
      const statsRef = doc(dbCLevel, "backup_stats", "current");
      await setDoc(statsRef, {
        totalBackups: backups.length + 1,
        totalSize: Math.round((stats?.totalSize || 0) + totalSize),
        lastBackup: serverTimestamp(),
        lastBackupStatus: "COMPLETED",
      }, { merge: true });

      return true;
    } catch (err) {
      console.error("Create backup error:", err);
      return false;
    } finally {
      setCreating(false);
    }
  }, [creating, backups.length, stats?.totalSize]);

  // Restore from backup
  const restoreBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      // Get backup job
      const jobRef = doc(dbCLevel, "backup_jobs", backupId);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) return false;
      
      const job = jobSnap.data() as BackupJob;
      
      // Update status to restoring
      await updateDoc(jobRef, { status: "RUNNING" });

      // Restore each collection
      for (const coll of job.collections) {
        try {
          const backupDataRef = doc(dbCLevel, "backup_data", `${backupId}_${coll}`);
          const backupDataSnap = await getDoc(backupDataRef);
          
          if (backupDataSnap.exists()) {
            const { data, source } = backupDataSnap.data();
            
            // In real implementation, this would restore to the target database
            console.log(`Restoring ${coll} from ${source}...`, data.length, "records");
          }
        } catch (e) {
          console.error(`Failed to restore ${coll}:`, e);
        }
      }

      await updateDoc(jobRef, { status: "COMPLETED" });
      return true;
    } catch (err) {
      console.error("Restore backup error:", err);
      return false;
    }
  }, []);

  // Delete backup
  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      // Mark as deleted (actual deletion would be done by a cloud function)
      const jobRef = doc(dbCLevel, "backup_jobs", backupId);
      await updateDoc(jobRef, { status: "DELETED", deletedAt: serverTimestamp() });
      return true;
    } catch (err) {
      console.error("Delete backup error:", err);
      return false;
    }
  }, []);

  // Toggle auto backup
  const toggleAutoBackup = useCallback(async (enabled: boolean): Promise<boolean> => {
    try {
      const statsRef = doc(dbCLevel, "backup_stats", "current");
      await setDoc(statsRef, { autoBackupEnabled: enabled }, { merge: true });
      return true;
    } catch (err) {
      console.error("Toggle auto backup error:", err);
      return false;
    }
  }, []);

  // Schedule backup
  const scheduleBackup = useCallback(async (
    frequency: "DAILY" | "WEEKLY" | "MONTHLY",
    startTime: Date
  ): Promise<boolean> => {
    try {
      const statsRef = doc(dbCLevel, "backup_stats", "current");
      await setDoc(statsRef, {
        nextScheduledBackup: startTime,
        scheduledFrequency: frequency,
      }, { merge: true });
      return true;
    } catch (err) {
      console.error("Schedule backup error:", err);
      return false;
    }
  }, []);

  return {
    loading,
    creating,
    backups,
    stats,
    createBackup,
    restoreBackup,
    deleteBackup,
    toggleAutoBackup,
    scheduleBackup,
  };
};

export default useCTODatabaseBackup;
