import { useState, useMemo } from "react";
import {
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  UserCheck,
  Sun,
  Moon,
  AlertCircle,
  Calculator,
  Send,
  FileText,
  Briefcase,
} from "lucide-react";
import { useHRAttendance } from "../hooks/useHRAttendance";
import { useHREmployees } from "../hooks/useHREmployees";
import { AttendanceStatus, getDaysInMonth } from "../services/hrAttendanceService";
import { UserRole } from "../../../core/types/roles";
import { DirectorUser } from "../../../core/types/auth";
import HRMetricCard from "../components/HRMetricCard";
import HRPayrollRulesModal from "../components/HRPayrollRulesModal";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STATUS_CONFIG: Record<AttendanceStatus, { color: string; bg: string; label: string; icon: typeof Check }> = {
  PRESENT: { color: "text-emerald-600", bg: "bg-emerald-100", label: "Present", icon: Check },
  ABSENT: { color: "text-rose-600", bg: "bg-rose-100", label: "Absent", icon: X },
  HOLIDAY: { color: "text-slate-600", bg: "bg-white", label: "Holiday", icon: Sun },
  OVERTIME: { color: "text-amber-600", bg: "bg-amber-100", label: "Overtime", icon: Moon },
  LEAVE: { color: "text-blue-600", bg: "bg-blue-100", label: "Leave", icon: Clock },
  SICK: { color: "text-violet-600", bg: "bg-violet-100", label: "Sick", icon: AlertCircle },
};

// Safe number formatter
const formatRupiah = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return value.toLocaleString("id-ID");
};

type Props = {
  user: DirectorUser;
};

export default function HRAttendancePage({ user }: Props) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showPayrollRules, setShowPayrollRules] = useState(false);
  const [showPayrollSummary, setShowPayrollSummary] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { items: employees } = useHREmployees();
  const {
    loading,
    attendanceRecords,
    payrollRecords,
    payrollRules,
    daysInMonth,
    employeeAttendanceStatus,
    payrollSummary,
    initAttendance,
    updateDay,
    markAll,
    calcPayroll,
    calcAllPayrolls,
    submitToCFO,
    getEmployeePayroll,
  } = useHRAttendance(user, employees, month, year);

  const selectedEmployee = useMemo(() => 
    employees.find((e) => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  const selectedAttendance = useMemo(() =>
    attendanceRecords.find((r) => r.employeeId === selectedEmployeeId),
    [attendanceRecords, selectedEmployeeId]
  );

  const selectedPayroll = useMemo(() =>
    getEmployeePayroll(selectedEmployeeId || ""),
    [getEmployeePayroll, selectedEmployeeId]
  );

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: { date: number; dayOfWeek: number; dateStr: string; isWeekend: boolean }[] = [];
    const totalDays = getDaysInMonth(year, month);
    
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        date: day,
        dayOfWeek,
        dateStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }
    return days;
  }, [year, month]);

  // Get day status
  const getDayStatus = (dateStr: string): AttendanceStatus => {
    if (!selectedAttendance) return "HOLIDAY";
    const day = selectedAttendance.days.find((d) => d.date === dateStr);
    return day?.status || (calendarDays.find(d => d.dateStr === dateStr)?.isWeekend ? "HOLIDAY" : "PRESENT");
  };

  // Handle day click
  const handleDayClick = async (dateStr: string) => {
    if (!selectedAttendance || processing) return;

    const currentStatus = getDayStatus(dateStr);
    const statusOrder: AttendanceStatus[] = ["PRESENT", "ABSENT", "OVERTIME", "LEAVE", "SICK", "HOLIDAY"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    setProcessing(true);
    try {
      await updateDay(selectedAttendance.id!, dateStr, nextStatus);
      setNotification({ type: "success", message: `Updated to ${STATUS_CONFIG[nextStatus].label}` });
    } catch (err) {
      setNotification({ type: "error", message: "Failed to update attendance" });
    } finally {
      setProcessing(false);
    }
  };

  // Mark all as present
  const handleMarkAllPresent = async () => {
    if (!selectedAttendance || processing) return;

    setProcessing(true);
    try {
      await markAll(selectedAttendance.id!, "PRESENT");
      setNotification({ type: "success", message: "All working days marked as present" });
    } catch (err) {
      setNotification({ type: "error", message: "Failed to mark all" });
    } finally {
      setProcessing(false);
    }
  };

  // Initialize attendance
  const handleInitAttendance = async (markAllPresent: boolean = false) => {
    if (!selectedEmployee || processing) return;

    // Validate employee data
    if (!selectedEmployee.id) {
      setNotification({ type: "error", message: "Employee ID is missing" });
      return;
    }
    if (!selectedEmployee.fullName) {
      setNotification({ type: "error", message: "Employee name is missing" });
      return;
    }
    if (!selectedEmployee.department) {
      setNotification({ type: "error", message: "Employee department is missing" });
      return;
    }
    if (!selectedEmployee.position) {
      setNotification({ type: "error", message: "Employee position is missing" });
      return;
    }

    setProcessing(true);
    try {
      await initAttendance(selectedEmployee, markAllPresent);
      setNotification({ 
        type: "success", 
        message: markAllPresent ? "Attendance initialized with all present" : "Attendance initialized"
      });
    } catch (err: any) {
      console.error("Failed to initialize attendance:", err);
      setNotification({ 
        type: "error", 
        message: err?.message || "Failed to initialize attendance"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Calculate payroll
  const handleCalcPayroll = async () => {
    if (!selectedAttendance || processing) return;

    setProcessing(true);
    try {
      await calcPayroll(selectedAttendance);
      setNotification({ type: "success", message: "Payroll calculated successfully" });
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "Failed to calculate payroll" });
    } finally {
      setProcessing(false);
    }
  };

  // Calculate all payrolls
  const handleCalcAllPayrolls = async () => {
    if (processing) return;

    setProcessing(true);
    try {
      const results = await calcAllPayrolls();
      const successCount = results.filter((r) => r.success).length;
      setNotification({ 
        type: "success", 
        message: `Calculated ${successCount} of ${results.length} payrolls`
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "Failed to calculate payrolls" });
    } finally {
      setProcessing(false);
    }
  };

  // Submit to CFO
  const handleSubmitToCFO = async () => {
    if (processing) return;

    setProcessing(true);
    try {
      const submittedCount = await submitToCFO();
      setNotification({ 
        type: "success", 
        message: `${submittedCount} payroll records submitted to CFO for approval`
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err?.message || "Failed to submit" });
    } finally {
      setProcessing(false);
    }
  };

  // Clear notification after 3 seconds
  if (notification) {
    setTimeout(() => setNotification(null), 3000);
  }

  const isCFO = user.primaryRole === UserRole.CFO;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
            <Calendar size={14} className="text-white" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Attendance & Payroll
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black text-white">HR Attendance System</h1>
          <p className="mt-2 text-emerald-100">
            Manage employee attendance and calculate payroll automatically.
          </p>
        </div>
      </section>

      {/* Notification */}
      {notification && (
        <div className={`rounded-xl p-4 ${notification.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {notification.message}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <HRMetricCard 
          title="Total Employees" 
          value={employees.length} 
          icon={Users}
          tone="emerald"
        />
        <HRMetricCard 
          title="Attendance Set" 
          value={attendanceRecords.length} 
          icon={CheckCircle}
          tone="blue"
        />
        <HRMetricCard 
          title="Payroll Calculated" 
          value={payrollRecords.length} 
          icon={DollarSign}
          tone="amber"
        />
        <HRMetricCard 
          title="Net Salary Total" 
          value={`Rp ${(payrollSummary.totalNetSalary / 1000000).toFixed(1)}M`} 
          icon={Briefcase}
          tone="emerald"
        />
      </div>

      {/* Month/Year Selector */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (month === 1) {
                setMonth(12);
                setYear(year - 1);
              } else {
                setMonth(month - 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            <ChevronLeft size={20} />
          </button>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold"
          >
            {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (month === 12) {
                setMonth(1);
                setYear(year + 1);
              } else {
                setMonth(month + 1);
              }
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPayrollRules(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold hover:bg-slate-200"
          >
            <Settings size={16} />
            Payroll Rules
          </button>
          <button
            onClick={() => setShowPayrollSummary(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold hover:bg-slate-200"
          >
            <FileText size={16} />
            Summary
          </button>
          <button
            onClick={handleCalcAllPayrolls}
            disabled={processing || attendanceRecords.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
          >
            <Calculator size={16} />
            Calc All
          </button>
          {!isCFO && (
            <button
              onClick={handleSubmitToCFO}
              disabled={processing || payrollRecords.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
            >
              <Send size={16} />
              Submit to CFO
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Employee List */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Employees</h2>
          <div className="max-h-[600px] space-y-2 overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl">
            {employees.length === 0 ? (
              <p className="p-4 text-center text-slate-500">No employees found</p>
            ) : (
              employees.map((emp) => {
                const status = employeeAttendanceStatus.get(emp.id!);
                const payroll = getEmployeePayroll(emp.id!);
                
                return (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedEmployeeId(emp.id!)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      selectedEmployeeId === emp.id
                        ? "bg-emerald-100 ring-2 ring-emerald-500"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{emp.fullName}</p>
                        <p className="text-xs text-slate-500">{emp.position}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {status?.initialized ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <Check size={10} className="inline" /> Attendance
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                            No Data
                          </span>
                        )}
                        {payroll && (
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            payroll.status === "APPROVED" 
                              ? "bg-emerald-100 text-emerald-700" 
                              : payroll.status === "REJECTED"
                              ? "bg-rose-100 text-rose-700"
                              : payroll.status === "SUBMITTED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {payroll.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Calendar */}
        <section className="lg:col-span-2 space-y-4">
          {selectedEmployee ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedEmployee.fullName}</h2>
                  <p className="text-sm text-slate-500">{selectedEmployee.department} • {selectedEmployee.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedAttendance ? (
                    <>
                      <button
                        onClick={() => handleInitAttendance(false)}
                        disabled={processing}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Calendar size={16} />
                        Initialize
                      </button>
                      <button
                        onClick={() => handleInitAttendance(true)}
                        disabled={processing}
                        className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                      >
                        <Check size={16} />
                        Init + Mark All Present
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleMarkAllPresent}
                        disabled={processing}
                        className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                      >
                        <Check size={16} />
                        Mark All Present
                      </button>
                      <button
                        onClick={handleCalcPayroll}
                        disabled={processing}
                        className="flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                      >
                        <Calculator size={16} />
                        Calculate Payroll
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 rounded-xl bg-slate-50 p-4">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`h-4 w-4 rounded ${config.bg} ${config.color}`}>
                      <config.icon size={14} />
                    </div>
                    <span className="text-xs text-slate-600">{config.label}</span>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              {selectedAttendance && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
                  {/* Day Headers */}
                  <div className="mb-4 grid grid-cols-7 gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-xs font-bold text-slate-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for previous month */}
                    {Array.from({ length: calendarDays[0]?.dayOfWeek || 0 }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {calendarDays.map(({ date, dateStr, isWeekend }) => {
                      const status = getDayStatus(dateStr);
                      const config = STATUS_CONFIG[status];
                      
                      return (
                        <button
                          key={date}
                          onClick={() => handleDayClick(dateStr)}
                          disabled={processing || isWeekend}
                          className={`aspect-square rounded-xl border-2 transition hover:scale-105 disabled:opacity-50 ${
                            isWeekend
                              ? "border-slate-100 bg-slate-50 text-slate-400"
                              : `border-transparent ${config.bg} ${config.color}`
                          }`}
                          title={isWeekend ? "Weekend" : config.label}
                        >
                          <div className="flex h-full flex-col items-center justify-center">
                            <span className="font-bold">{date}</span>
                            {!isWeekend && <config.icon size={12} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{selectedAttendance.summary.present}</p>
                      <p className="text-xs text-slate-500">Present</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-rose-600">{selectedAttendance.summary.absent}</p>
                      <p className="text-xs text-slate-500">Absent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{selectedAttendance.summary.overtime}</p>
                      <p className="text-xs text-slate-500">Overtime</p>
                    </div>
                  </div>

                  {/* Calculate Payroll Action */}
                  <div className="mt-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-6">
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <Calculator size={24} className="text-blue-600" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-slate-900">Ready to Calculate Payroll</h4>
                        <p className="text-sm text-slate-500">
                          Attendance recorded: {selectedAttendance.summary.present} present, {selectedAttendance.summary.absent} absent, {selectedAttendance.summary.overtime} overtime
                        </p>
                      </div>
                      <button
                        onClick={handleCalcPayroll}
                        disabled={processing}
                        className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl disabled:opacity-50"
                      >
                        {processing ? (
                          <>
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Calculator size={20} />
                            Calculate Payroll
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Payroll Details */}
              {selectedPayroll && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
                  <h3 className="mb-4 text-lg font-bold text-slate-900">Payroll Details</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Base Salary</span>
                        <span className="font-semibold">Rp {formatRupiah(selectedPayroll.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Transport Allowance</span>
                        <span className="font-semibold text-emerald-600">+ Rp {formatRupiah(selectedPayroll.transportAllowance)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Meal Allowance</span>
                        <span className="font-semibold text-emerald-600">+ Rp {formatRupiah(selectedPayroll.mealAllowance)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Overtime Pay</span>
                        <span className="font-semibold text-emerald-600">+ Rp {formatRupiah(selectedPayroll.overtimePay)}</span>
                      </div>
                      {(selectedPayroll.perfectAttendanceBonus || 0) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Perfect Attendance Bonus</span>
                          <span className="font-semibold text-emerald-600">+ Rp {formatRupiah(selectedPayroll.perfectAttendanceBonus)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                        <span className="font-semibold">Gross Salary</span>
                        <span className="font-bold text-emerald-600">Rp {formatRupiah(selectedPayroll.grossSalary)}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Absent Deduction</span>
                        <span className="font-semibold text-rose-600">- Rp {formatRupiah(selectedPayroll.absentDeduction)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Tax ({selectedPayroll.tax > 0 ? ((selectedPayroll.tax / selectedPayroll.grossSalary) * 100).toFixed(1) : 0}%)</span>
                        <span className="font-semibold text-rose-600">- Rp {formatRupiah(selectedPayroll.tax)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                        <span className="font-semibold">Total Deductions</span>
                        <span className="font-bold text-rose-600">Rp {formatRupiah(selectedPayroll.totalDeduction)}</span>
                      </div>
                      <div className="flex justify-between rounded-xl bg-emerald-50 p-3 text-sm">
                        <span className="font-bold text-emerald-900">NET SALARY</span>
                        <span className="font-bold text-emerald-900">Rp {formatRupiah(selectedPayroll.netSalary)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Status: {selectedPayroll.status}</span>
                        {selectedPayroll.approvedByCFOName && (
                          <span>Approved by {selectedPayroll.approvedByCFOName}</span>
                        )}
                      </div>

                      {/* Submit to CFO Button */}
                      {(selectedPayroll.status === "CALCULATED" || selectedPayroll.status === "DRAFT") && !isCFO && (
                        <button
                          onClick={handleSubmitToCFO}
                          disabled={processing}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {processing ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send size={16} />
                              Submit to CFO for Approval
                            </>
                          )}
                        </button>
                      )}
                      
                      {/* Already Submitted Indicator */}
                      {selectedPayroll.status === "SUBMITTED" && (
                        <div className="mt-4 rounded-xl bg-blue-50 p-3 text-center">
                          <p className="text-sm font-semibold text-blue-700">
                            ✓ Submitted to CFO for Approval
                          </p>
                          <p className="text-xs text-blue-500">
                            Waiting for CFO review
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-96 flex-col items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-8">
              <UserCheck size={64} className="mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-500">Select an employee to manage attendance</p>
            </div>
          )}
        </section>
      </div>

      {/* Payroll Rules Modal */}
      {showPayrollRules && (
        <HRPayrollRulesModal
          isOpen={showPayrollRules}
          onClose={() => setShowPayrollRules(false)}
          existingRules={payrollRules}
          employees={employees}
        />
      )}

      {/* Payroll Summary Modal */}
      {showPayrollSummary && (
        <PayrollSummaryModal
          summary={payrollSummary}
          payrollRecords={payrollRecords}
          onClose={() => setShowPayrollSummary(false)}
        />
      )}
    </div>
  );
}

// Payroll Summary Modal Component
function PayrollSummaryModal({ 
  summary, 
  payrollRecords,
  onClose 
}: { 
  summary: any; 
  payrollRecords: any[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900">Payroll Summary</h2>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={24} />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{summary.totalEmployees}</p>
            <p className="text-xs text-slate-500">Total Employees</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{summary.approvedCount}</p>
            <p className="text-xs text-emerald-600">Approved</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.pendingCount}</p>
            <p className="text-xs text-amber-600">Pending</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-4 text-center">
            <p className="text-2xl font-bold text-rose-600">{summary.rejectedCount}</p>
            <p className="text-xs text-rose-600">Rejected</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between rounded-xl bg-slate-50 p-4">
            <span className="font-semibold">Total Gross Salary</span>
            <span className="font-bold text-emerald-600">Rp {formatRupiah(summary.totalGrossSalary)}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-slate-50 p-4">
            <span className="font-semibold">Total Deductions</span>
            <span className="font-bold text-rose-600">Rp {formatRupiah(summary.totalDeductions)}</span>
          </div>
          <div className="flex justify-between rounded-xl bg-emerald-50 p-4">
            <span className="font-bold text-emerald-900">Total Net Salary</span>
            <span className="font-bold text-emerald-900">Rp {formatRupiah(summary.totalNetSalary)}</span>
          </div>
        </div>

        <h3 className="mb-4 mt-8 text-lg font-bold">Employee Payroll List</h3>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {payrollRecords.map((record) => (
            <div key={record.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <p className="font-semibold">{record.employeeName}</p>
                <p className="text-xs text-slate-500">{record.position}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-emerald-600">Rp {formatRupiah(record.netSalary)}</p>
                <span className={`text-xs ${
                  record.status === "APPROVED" ? "text-emerald-600" : 
                  record.status === "REJECTED" ? "text-rose-600" : "text-amber-600"
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
