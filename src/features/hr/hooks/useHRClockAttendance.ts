import { useState, useEffect, useCallback } from "react";
import {
  subscribeAllAttendance,
  subscribeAllAttendanceByMonth,
  subscribeMyAttendance,
  clockIn,
  clockOut,
  canClockIn,
  canClockOut,
  markAttendanceStatus,
  getTodayAttendance,
  getDailySummary,
  getAttendanceStats,
  ClockRecord,
  ClockAttendanceStatus,
  DailyAttendanceSummary,
} from "../services/hrClockAttendanceService";
import { HREmployee } from "../services/hrEmployeeService";

export const useHRClockAttendance = (
  user: { uid: string; fullName: string; role: string } | null,
  employee: HREmployee | null,
  selectedDate?: string,
  selectedMonth?: number,
  selectedYear?: number,
  isHR: boolean = false,
  isCEO: boolean = false,
  isCOO: boolean = false,
  isCFO: boolean = false,
  isCTO: boolean = false,
  isCMO: boolean = false,
  isADMIN: boolean = false,
  isSECRETARY: boolean = false
) => {
  // Only HR and CEO can view all attendance records
  const canViewAllRecords = isHR || isCEO;
  const [todayAttendance, setTodayAttendance] = useState<ClockRecord | null>(null);
  const [myAttendanceHistory, setMyAttendanceHistory] = useState<ClockRecord[]>([]);
  const [allAttendance, setAllAttendance] = useState<ClockRecord[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<ClockRecord[]>([]);
  const [dailySummary, setDailySummary] = useState<DailyAttendanceSummary | null>(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    sickDays: 0,
    leaveDays: 0,
    averageWorkHours: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const currentMonth = selectedMonth ?? today.getMonth() + 1;
  const currentYear = selectedYear ?? today.getFullYear();
  const activeDate = selectedDate ?? todayStr;

  // Subscribe to today's attendance for current user
  useEffect(() => {
    if (!user || !employee) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let isMounted = true;
    let unsubMy: (() => void) | null = null;
    let unsubAll: (() => void) | null = null;
    let unsubMonthly: (() => void) | null = null;

    const setupSubscriptions = async () => {
      try {
        // Get today's attendance
        const todayRecord = await getTodayAttendance(employee.id!, activeDate);
        if (isMounted) {
          setTodayAttendance(todayRecord);
        }

        // Subscribe to my attendance history
        unsubMy = subscribeMyAttendance(
          employee.id!,
          currentMonth,
          currentYear,
          (records) => {
            if (isMounted) {
              setMyAttendanceHistory(records);
              setStats(getAttendanceStats(records));
            }
          }
        );

        // Subscribe to all attendance only if HR or CEO
        if (canViewAllRecords) {
          unsubAll = subscribeAllAttendance(activeDate, (records) => {
            if (isMounted) {
              setAllAttendance(records);
            }
          });
          unsubMonthly = subscribeAllAttendanceByMonth(currentMonth, currentYear, (records) => {
            if (isMounted) {
              setMonthlyAttendance(records);
            }
          });

          // Get daily summary
          const summary = await getDailySummary(activeDate);
          if (isMounted) {
            setDailySummary(summary);
          }
        }
      } catch (err: any) {
        console.error("Error setting up attendance subscriptions:", err);
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
      if (unsubMonthly) unsubMonthly();
    };
  }, [user?.uid, employee?.id, canViewAllRecords, activeDate, currentMonth, currentYear]);

  // Check if can clock in
  const checkClockIn = useCallback(async (): Promise<{
    canClock: boolean;
    message: string;
  }> => {
    if (!employee) return { canClock: false, message: "Employee data not found" };
    const result = await canClockIn(employee.id!);
    setTodayAttendance(result.todayAttendance || null);
    return result;
  }, [employee]);

  // Check if can clock out
  const checkClockOut = useCallback(async (): Promise<{
    canClock: boolean;
    message: string;
    hoursWorked?: number;
  }> => {
    if (!employee) return { canClock: false, message: "Employee data not found" };
    const result = await canClockOut(employee.id!);
    setTodayAttendance(result.todayAttendance || null);
    return result;
  }, [employee]);

  // Perform clock in
  const doClockIn = useCallback(
    async (photoBlob: Blob, location?: { lat: number; lng: number }, notes?: string) => {
      console.log("doClockIn called with blob:", { size: photoBlob.size, type: photoBlob.type });
      if (!user || !employee) throw new Error("Not authenticated");

      try {
        const result = await clockIn(
          employee.id!,
          employee.fullName,
          employee.department,
          employee.position,
          user.role,
          photoBlob,
          location,
          notes
        );
        console.log("clockIn result:", result);

        // Refresh today's attendance
        const today = await getTodayAttendance(employee.id!, todayStr);
        setTodayAttendance(today);

        return result;
      } catch (error: any) {
        console.error("Error in doClockIn:", error);
        throw error;
      }
    },
    [user, employee, todayStr]
  );

  // Perform clock out
  const doClockOut = useCallback(
    async (photoBlob: Blob, location?: { lat: number; lng: number }, notes?: string) => {
      console.log("doClockOut called with blob:", { size: photoBlob.size, type: photoBlob.type });
      if (!todayAttendance?.id) throw new Error("No attendance record found");

      try {
        await clockOut(todayAttendance.id, photoBlob, location, notes);
        console.log("clockOut successful");

        // Refresh today's attendance
        const today = await getTodayAttendance(employee!.id!, todayStr);
        setTodayAttendance(today);
      } catch (error: any) {
        console.error("Error in doClockOut:", error);
        throw error;
      }
    },
    [todayAttendance, employee, todayStr]
  );

  // Mark status (for HR) - only for non-clock statuses
  const markStatus = useCallback(
    async (attendanceId: string, status: "ABSENT" | "SICK" | "LEAVE" | "WFA", notes?: string) => {
      if (!isHR && !isCEO) throw new Error("Unauthorized");
      await markAttendanceStatus(attendanceId, status, notes);
    },
    [isHR, isCEO, isCOO, isCFO, isCTO, isCMO, canViewAllRecords]
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

  return {
    // Data
    todayAttendance,
    myAttendanceHistory,
    allAttendance,
    monthlyAttendance,
    dailySummary,
    stats,
    loading,
    error,
    todayStr,
    currentMonth,
    currentYear,
    canViewAllRecords,

    // Actions
    checkClockIn,
    checkClockOut,
    doClockIn,
    doClockOut,
    markStatus,
    getHistoryByDateRange,
  };
};
