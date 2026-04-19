import { useEffect, useMemo, useState, useCallback } from "react";
import {
  subscribeAttendance,
  subscribePayroll,
  subscribePayrollRules,
  initializeAttendance,
  updateAttendanceDay,
  markAllDays,
  calculatePayroll,
  submitPayrollToCFO,
  getPayrollRule,
  getPayrollSummary,
  getDaysInMonth,
  EmployeeAttendance,
  EmployeePayroll,
  PayrollRule,
  AttendanceStatus,
} from "../services/hrAttendanceService";
import { HREmployee } from "../services/hrEmployeeService";

export const useHRAttendance = (
  user: { uid: string; fullName: string } | null,
  employees: HREmployee[],
  month: number,
  year: number
) => {
  const [attendanceRecords, setAttendanceRecords] = useState<EmployeeAttendance[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<EmployeePayroll[]>([]);
  const [payrollRules, setPayrollRules] = useState<PayrollRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<EmployeeAttendance | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<EmployeePayroll | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    totalGrossSalary: 0,
    totalDeductions: 0,
    totalNetSalary: 0,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  });

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);

  // Subscribe to data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubAttendance = subscribeAttendance(month, year, setAttendanceRecords);
    const unsubPayroll = subscribePayroll(month, year, setPayrollRecords);
    const unsubRules = subscribePayrollRules(setPayrollRules);

    // Load summary
    getPayrollSummary(month, year).then(setPayrollSummary).catch(console.error);

    setLoading(false);

    return () => {
      unsubAttendance();
      unsubPayroll();
      unsubRules();
    };
  }, [user, month, year]);

  // Check which employees have attendance initialized
  const employeeAttendanceStatus = useMemo(() => {
    const map = new Map<string, { initialized: boolean; recordId?: string }>();
    
    employees.forEach((emp) => {
      const record = attendanceRecords.find(
        (r) => r.employeeId === emp.id && r.month === month && r.year === year
      );
      map.set(emp.id!, { initialized: !!record, recordId: record?.id });
    });
    
    return map;
  }, [employees, attendanceRecords, month, year]);

  // Initialize attendance for employee
  const initAttendance = useCallback(
    async (employee: HREmployee, markAllPresent: boolean = false) => {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Initializing attendance for:", {
        id: employee.id,
        name: employee.fullName,
        department: employee.department,
        position: employee.position,
        month,
        year,
      });
      
      return await initializeAttendance(
        employee.id!,
        employee.fullName,
        employee.department,
        employee.position,
        month,
        year,
        user.uid,
        markAllPresent
      );
    },
    [user, month, year]
  );

  // Update attendance day
  const updateDay = useCallback(
    async (attendanceId: string, dateStr: string, status: AttendanceStatus, notes?: string, overtimeHours?: number) => {
      await updateAttendanceDay(attendanceId, dateStr, status, notes, overtimeHours);
    },
    []
  );

  // Mark all days
  const markAll = useCallback(
    async (attendanceId: string, status: AttendanceStatus) => {
      await markAllDays(attendanceId, status);
    },
    []
  );

  // Calculate payroll for employee
  const calcPayroll = useCallback(
    async (attendance: EmployeeAttendance) => {
      if (!user) throw new Error("User not authenticated");
      
      console.log("Calculating payroll for:", {
        employeeId: attendance.employeeId,
        name: attendance.employeeName,
        dept: attendance.department,
        position: attendance.position,
        attendanceSummary: attendance.summary,
      });
      
      const rule = await getPayrollRule(attendance.department, attendance.position);
      
      console.log("Found payroll rule:", rule);
      
      if (!rule) {
        throw new Error(`No payroll rule found for ${attendance.department} - ${attendance.position}. Please configure payroll rules first.`);
      }
      
      // Find employee to get their base salary from profile
      const employee = employees.find(e => e.id === attendance.employeeId);
      const employeeBaseSalary = employee?.salary;
      
      console.log("Employee base salary from profile:", employeeBaseSalary);
      console.log("Rule base salary:", rule.baseSalary);
      
      const finalBaseSalary = (rule.baseSalary > 0 ? rule.baseSalary : employeeBaseSalary) || 0;
      console.log("Final base salary used:", finalBaseSalary);
      
      if (finalBaseSalary === 0) {
        throw new Error(`Base salary is 0. Please either: 1) Set base salary in payroll rules, or 2) Set salary in employee profile.`);
      }
      
      return await calculatePayroll(attendance, rule, user.uid, employeeBaseSalary);
    },
    [user, employees]
  );

  // Calculate all payrolls
  const calcAllPayrolls = useCallback(
    async () => {
      if (!user) throw new Error("User not authenticated");
      
      const results = [];
      for (const attendance of attendanceRecords) {
        try {
          const rule = await getPayrollRule(attendance.department, attendance.position);
          if (rule) {
            // Find employee to get their base salary from profile
            const employee = employees.find(e => e.id === attendance.employeeId);
            const employeeBaseSalary = employee?.salary;
            
            const payrollId = await calculatePayroll(attendance, rule, user.uid, employeeBaseSalary);
            results.push({ employeeId: attendance.employeeId, success: true, payrollId });
          } else {
            results.push({ employeeId: attendance.employeeId, success: false, error: "No rule" });
          }
        } catch (err) {
          results.push({ employeeId: attendance.employeeId, success: false, error: String(err) });
        }
      }
      return results;
    },
    [user, attendanceRecords, employees]
  );

  // Submit to CFO
  const submitToCFO = useCallback(
    async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Check if all employees have payroll calculated
      const employeesWithoutPayroll = employees.filter((emp) => {
        const hasPayroll = payrollRecords.some(
          (p) => p.employeeId === emp.id && (p.status === "CALCULATED" || p.status === "APPROVED" || p.status === "SUBMITTED")
        );
        return !hasPayroll;
      });
      
      if (employeesWithoutPayroll.length > 0) {
        throw new Error(`${employeesWithoutPayroll.length} employees don't have calculated payroll. Please calculate all payrolls first.`);
      }
      
      const submittedCount = await submitPayrollToCFO(month, year, user.uid);
      return submittedCount;
    },
    [user, month, year, employees, payrollRecords]
  );

  // Get payroll for employee
  const getEmployeePayroll = useCallback(
    (employeeId: string) => {
      return payrollRecords.find(
        (p) => p.employeeId === employeeId && p.month === month && p.year === year
      );
    },
    [payrollRecords, month, year]
  );

  return {
    loading,
    attendanceRecords,
    payrollRecords,
    payrollRules,
    daysInMonth,
    employeeAttendanceStatus,
    payrollSummary,
    selectedEmployee,
    setSelectedEmployee,
    selectedAttendance,
    setSelectedAttendance,
    selectedPayroll,
    setSelectedPayroll,
    isAttendanceModalOpen,
    setIsAttendanceModalOpen,
    isPayrollModalOpen,
    setIsPayrollModalOpen,
    isRulesModalOpen,
    setIsRulesModalOpen,
    initAttendance,
    updateDay,
    markAll,
    calcPayroll,
    calcAllPayrolls,
    submitToCFO,
    getEmployeePayroll,
  };
};
