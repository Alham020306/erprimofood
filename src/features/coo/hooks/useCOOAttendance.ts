import { useState, useEffect, useCallback } from "react";
import {
  subscribeMyAttendance,
  subscribeAllAttendance,
  clockIn,
  clockOut,
  canClockIn,
  canClockOut,
  getTodayAttendance,
  getAttendanceStats,
  ClockRecord,
  ClockAttendanceStatus,
} from "../../hr/services/hrClockAttendanceService";

// Re-export types
export type { ClockRecord, ClockAttendanceStatus };

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  sickDays: number;
  leaveDays: number;
  wfaDays: number;
  averageWorkHours: number;
}

export const useCOOAttendance = (user: any) => {
  const [todayAttendance, setTodayAttendance] = useState<ClockRecord | null>(null);
  const [myAttendanceHistory, setMyAttendanceHistory] = useState<ClockRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<ClockRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    sickDays: 0,
    leaveDays: 0,
    wfaDays: 0,
    averageWorkHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // COO can view all C-Level attendance records
  const canViewAllRecords = true;

  // Subscribe to attendance data
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let isMounted = true;
    let unsubMy: (() => void) | null = null;
    let unsubAll: (() => void) | null = null;

    const setupSubscriptions = async () => {
      try {
        // Get today's attendance - using user.uid as employeeId for C-Level
        const todayRecord = await getTodayAttendance(user.uid, todayStr);
        if (isMounted) {
          setTodayAttendance(todayRecord);
        }

        // Subscribe to my attendance history
        unsubMy = subscribeMyAttendance(
          user.uid,
          currentMonth,
          currentYear,
          (records) => {
            if (isMounted) {
              setMyAttendanceHistory(records);
              const hrStats = getAttendanceStats(records);
              setStats({
                totalDays: hrStats.totalDays,
                presentDays: hrStats.presentDays,
                lateDays: hrStats.lateDays,
                absentDays: hrStats.absentDays,
                sickDays: hrStats.sickDays,
                leaveDays: hrStats.leaveDays,
                wfaDays: hrStats.wfaDays || 0,
                averageWorkHours: hrStats.averageWorkHours,
              });
            }
          }
        );

        // Subscribe to all attendance (COO can monitor all C-Level)
        if (canViewAllRecords) {
          unsubAll = subscribeAllAttendance(todayStr, (records) => {
            if (isMounted) {
              setAllAttendance(records);
            }
          });
        }
      } catch (err: any) {
        console.error("Error setting up COO attendance:", err);
        if (isMounted) {
          setError(err?.message || "Failed to load attendance data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupSubscriptions();

    return () => {
      isMounted = false;
      if (unsubMy) unsubMy();
      if (unsubAll) unsubAll();
    };
  }, [user?.uid, todayStr, currentMonth, currentYear, canViewAllRecords]);

  // Check if can clock in
  const checkClockIn = useCallback(async (): Promise<{
    canClock: boolean;
    message: string;
  }> => {
    if (!user?.uid) return { canClock: false, message: "User not found" };
    const result = await canClockIn(user.uid);
    setTodayAttendance(result.todayAttendance || null);
    return result;
  }, [user]);

  // Check if can clock out
  const checkClockOut = useCallback(async (): Promise<{
    canClock: boolean;
    message: string;
    hoursWorked?: number;
  }> => {
    if (!user?.uid) return { canClock: false, message: "User not found" };
    const result = await canClockOut(user.uid);
    setTodayAttendance(result.todayAttendance || null);
    return result;
  }, [user]);

  // Perform clock in (with photo)
  const doClockIn = useCallback(
    async (photoBlob: Blob, location?: { lat: number; lng: number }, notes?: string) => {
      console.log("COO doClockIn called:", { size: photoBlob.size, type: photoBlob.type });
      if (!user) throw new Error("Not authenticated");

      try {
        setProcessing(true);

        const result = await clockIn(
          user.uid,
          user.name || user.email || "COO",
          "C-Level", // department
          user.role || "COO", // position
          user.role || "COO",
          photoBlob,
          location,
          notes
        );
        console.log("COO clockIn result:", result);

        // Refresh today's attendance
        const today = await getTodayAttendance(user.uid, todayStr);
        setTodayAttendance(today);

        return result;
      } catch (error: any) {
        console.error("Error in COO doClockIn:", error);
        throw error;
      } finally {
        setProcessing(false);
      }
    },
    [user, todayStr]
  );

  // Perform clock out (with photo)
  const doClockOut = useCallback(
    async (photoBlob: Blob, location?: { lat: number; lng: number }, notes?: string) => {
      console.log("COO doClockOut called:", { size: photoBlob.size, type: photoBlob.type });
      if (!todayAttendance?.id) throw new Error("No attendance record found");

      try {
        setProcessing(true);

        await clockOut(todayAttendance.id, photoBlob, location, notes);
        console.log("COO clockOut successful");

        // Refresh today's attendance
        const today = await getTodayAttendance(user!.uid, todayStr);
        setTodayAttendance(today);
      } catch (error: any) {
        console.error("Error in COO doClockOut:", error);
        throw error;
      } finally {
        setProcessing(false);
      }
    },
    [todayAttendance, user, todayStr]
  );

  // Get attendance by date range
  const getHistoryByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      return myAttendanceHistory.filter(
        (record) => record.date >= startDate && record.date <= endDate
      );
    },
    [myAttendanceHistory]
  );

  // Helper: Get status label
  const getStatusLabel = (status: ClockAttendanceStatus): string => {
    const labels: Record<ClockAttendanceStatus, string> = {
      PRESENT: "Hadir",
      LATE: "Terlambat",
      ABSENT: "Tidak Hadir",
      SICK: "Sakit",
      LEAVE: "Cuti",
      WFA: "WFH",
    };
    return labels[status] || status;
  };

  // Helper: Get status color
  const getStatusColor = (status: ClockAttendanceStatus): string => {
    const colors: Record<ClockAttendanceStatus, string> = {
      PRESENT: "bg-emerald-100 text-emerald-700",
      LATE: "bg-amber-100 text-amber-700",
      ABSENT: "bg-rose-100 text-rose-700",
      SICK: "bg-blue-100 text-blue-700",
      LEAVE: "bg-purple-100 text-purple-700",
      WFA: "bg-cyan-100 text-cyan-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  return {
    // Data
    todayAttendance,
    myAttendanceHistory,
    allAttendance,
    stats,
    loading,
    processing,
    error,
    todayStr,
    currentMonth,
    currentYear,
    canViewAllRecords,

    // Helpers
    getStatusLabel,
    getStatusColor,

    // Actions
    checkClockIn,
    checkClockOut,
    doClockIn,
    doClockOut,
    getHistoryByDateRange,
  };
};
