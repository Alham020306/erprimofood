import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";

const ATTENDANCE_COLLECTION = "hr_attendance";
const PAYROLL_COLLECTION = "hr_payroll";
const PAYROLL_RULES_COLLECTION = "hr_payroll_rules";

// Attendance Types
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HOLIDAY" | "OVERTIME" | "LEAVE" | "SICK";

export interface DailyAttendance {
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  notes?: string;
  checkIn?: string;
  checkOut?: string;
  overtimeHours?: number;
}

export interface EmployeeAttendance {
  id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: number; // 1-12
  year: number;
  days: DailyAttendance[];
  summary: {
    present: number;
    absent: number;
    holiday: number;
    overtime: number;
    leave: number;
    sick: number;
    totalWorkingDays: number;
    totalOvertimeHours: number;
  };
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  status: "DRAFT" | "COMPLETED" | "LOCKED";
}

// Payroll Types
export interface PayrollRule {
  id?: string;
  department: string;
  position: string;
  baseSalary: number;
  // Deductions
  absentDeductionPerDay: number;
  lateDeductionPerHour: number;
  // Overtime
  overtimeRatePerHour: number;
  overtimeRatePerDay: number;
  // Allowances
  transportAllowance: number;
  mealAllowance: number;
  // Bonus
  perfectAttendanceBonus: number;
  // Tax
  taxRate: number; // percentage
  // Effective date
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface EmployeePayroll {
  id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: number;
  year: number;
  // Attendance summary
  attendanceId: string;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  overtimeDays: number;
  totalOvertimeHours: number;
  // Salary calculation
  baseSalary: number;
  // Earnings
  transportAllowance: number;
  mealAllowance: number;
  overtimePay: number;
  perfectAttendanceBonus: number;
  otherBonus: number;
  grossSalary: number;
  // Deductions
  absentDeduction: number;
  lateDeduction: number;
  tax: number;
  otherDeduction: number;
  totalDeduction: number;
  // Final
  netSalary: number;
  // Status
  status: "DRAFT" | "CALCULATED" | "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED";
  // Approval
  submittedToCFOAt?: number;
  submittedBy?: string;
  approvedByCFOAt?: number;
  approvedByCFOName?: string;
  rejectionReason?: string;
  // Timestamps
  createdAt?: number;
  updatedAt?: number;
  calculatedAt?: number;
  calculatedBy?: string;
}

// Get days in month
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

// Get default working days (exclude weekends)
export const getDefaultWorkingDays = (year: number, month: number): string[] => {
  const days: string[] = [];
  const totalDays = getDaysInMonth(year, month);
  
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    }
  }
  
  return days;
};

// Check if date is weekend
export const isWeekend = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// Initialize attendance for employee
export const initializeAttendance = async (
  employeeId: string,
  employeeName: string,
  department: string,
  position: string,
  month: number,
  year: number,
  createdBy: string,
  markAllPresent: boolean = false
): Promise<string> => {
  try {
    // Validate inputs
    if (!employeeId) throw new Error("Employee ID is required");
    if (!employeeName) throw new Error("Employee name is required");
    if (!department) throw new Error("Department is required");
    if (!position) throw new Error("Position is required");
    if (!month || month < 1 || month > 12) throw new Error("Invalid month");
    if (!year) throw new Error("Invalid year");

    const now = Date.now();
    const totalDays = getDaysInMonth(year, month);
    
    const days: DailyAttendance[] = [];
    
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isWeekendDay = isWeekend(dateStr);
      
      const dayData: any = {
        date: dateStr,
        status: isWeekendDay ? "HOLIDAY" : "PRESENT",
      };
      // Only add notes if it's a weekend (avoid undefined)
      if (isWeekendDay) {
        dayData.notes = "Weekend";
      }
      days.push(dayData);
    }
    
    const workingDays = days.filter(d => !isWeekend(d.date)).length;
    const holidays = days.filter(d => d.status === "HOLIDAY").length;
    
    // Ensure no undefined values
    const attendanceData = {
      employeeId: employeeId || "",
      employeeName: employeeName || "",
      department: department || "",
      position: position || "",
      month: month || 0,
      year: year || 0,
      days: days || [],
      summary: {
        present: workingDays || 0,
        absent: 0,
        holiday: holidays || 0,
        overtime: 0,
        leave: 0,
        sick: 0,
        totalWorkingDays: workingDays || 0,
        totalOvertimeHours: 0,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: createdBy || "system",
      status: "DRAFT",
    };
    
    // Debug log to check for undefined values
    console.log("Saving attendance data:", JSON.stringify(attendanceData, (key, value) => 
      value === undefined ? "__UNDEFINED__" : value
    ));
    
    const docRef = await addDoc(collection(dbCLevel, ATTENDANCE_COLLECTION), {
      ...attendanceData,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error("Error initializing attendance:", error);
    throw new Error(error?.message || "Failed to initialize attendance");
  }
};

// Update attendance day
export const updateAttendanceDay = async (
  attendanceId: string,
  dateStr: string,
  status: AttendanceStatus,
  notes?: string,
  overtimeHours?: number
): Promise<void> => {
  const ref = doc(dbCLevel, ATTENDANCE_COLLECTION, attendanceId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error("Attendance not found");
  
  const data = snap.data() as EmployeeAttendance;
  const updatedDays = data.days.map((d) => {
    if (d.date === dateStr) {
      const update: any = { ...d, status };
      // Only add notes if provided (avoid undefined)
      if (notes !== undefined && notes !== null) {
        update.notes = notes;
      } else if (!notes) {
        // Remove notes field if not provided
        delete update.notes;
      }
      // Always set overtimeHours
      update.overtimeHours = status === "OVERTIME" ? (overtimeHours || 0) : 0;
      return update;
    }
    return d;
  });
  
  // Recalculate summary
  const summary = calculateAttendanceSummary(updatedDays);
  
  await updateDoc(ref, {
    days: updatedDays,
    summary,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};

// Calculate attendance summary
export const calculateAttendanceSummary = (days: DailyAttendance[]) => {
  const workingDays = days.filter(d => !isWeekend(d.date));
  
  return {
    present: days.filter((d) => d.status === "PRESENT" && !isWeekend(d.date)).length,
    absent: days.filter((d) => d.status === "ABSENT").length,
    holiday: days.filter((d) => d.status === "HOLIDAY").length,
    overtime: days.filter((d) => d.status === "OVERTIME").length,
    leave: days.filter((d) => d.status === "LEAVE").length,
    sick: days.filter((d) => d.status === "SICK").length,
    totalWorkingDays: workingDays.length,
    totalOvertimeHours: days.reduce((acc, d) => acc + (d.overtimeHours || 0), 0),
  };
};

// Mark all days with specific status (for working days only)
export const markAllDays = async (
  attendanceId: string,
  status: AttendanceStatus
): Promise<void> => {
  const ref = doc(dbCLevel, ATTENDANCE_COLLECTION, attendanceId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error("Attendance not found");
  
  const data = snap.data() as EmployeeAttendance;
  
  const updatedDays = data.days.map((d) => {
    if (isWeekend(d.date)) {
      return { ...d, status: "HOLIDAY" as AttendanceStatus };
    }
    return { ...d, status };
  });
  
  const summary = calculateAttendanceSummary(updatedDays);
  
  await updateDoc(ref, {
    days: updatedDays,
    summary,
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
};

// Subscribe to attendance records
export const subscribeAttendance = (
  month: number,
  year: number,
  callback: (records: EmployeeAttendance[]) => void
) => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_COLLECTION),
    where("month", "==", month),
    where("year", "==", year)
  );
  
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmployeeAttendance[];
    callback(records);
  });
};

// Get single attendance record
export const getAttendanceById = async (id: string): Promise<EmployeeAttendance | null> => {
  const ref = doc(dbCLevel, ATTENDANCE_COLLECTION, id);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) return null;
  
  return { id: snap.id, ...snap.data() } as EmployeeAttendance;
};

// Check if attendance exists for employee in month/year
export const checkAttendanceExists = async (
  employeeId: string,
  month: number,
  year: number
): Promise<boolean> => {
  const q = query(
    collection(dbCLevel, ATTENDANCE_COLLECTION),
    where("employeeId", "==", employeeId),
    where("month", "==", month),
    where("year", "==", year)
  );
  
  const snap = await getDocs(q);
  return !snap.empty;
};

// Delete attendance record
export const deleteAttendance = async (id: string): Promise<void> => {
  await deleteDoc(doc(dbCLevel, ATTENDANCE_COLLECTION, id));
};

// ========== PAYROLL RULES ==========

// Create/update payroll rule
export const savePayrollRule = async (rule: Omit<PayrollRule, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const now = Date.now();
  
  // Check if rule exists for this dept/position
  const q = query(
    collection(dbCLevel, PAYROLL_RULES_COLLECTION),
    where("department", "==", rule.department),
    where("position", "==", rule.position),
    where("isActive", "==", true)
  );
  
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    // Deactivate old rule
    const oldRule = snap.docs[0];
    await updateDoc(doc(dbCLevel, PAYROLL_RULES_COLLECTION, oldRule.id), {
      isActive: false,
      effectiveTo: rule.effectiveFrom,
      updatedAt: now,
    });
  }
  
  const docRef = await addDoc(collection(dbCLevel, PAYROLL_RULES_COLLECTION), {
    ...rule,
    createdAt: now,
    updatedAt: now,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });
  
  return docRef.id;
};

// Get payroll rule for employee
export const getPayrollRule = async (
  department: string,
  position: string
): Promise<PayrollRule | null> => {
  const q = query(
    collection(dbCLevel, PAYROLL_RULES_COLLECTION),
    where("department", "==", department),
    where("position", "==", position),
    where("isActive", "==", true)
  );
  
  const snap = await getDocs(q);
  
  if (snap.empty) return null;
  
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as PayrollRule;
};

// Subscribe to payroll rules
export const subscribePayrollRules = (callback: (rules: PayrollRule[]) => void) => {
  return onSnapshot(collection(dbCLevel, PAYROLL_RULES_COLLECTION), (snap) => {
    const rules = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PayrollRule[];
    callback(rules);
  });
};

// ========== PAYROLL CALCULATION ==========

// Calculate payroll based on attendance and rules
export const calculatePayroll = async (
  attendance: EmployeeAttendance,
  rule: PayrollRule,
  calculatedBy: string,
  employeeBaseSalary?: number // Optional: employee's salary from profile, overrides rule.baseSalary if rule has 0
): Promise<string> => {
  const now = Date.now();
  
  const workingDays = attendance.summary.totalWorkingDays;
  const presentDays = attendance.summary.present + attendance.summary.overtime;
  const absentDays = attendance.summary.absent;
  const overtimeDays = attendance.summary.overtime;
  const totalOvertimeHours = attendance.summary.totalOvertimeHours;
  
  // Use employee's base salary from profile if rule.baseSalary is 0, otherwise use rule
  let baseSalary = (rule.baseSalary > 0 ? rule.baseSalary : employeeBaseSalary) || 0;
  
  // Fallback: use UMR Jakarta 2024 as default if no salary configured
  if (baseSalary === 0) {
    baseSalary = 5000000; // Default UMR
    console.warn(`Using default salary (5,000,000) for ${attendance.employeeName} - please configure payroll rules or employee salary`);
  }
  
  // Base calculations
  const dailyRate = baseSalary / workingDays;
  
  // Earnings
  const transportAllowance = (rule.transportAllowance || 0) * presentDays;
  const mealAllowance = (rule.mealAllowance || 0) * presentDays;
  
  // Overtime pay
  const overtimePay = (overtimeDays * (rule.overtimeRatePerDay || 0)) + (totalOvertimeHours * (rule.overtimeRatePerHour || 0));
  
  // Perfect attendance bonus (if no absences)
  const perfectAttendanceBonus = absentDays === 0 ? (rule.perfectAttendanceBonus || 0) : 0;
  
  // Deductions
  const absentDeduction = absentDays * (rule.absentDeductionPerDay || 0);
  
  // Gross salary
  const grossSalary = baseSalary + transportAllowance + mealAllowance + overtimePay + perfectAttendanceBonus;
  
  // Tax
  const tax = (grossSalary * (rule.taxRate || 0)) / 100;
  
  // Total deductions
  const totalDeduction = absentDeduction + tax;
  
  // Net salary
  const netSalary = grossSalary - totalDeduction;
  
  const payrollData: Omit<EmployeePayroll, "id"> = {
    employeeId: attendance.employeeId,
    employeeName: attendance.employeeName,
    department: attendance.department,
    position: attendance.position,
    month: attendance.month,
    year: attendance.year,
    attendanceId: attendance.id!,
    workingDays,
    presentDays,
    absentDays,
    overtimeDays,
    totalOvertimeHours,
    baseSalary,
    transportAllowance,
    mealAllowance,
    overtimePay,
    perfectAttendanceBonus,
    otherBonus: 0,
    grossSalary,
    absentDeduction,
    lateDeduction: 0,
    tax,
    otherDeduction: 0,
    totalDeduction,
    netSalary,
    status: "CALCULATED",
    createdAt: now,
    updatedAt: now,
    calculatedAt: now,
    calculatedBy,
  };
  
  // Check if payroll exists
  const existingQuery = query(
    collection(dbCLevel, PAYROLL_COLLECTION),
    where("employeeId", "==", attendance.employeeId),
    where("month", "==", attendance.month),
    where("year", "==", attendance.year)
  );
  
  const existingSnap = await getDocs(existingQuery);
  
  if (!existingSnap.empty) {
    // Update existing
    const existingId = existingSnap.docs[0].id;
    await updateDoc(doc(dbCLevel, PAYROLL_COLLECTION, existingId), {
      ...payrollData,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    });
    return existingId;
  } else {
    // Create new
    const docRef = await addDoc(collection(dbCLevel, PAYROLL_COLLECTION), {
      ...payrollData,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    });
    return docRef.id;
  }
};

// Subscribe to payroll records
export const subscribePayroll = (
  month: number,
  year: number,
  callback: (records: EmployeePayroll[]) => void
) => {
  const q = query(
    collection(dbCLevel, PAYROLL_COLLECTION),
    where("month", "==", month),
    where("year", "==", year)
  );
  
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmployeePayroll[];
    callback(records);
  });
};

// Submit payroll to CFO
export const submitPayrollToCFO = async (
  month: number,
  year: number,
  submittedBy: string
): Promise<number> => {
  const q = query(
    collection(dbCLevel, PAYROLL_COLLECTION),
    where("month", "==", month),
    where("year", "==", year),
    where("status", "in", ["CALCULATED", "DRAFT"])
  );
  
  const snap = await getDocs(q);
  const now = Date.now();
  
  if (snap.empty) {
    throw new Error("No payroll records found to submit. Please calculate payrolls first.");
  }
  
  const updates = snap.docs.map((docSnap) =>
    updateDoc(doc(dbCLevel, PAYROLL_COLLECTION, docSnap.id), {
      status: "SUBMITTED",
      submittedToCFOAt: now,
      submittedBy,
      updatedAt: now,
      updatedAtServer: serverTimestamp(),
    })
  );
  
  await Promise.all(updates);
  return snap.docs.length;
};

// CFO approves payroll
export const approvePayrollByCFO = async (
  payrollId: string,
  cfoName: string
): Promise<void> => {
  const now = Date.now();
  
  await updateDoc(doc(dbCLevel, PAYROLL_COLLECTION, payrollId), {
    status: "APPROVED",
    approvedByCFOAt: now,
    approvedByCFOName: cfoName,
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });
};

// CFO rejects payroll
export const rejectPayrollByCFO = async (
  payrollId: string,
  reason: string
): Promise<void> => {
  const now = Date.now();
  
  await updateDoc(doc(dbCLevel, PAYROLL_COLLECTION, payrollId), {
    status: "REJECTED",
    rejectionReason: reason,
    updatedAt: now,
    updatedAtServer: serverTimestamp(),
  });
};

// Get payroll summary for month
export const getPayrollSummary = async (month: number, year: number) => {
  const q = query(
    collection(dbCLevel, PAYROLL_COLLECTION),
    where("month", "==", month),
    where("year", "==", year)
  );
  
  const snap = await getDocs(q);
  const records = snap.docs.map((d) => d.data() as EmployeePayroll);
  
  return {
    totalEmployees: records.length,
    totalGrossSalary: records.reduce((acc, r) => acc + r.grossSalary, 0),
    totalDeductions: records.reduce((acc, r) => acc + r.totalDeduction, 0),
    totalNetSalary: records.reduce((acc, r) => acc + r.netSalary, 0),
    approvedCount: records.filter((r) => r.status === "APPROVED").length,
    pendingCount: records.filter((r) => r.status === "CALCULATED" || r.status === "SUBMITTED").length,
    rejectedCount: records.filter((r) => r.status === "REJECTED").length,
    submittedCount: records.filter((r) => r.status === "SUBMITTED").length,
  };
};
