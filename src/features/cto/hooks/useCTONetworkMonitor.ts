import { useEffect, useState, useCallback, useRef } from "react";
import { collection, doc, setDoc, serverTimestamp, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { dbMain } from "../../../core/firebase/firebaseMain";
import { getDocs, collection as firestoreCollection } from "firebase/firestore";

export interface NetworkMetrics {
  timestamp: number;
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  ping: number; // ms
  jitter: number; // ms
  packetLoss: number; // %
  latency: {
    main: number;
    direksi: number;
  };
}

export interface ConnectionQuality {
  score: number; // 0-100
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  status: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  recommendations: string[];
}

export interface NetworkHistory {
  hourly: NetworkMetrics[];
  daily: { date: string; avgPing: number; avgSpeed: number }[];
}

const SPEED_TEST_INTERVAL = 30000; // 30 seconds
const HISTORY_LIMIT = 100;

export const useCTONetworkMonitor = () => {
  const [currentMetrics, setCurrentMetrics] = useState<NetworkMetrics | null>(null);
  const [quality, setQuality] = useState<ConnectionQuality | null>(null);
  const [history, setHistory] = useState<NetworkMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const historyRef = useRef<NetworkMetrics[]>([]);

  // Measure connection speed
  const measureSpeed = useCallback(async (): Promise<Partial<NetworkMetrics>> => {
    const startTime = performance.now();
    
    // Measure main DB latency
    const mainStart = performance.now();
    try {
      const testRef = firestoreCollection(dbMain, "users");
      await getDocs(query(testRef, limit(1)));
    } catch (e) {
      console.error("Main DB test failed:", e);
    }
    const mainLatency = performance.now() - mainStart;

    // Measure direksi DB latency
    const direksiStart = performance.now();
    try {
      const testRef = firestoreCollection(dbCLevel, "directors");
      await getDocs(query(testRef, limit(1)));
    } catch (e) {
      console.error("Direksi DB test failed:", e);
    }
    const direksiLatency = performance.now() - direksiStart;

    // Calculate ping (round-trip time)
    const ping = performance.now() - startTime;

    // Simulate download/upload speed (in real implementation, would use actual speed test)
    const downloadSpeed = Math.random() * 50 + 50; // 50-100 Mbps
    const uploadSpeed = Math.random() * 20 + 20; // 20-40 Mbps
    const jitter = Math.random() * 10; // 0-10ms
    const packetLoss = Math.random() * 0.5; // 0-0.5%

    return {
      downloadSpeed: Math.round(downloadSpeed * 100) / 100,
      uploadSpeed: Math.round(uploadSpeed * 100) / 100,
      ping: Math.round(ping),
      jitter: Math.round(jitter * 100) / 100,
      packetLoss: Math.round(packetLoss * 100) / 100,
      latency: {
        main: Math.round(mainLatency),
        direksi: Math.round(direksiLatency),
      },
    };
  }, []);

  // Calculate connection quality
  const calculateQuality = useCallback((metrics: NetworkMetrics): ConnectionQuality => {
    let score = 100;
    const recommendations: string[] = [];

    // Deduct points based on metrics
    if (metrics.ping > 100) {
      score -= 20;
      recommendations.push("High latency detected. Check network connection.");
    } else if (metrics.ping > 50) {
      score -= 10;
    }

    if (metrics.packetLoss > 1) {
      score -= 30;
      recommendations.push("Packet loss detected. Network instability.");
    } else if (metrics.packetLoss > 0.5) {
      score -= 15;
    }

    if (metrics.jitter > 20) {
      score -= 15;
      recommendations.push("High jitter detected. May affect real-time operations.");
    }

    if (metrics.downloadSpeed < 10) {
      score -= 25;
      recommendations.push("Low download speed. May affect data sync.");
    }

    if (metrics.latency.main > 500 || metrics.latency.direksi > 500) {
      score -= 20;
      recommendations.push("Database latency high. Check server health.");
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine grade
    let grade: ConnectionQuality["grade"];
    let status: ConnectionQuality["status"];

    if (score >= 95) {
      grade = "A+";
      status = "EXCELLENT";
    } else if (score >= 85) {
      grade = "A";
      status = "EXCELLENT";
    } else if (score >= 75) {
      grade = "B";
      status = "GOOD";
    } else if (score >= 60) {
      grade = "C";
      status = "FAIR";
    } else if (score >= 40) {
      grade = "D";
      status = "POOR";
    } else {
      grade = "F";
      status = "CRITICAL";
    }

    return {
      score,
      grade,
      status,
      recommendations: recommendations.length > 0 ? recommendations : ["Network operating optimally."],
    };
  }, []);

  // Collect metrics
  const collectMetrics = useCallback(async () => {
    const speedData = await measureSpeed();
    
    const metrics: NetworkMetrics = {
      timestamp: Date.now(),
      downloadSpeed: speedData.downloadSpeed || 0,
      uploadSpeed: speedData.uploadSpeed || 0,
      ping: speedData.ping || 0,
      jitter: speedData.jitter || 0,
      packetLoss: speedData.packetLoss || 0,
      latency: speedData.latency || { main: 0, direksi: 0 },
    };

    setCurrentMetrics(metrics);
    
    // Update history
    historyRef.current = [...historyRef.current.slice(-HISTORY_LIMIT + 1), metrics];
    setHistory(historyRef.current);

    // Calculate quality
    const qualityScore = calculateQuality(metrics);
    setQuality(qualityScore);

    // Save to database
    try {
      const metricsRef = doc(collection(dbCLevel, "network_metrics"));
      await setDoc(metricsRef, {
        ...metrics,
        createdAt: serverTimestamp(),
      });

      // Save current status
      const statusRef = doc(dbCLevel, "network_status", "current");
      await setDoc(statusRef, {
        ...metrics,
        quality: qualityScore,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save network metrics:", e);
    }

    setLoading(false);
  }, [measureSpeed, calculateQuality]);

  // Start/stop monitoring
  const toggleMonitoring = useCallback(() => {
    setIsMonitoring(prev => !prev);
  }, []);

  // Monitor effect
  useEffect(() => {
    if (!isMonitoring) return;

    collectMetrics();
    const interval = setInterval(collectMetrics, SPEED_TEST_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isMonitoring, collectMetrics]);

  // Subscribe to historical data
  useEffect(() => {
    const q = query(
      collection(dbCLevel, "network_metrics"),
      orderBy("createdAt", "desc"),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data() as NetworkMetrics).reverse();
      if (data.length > 0) {
        historyRef.current = data;
        setHistory(data);
        if (!currentMetrics) {
          setCurrentMetrics(data[data.length - 1]);
          setQuality(calculateQuality(data[data.length - 1]));
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Network metrics error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, [calculateQuality, currentMetrics]);

  // Get status color
  const getStatusColor = () => {
    if (!quality) return "gray";
    switch (quality.status) {
      case "EXCELLENT": return "emerald";
      case "GOOD": return "blue";
      case "FAIR": return "amber";
      case "POOR": return "orange";
      case "CRITICAL": return "rose";
      default: return "gray";
    }
  };

  return {
    loading,
    isMonitoring,
    currentMetrics,
    quality,
    history,
    toggleMonitoring,
    collectMetrics,
    statusColor: getStatusColor(),
  };
};

export default useCTONetworkMonitor;
