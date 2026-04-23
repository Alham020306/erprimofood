import { useEffect, useMemo, useState } from "react";
import { subscribeSummaryDoc } from "../../shared/services/directorSummaryService";
import { subscribeAdminUsers } from "../../admin/services/adminMonitoringService";
import { HREmployee } from "../services/hrEmployeeService";
import { subscribeDirectorUsers } from "../../management/services/entityManagementService";

const defaultOverview = {
  totalDrivers: 0,
  verifiedDrivers: 0,
  pendingDriverVerification: 0,
  bannedDrivers: 0,
  onlineDrivers: 0,
  offlineDrivers: 0,
  totalEmployees: 0,
};

export const useHRDashboard = () => {
  const [summaryDoc, setSummaryDoc] = useState<any | null>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs = [
      subscribeSummaryDoc("hr_people_summary", "current", (data) => {
        setSummaryDoc(data);
      }),
      subscribeAdminUsers((rows) => {
        setDrivers(rows.filter((item: any) => String(item?.role || "").toUpperCase() === "DRIVER"));
      }),
      subscribeDirectorUsers((rows) => {
        const mapped = rows.map((item: any) => ({
          id: item.id || item.uid,
          fullName: item.fullName || item.name || "-",
          email: item.email || "",
          phone: item.phone || "",
          nik: item.nik || "",
          position: item.title || item.primaryRole || "-",
          department: item.department || item.primaryRole || "-",
          employmentType: "FULL_TIME" as const,
          status: item.isSuspended
            ? "SUSPENDED"
            : item.isActive === false
            ? "INACTIVE"
            : "ACTIVE",
          joinDate: item.createdAt
            ? new Date(Number(item.createdAt)).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          gender: "MALE" as const,
          salary: Number(item.salary || 0),
        })) as HREmployee[];
        setEmployees(mapped);
        setLoading(false);
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  const driverStats = useMemo(() => {
    const total = drivers.length;
    const online = drivers.filter((d) => d?.isOnline === true).length;
    const verified = drivers.filter((d) => d?.isVerified === true).length;
    const pending = drivers.filter((d) => !d?.isVerified && !d?.isBanned).length;
    const banned = drivers.filter((d) => d?.isBanned === true).length;
    const offline = total - online;

    return {
      total,
      online,
      offline,
      verified,
      pending,
      banned,
      onlineRate: total > 0 ? Math.round((online / total) * 100) : 0,
    };
  }, [drivers]);

  const employeeStats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === "ACTIVE").length,
      inactive: employees.filter((e) => e.status === "INACTIVE").length,
      suspended: employees.filter((e) => e.status === "SUSPENDED").length,
      terminated: employees.filter((e) => e.status === "TERMINATED").length,
    };
  }, [employees]);

  const data = useMemo(() => {
    const snapshot = summaryDoc || {};

    return {
      overview: {
        ...defaultOverview,
        ...snapshot,
        totalDrivers: driverStats.total,
        verifiedDrivers: driverStats.verified,
        pendingDriverVerification: driverStats.pending,
        bannedDrivers: driverStats.banned,
        onlineDrivers: driverStats.online,
        offlineDrivers: driverStats.offline,
        totalEmployees: employeeStats.total,
      },
      drivers,
      driverStats,
      employees,
      employeeStats,
      recruitmentRows: [],
      workforceDemand: Array.isArray(snapshot.workforceDemand)
        ? snapshot.workforceDemand
        : [],
      employeeRows: employees,
    };
  }, [summaryDoc, drivers, driverStats, employees, employeeStats]);

  return {
    loading,
    ...data,
  };
};
