import { useEffect, useState, useCallback } from "react";
import { collection, doc, setDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
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
  workMode?: "OFFICE" | "REMOTE" | "FIELD";
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  earlyDepartures: number;
  overtimeDays: number;
  workFromHomeDays: number;
  fieldWorkDays: number;
  averageCheckIn: string;
  averageCheckOut: string;
  monthlyHours: number;
  attendanceRate: number;
}

export interface DirectorAttendanceSummary {
  directorId: string;
  name: string;
  role: string;
  checkIns: number;
  checkOuts: number;
  lateCount: number;
  earlyDepartureCount: number;
  overtimeCount: number;
  workFromHomeCount: number;
  lastCheckIn?: any;
  lastCheckOut?: any;
  attendanceRate: number;
}

export const useCEOAttendance = (user: any) => {
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);
  const [allDirectorsStats, setAllDirectorsStats] = useState<DirectorAttendanceSummary[]>([]);
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
      where("timestamp", "<", endOfDay)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const records = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord))
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
            const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
            return bTime - aTime;
          });
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
      where("timestamp", ">=", startOfMonth)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const records = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord))
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
            const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
            return bTime - aTime;
          });
        setMonthlyRecords(records);
        calculateStats(records);
      },
      (err) => {
        console.error("Monthly attendance error:", err);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // Subscribe to all attendance (CEO/HR view)
  useEffect(() => {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const q = query(
      collection(dbCLevel, "attendance"),
      where("timestamp", ">=", startOfMonth)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const records = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
        setAllAttendance(records);
        
        // Calculate stats for all directors
        calculateAllDirectorsStats(records);
      },
      (err) => {
        console.error("All attendance error:", err);
      }
    );

    return () => unsub();
  }, []);

  // Calculate stats for all directors (like HR)
  const calculateAllDirectorsStats = (records: AttendanceRecord[]) => {
    const byDirector = new Map<string, DirectorAttendanceSummary>();

    records.forEach((record) => {
      const existing = byDirector.get(record.directorId) || {
        directorId: record.directorId,
        name: record.directorName,
        role: record.directorRole,
        checkIns: 0,
        checkOuts: 0,
        lateCount: 0,
        earlyDepartureCount: 0,
        overtimeCount: 0,
        workFromHomeCount: 0,
        lastCheckIn: null,
        lastCheckOut: null,
        attendanceRate: 0,
      };

      if (record.type === "CHECK_IN") {
        existing.checkIns++;
        if (record.status === "LATE") existing.lateCount++;
        if (record.workMode === "REMOTE") existing.workFromHomeCount++;
        if (!existing.lastCheckIn || record.timestamp > existing.lastCheckIn) {
          existing.lastCheckIn = record.timestamp;
        }
      }

      if (record.type === "CHECK_OUT") {
        existing.checkOuts++;
        if (record.status === "EARLY") existing.earlyDepartureCount++;
        if (record.status === "OVERTIME") existing.overtimeCount++;
        if (!existing.lastCheckOut || record.timestamp > existing.lastCheckOut) {
          existing.lastCheckOut = record.timestamp;
        }
      }

      byDirector.set(record.directorId, existing);
    });

    // Calculate attendance rate
    const workingDays = Math.min(22, today.getDate());
    const directors = Array.from(byDirector.values()).map((d) => ({
      ...d,
      attendanceRate: Math.round((d.checkIns / workingDays) * 100),
    }));

    setAllDirectorsStats(directors);
  };

  // Calculate attendance stats
  const calculateStats = (records: AttendanceRecord[]) => {
    const checkIns = records.filter((r) => r.type === "CHECK_IN");
    const checkOuts = records.filter((r) => r.type === "CHECK_OUT");

    const uniqueDays = new Set(
      checkIns.map((r) => {
        const date = r.timestamp?.toDate ? r.timestamp.toDate() : new Date();
        return date.toDateString();
      })
    );

    const presentDays = uniqueDays.size;
    const workingDays = Math.min(22, today.getDate()); // Estimate working days

    const stats: AttendanceStats = {
      totalDays: workingDays,
      presentDays,
      lateDays: checkIns.filter((r) => r.status === "LATE").length,
      earlyDepartures: checkOuts.filter((r) => r.status === "EARLY").length,
      overtimeDays: checkOuts.filter((r) => r.status === "OVERTIME").length,
      workFromHomeDays: checkIns.filter((r) => r.workMode === "REMOTE").length,
      fieldWorkDays: checkIns.filter((r) => r.workMode === "FIELD").length,
      averageCheckIn: calculateAverageTime(checkIns),
      averageCheckOut: calculateAverageTime(checkOuts),
      monthlyHours: estimateMonthlyHours(checkIns, checkOuts),
      attendanceRate: Math.round((presentDays / workingDays) * 100),
    };

    setStats(stats);
  };

  const calculateAverageTime = (records: AttendanceRecord[]): string => {
    if (records.length === 0) return "-";

    const totalMinutes = records.reduce((sum, r) => {
      const date = r.timestamp?.toDate ? r.timestamp.toDate() : new Date();
      return sum + date.getHours() * 60 + date.getMinutes();
    }, 0);

    const avgMinutes = Math.round(totalMinutes / records.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const estimateMonthlyHours = (checkIns: AttendanceRecord[], checkOuts: AttendanceRecord[]): number => {
    let totalHours = 0;

    checkIns.forEach((checkIn) => {
      const checkInDate = checkIn.timestamp?.toDate ? checkIn.timestamp.toDate() : null;
      if (!checkInDate) return;

      const matchingCheckOut = checkOuts.find((co) => {
        const coDate = co.timestamp?.toDate ? co.timestamp.toDate() : null;
        if (!coDate) return false;
        return coDate.toDateString() === checkInDate.toDateString();
      });

      if (matchingCheckOut) {
        const coDate = matchingCheckOut.timestamp?.toDate ? matchingCheckOut.timestamp.toDate() : null;
        if (coDate) {
          const diff = (coDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
          totalHours += Math.min(diff, 12);
        }
      }
    });

    return Math.round(totalHours);
  };

  // Check in/out
  const recordAttendance = useCallback(
    async (
      type: "CHECK_IN" | "CHECK_OUT",
      photoUrl?: string,
      location?: { lat: number; lng: number; address?: string },
      note?: string,
      workMode?: "OFFICE" | "REMOTE" | "FIELD"
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
          directorName: user.name || user.email || "CEO",
          directorRole: user.role || "CEO",
          type,
          timestamp: serverTimestamp(),
          photoUrl: photoUrl || null,
          location: location || null,
          note: note || null,
          workMode: workMode || "OFFICE",
          status,
        });

        return true;
      } catch (err) {
        console.error("Record attendance error:", err);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [user]
  );

  // Get today's status
  const getTodayStatus = () => {
    if (!todayRecord) return { checkedIn: false, checkedOut: false, canCheckIn: true };
    return {
      checkedIn: todayRecord.type === "CHECK_IN",
      checkedOut: todayRecord.type === "CHECK_OUT",
      lastRecord: todayRecord,
      canCheckIn: todayRecord.type === "CHECK_OUT",
    };
  };

  // Get attendance by role
  const getAttendanceByRole = useCallback(
    (role: string) => {
      return allAttendance.filter((a) => a.directorRole === role);
    },
    [allAttendance]
  );

  // Get attendance summary for all directors
  const getAllDirectorsSummary = useCallback(() => {
    const byDirector = new Map<string, { name: string; role: string; checkIns: number; checkOuts: number }>();

    allAttendance.forEach((record) => {
      const existing = byDirector.get(record.directorId) || {
        name: record.directorName,
        role: record.directorRole,
        checkIns: 0,
        checkOuts: 0,
      };

      if (record.type === "CHECK_IN") existing.checkIns++;
      if (record.type === "CHECK_OUT") existing.checkOuts++;

      byDirector.set(record.directorId, existing);
    });

    return Array.from(byDirector.entries()).map(([id, data]) => ({ id, ...data }));
  }, [allAttendance]);

  return {
    loading,
    submitting,
    todayRecord,
    monthlyRecords,
    allAttendance,
    allDirectorsStats,
    stats,
    recordAttendance,
    getTodayStatus,
    getAttendanceByRole,
    getAllDirectorsSummary,
  };
};

export default useCEOAttendance;
