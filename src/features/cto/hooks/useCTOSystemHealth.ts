import { useEffect, useState, useCallback, useRef } from "react";
import { collection, doc, setDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { getDocs, collection as firestoreCollection } from "firebase/firestore";

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  requestRate: number;
  errorRate: number;
  timestamp: number;
}

export interface DatabaseHealth {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  responseTime: number;
  lastChecked: any;
  connections: number;
  pendingWrites: number;
  documentCount: number;
}

export interface SystemAlert {
  id: string;
  type: "CPU_HIGH" | "MEMORY_HIGH" | "DISK_FULL" | "NETWORK_SLOW" | "DB_SLOW" | "ERROR_SPIKE";
  severity: "INFO" | "WARNING" | "CRITICAL";
  message: string;
  value: number;
  threshold: number;
  timestamp: any;
  acknowledged: boolean;
}

const THRESHOLDS = {
  CPU_HIGH: 80,
  MEMORY_HIGH: 85,
  DISK_FULL: 90,
  NETWORK_SLOW: 500,
  DB_SLOW: 1000,
  ERROR_SPIKE: 5,
};

export const useCTOSystemHealth = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const metricsRef = useRef<SystemMetrics[]>([]);

  // Simulate system metrics collection
  const collectMetrics = useCallback(async () => {
    const startTime = performance.now();
    
    // Check database response time
    try {
      const testRef = firestoreCollection(dbMain, "users");
      await getDocs(query(testRef, limit(1)));
    } catch (e) {
      console.error("DB check failed:", e);
    }
    
    const dbResponseTime = performance.now() - startTime;

    // Calculate metrics (simulated for frontend)
    const cpuUsage = Math.random() * 30 + 20; // 20-50%
    const memoryUsage = (performance as any).memory 
      ? ((performance as any).memory.usedJSHeapSize / (performance as any).memory.jsHeapSizeLimit) * 100
      : Math.random() * 40 + 30;
    
    const newMetrics: SystemMetrics = {
      cpuUsage: Math.round(cpuUsage),
      memoryUsage: Math.round(memoryUsage),
      diskUsage: Math.round(Math.random() * 20 + 40), // 40-60%
      networkLatency: Math.round(dbResponseTime),
      activeConnections: Math.floor(Math.random() * 50 + 100), // 100-150
      requestRate: Math.floor(Math.random() * 200 + 300), // 300-500 req/min
      errorRate: Math.round(Math.random() * 2 * 100) / 100, // 0-2%
      timestamp: Date.now(),
    };

    // Store metrics history (last 60 points)
    metricsRef.current = [...metricsRef.current.slice(-59), newMetrics];
    setMetrics(newMetrics);

    // Check thresholds and create alerts
    const newAlerts: Partial<SystemAlert>[] = [];
    
    if (newMetrics.cpuUsage > THRESHOLDS.CPU_HIGH) {
      newAlerts.push({
        type: "CPU_HIGH",
        severity: newMetrics.cpuUsage > 90 ? "CRITICAL" : "WARNING",
        message: `CPU usage high: ${newMetrics.cpuUsage}%`,
        value: newMetrics.cpuUsage,
        threshold: THRESHOLDS.CPU_HIGH,
      });
    }

    if (newMetrics.memoryUsage > THRESHOLDS.MEMORY_HIGH) {
      newAlerts.push({
        type: "MEMORY_HIGH",
        severity: newMetrics.memoryUsage > 95 ? "CRITICAL" : "WARNING",
        message: `Memory usage high: ${newMetrics.memoryUsage}%`,
        value: newMetrics.memoryUsage,
        threshold: THRESHOLDS.MEMORY_HIGH,
      });
    }

    if (newMetrics.networkLatency > THRESHOLDS.NETWORK_SLOW) {
      newAlerts.push({
        type: "NETWORK_SLOW",
        severity: newMetrics.networkLatency > 2000 ? "CRITICAL" : "WARNING",
        message: `Network latency high: ${Math.round(newMetrics.networkLatency)}ms`,
        value: newMetrics.networkLatency,
        threshold: THRESHOLDS.NETWORK_SLOW,
      });
    }

    // Save system health to database
    try {
      const healthRef = doc(dbCLevel, "system_health", "current");
      await setDoc(healthRef, {
        ...newMetrics,
        updatedAt: serverTimestamp(),
        status: newAlerts.length > 0 
          ? newAlerts.some(a => a.severity === "CRITICAL") ? "CRITICAL" : "WARNING"
          : "HEALTHY",
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save health:", e);
    }

    return newAlerts;
  }, []);

  // Subscribe to database health
  useEffect(() => {
    const unsub1 = onSnapshot(
      doc(dbCLevel, "db_health", "main"),
      (snap) => {
        const data = snap.data() as DatabaseHealth;
        if (data) {
          setDbHealth(prev => {
            const filtered = prev.filter(d => d.name !== "main");
            return [...filtered, { ...data, name: "main" }];
          });
        }
      },
      (err) => {
        console.error("Main DB health error:", err);
      }
    );

    const unsub2 = onSnapshot(
      doc(dbCLevel, "db_health", "direksi"),
      (snap) => {
        const data = snap.data() as DatabaseHealth;
        if (data) {
          setDbHealth(prev => {
            const filtered = prev.filter(d => d.name !== "direksi");
            return [...filtered, { ...data, name: "direksi" }];
          });
        }
      },
      (err) => {
        console.error("Direksi DB health error:", err);
      }
    );

    // Initialize default health data
    const initHealth = async () => {
      try {
        const mainRef = doc(dbCLevel, "db_health", "main");
        const direksiRef = doc(dbCLevel, "db_health", "direksi");
        
        await setDoc(mainRef, {
          name: "main",
          status: "HEALTHY",
          responseTime: 50,
          connections: 150,
          pendingWrites: 0,
          documentCount: 0,
          lastChecked: serverTimestamp(),
        }, { merge: true });

        await setDoc(direksiRef, {
          name: "direksi",
          status: "HEALTHY",
          responseTime: 45,
          connections: 50,
          pendingWrites: 0,
          documentCount: 0,
          lastChecked: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.error("Init health error:", err);
      }
    };

    initHealth();

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Subscribe to alerts
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "system_alerts"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as SystemAlert));
      setAlerts(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Collect metrics periodically
  useEffect(() => {
    collectMetrics();
    const interval = setInterval(collectMetrics, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [collectMetrics]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const alertRef = doc(dbCLevel, "system_alerts", alertId);
      await setDoc(alertRef, { acknowledged: true }, { merge: true });
    } catch (e) {
      console.error("Failed to acknowledge alert:", e);
    }
  }, []);

  // Get health status color
  const getHealthStatus = () => {
    if (!metrics) return "UNKNOWN";
    if (metrics.cpuUsage > 90 || metrics.memoryUsage > 95) return "CRITICAL";
    if (metrics.cpuUsage > 80 || metrics.memoryUsage > 85 || metrics.networkLatency > 1000) return "WARNING";
    return "HEALTHY";
  };

  return {
    loading,
    metrics,
    dbHealth,
    alerts,
    metricsHistory: metricsRef.current,
    healthStatus: getHealthStatus(),
    acknowledgeAlert,
    thresholds: THRESHOLDS,
  };
};

export default useCTOSystemHealth;
