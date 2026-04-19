import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

export interface AttendanceRecord {
  id: string;
  directorId: string;
  directorName: string;
  directorRole: string;
  type: "CHECK_IN" | "CHECK_OUT";
  timestamp: any;
  photoUrl?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  note?: string;
  status: "ON_TIME" | "LATE" | "EARLY" | "OVERTIME";
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  earlyDepartures: number;
  overtimeDays: number;
  averageCheckIn: string;
  averageCheckOut: string;
  monthlyHours: number;
}

export const useCTOAttendance = (user: any) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Get today's date range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Subscribe to today's attendance
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(dbCLevel, "attendance"),
      where("directorId", "==", user.uid),
      where("timestamp", ">=", startOfDay),
      where("timestamp", "<", endOfDay),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
        setTodayRecord(records[0] || null);
        setLoading(false);
      },
      (err) => {
        console.error("Attendance error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // Subscribe to monthly records
  useEffect(() => {
    if (!user?.uid) return;

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const q = query(
      collection(dbCLevel, "attendance"),
      where("directorId", "==", user.uid),
      where("timestamp", ">=", startOfMonth),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const records = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
      setMonthlyRecords(records);
      
      // Calculate stats
      calculateStats(records);
    }, (err) => {
      console.error("Monthly attendance error:", err);
    });

    return () => unsub();
  }, [user?.uid]);

  // Calculate attendance stats
  const calculateStats = (records: AttendanceRecord[]) => {
    const checkIns = records.filter(r => r.type === "CHECK_IN");
    const checkOuts = records.filter(r => r.type === "CHECK_OUT");

    const stats: AttendanceStats = {
      totalDays: new Set(checkIns.map(r => {
        const date = r.timestamp?.toDate?.() || new Date();
        return date.toDateString();
      })).size,
      presentDays: checkIns.filter(r => r.status !== "LATE").length,
      lateDays: checkIns.filter(r => r.status === "LATE").length,
      earlyDepartures: checkOuts.filter(r => r.status === "EARLY").length,
      overtimeDays: checkOuts.filter(r => r.status === "OVERTIME").length,
      averageCheckIn: calculateAverageTime(checkIns),
      averageCheckOut: calculateAverageTime(checkOuts),
      monthlyHours: estimateMonthlyHours(checkIns, checkOuts),
    };

    setStats(stats);
  };

  const calculateAverageTime = (records: AttendanceRecord[]): string => {
    if (records.length === 0) return "-";
    
    const totalMinutes = records.reduce((sum, r) => {
      const date = r.timestamp?.toDate?.() || new Date();
      return sum + date.getHours() * 60 + date.getMinutes();
    }, 0);
    
    const avgMinutes = Math.round(totalMinutes / records.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const estimateMonthlyHours = (checkIns: AttendanceRecord[], checkOuts: AttendanceRecord[]): number => {
    let totalHours = 0;
    
    checkIns.forEach(checkIn => {
      const checkInDate = checkIn.timestamp?.toDate?.();
      if (!checkInDate) return;
      
      const matchingCheckOut = checkOuts.find(co => {
        const coDate = co.timestamp?.toDate?.();
        if (!coDate) return false;
        return coDate.toDateString() === checkInDate.toDateString();
      });
      
      if (matchingCheckOut) {
        const coDate = matchingCheckOut.timestamp?.toDate?.();
        if (coDate) {
          const diff = (coDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
          totalHours += Math.min(diff, 12); // Cap at 12 hours per day
        }
      }
    });
    
    return Math.round(totalHours);
  };

  // Check in/out
  const recordAttendance = useCallback(async (
    type: "CHECK_IN" | "CHECK_OUT",
    photoUrl?: string,
    location?: { lat: number; lng: number; address?: string },
    note?: string
  ): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setSubmitting(true);

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Determine status
      let status: AttendanceRecord["status"];
      if (type === "CHECK_IN") {
        if (hours < 8 || (hours === 8 && minutes <= 30)) {
          status = "ON_TIME";
        } else {
          status = "LATE";
        }
      } else {
        if (hours >= 17) {
          if (hours >= 19) {
            status = "OVERTIME";
          } else {
            status = "ON_TIME";
          }
        } else {
          status = "EARLY";
        }
      }

      const recordRef = doc(collection(dbCLevel, "attendance"));
      await setDoc(recordRef, {
        directorId: user.uid,
        directorName: user.name || user.email || "CTO",
        directorRole: user.role || "CTO",
        type,
        timestamp: serverTimestamp(),
        photoUrl: photoUrl || null,
        location: location || null,
        note: note || null,
        status,
      });

      return true;
    } catch (err) {
      console.error("Record attendance error:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user]);

  // Get status for today
  const getTodayStatus = () => {
    if (!todayRecord) return { checkedIn: false, checkedOut: false };
    return {
      checkedIn: todayRecord.type === "CHECK_IN",
      checkedOut: todayRecord.type === "CHECK_OUT",
      lastRecord: todayRecord,
    };
  };

  return {
    loading,
    submitting,
    todayRecord,
    monthlyRecords,
    stats,
    recordAttendance,
    getTodayStatus,
  };
};

export default useCTOAttendance;
