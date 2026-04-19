import { useState, useMemo, useEffect } from "react";
import { X, Save, Plus, Trash2, DollarSign, Calculator, Briefcase, Users } from "lucide-react";
import { PayrollRule, savePayrollRule } from "../services/hrAttendanceService";
import { HREmployee } from "../services/hrEmployeeService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingRules: PayrollRule[];
  employees: HREmployee[];
}

const DEPARTMENTS = [
  "Human Resources",
  "Finance",
  "Operations",
  "Technology",
  "Marketing",
  "Sales",
  "Customer Service",
  "Logistics",
  "Legal",
];

export default function HRPayrollRulesModal({ isOpen, onClose, existingRules, employees }: Props) {
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Get unique positions for selected department from employees
  const availablePositions = useMemo(() => {
    if (!selectedDept) return [];
    const positions = new Set(
      employees
        .filter((e) => e.department === selectedDept)
        .map((e) => e.position)
    );
    return Array.from(positions);
  }, [selectedDept, employees]);

  // Get average salary for this dept/position from employees
  const suggestedBaseSalary = useMemo(() => {
    if (!selectedDept || !selectedPosition) return 0;
    const employeesInRole = employees.filter(
      (e) => e.department === selectedDept && e.position === selectedPosition && e.salary && e.salary > 0
    );
    if (employeesInRole.length === 0) return 0;
    const avgSalary = employeesInRole.reduce((sum, e) => sum + (e.salary || 0), 0) / employeesInRole.length;
    return Math.round(avgSalary);
  }, [selectedDept, selectedPosition, employees]);

  // Form state
  const [formData, setFormData] = useState({
    baseSalary: 0,
    absentDeductionPerDay: 0,
    lateDeductionPerHour: 0,
    overtimeRatePerHour: 0,
    overtimeRatePerDay: 0,
    transportAllowance: 0,
    mealAllowance: 0,
    perfectAttendanceBonus: 0,
    taxRate: 0,
    effectiveFrom: new Date().toISOString().split("T")[0],
  });

  // Load existing rule if any
  useEffect(() => {
    if (selectedDept && selectedPosition) {
      const existingRule = existingRules.find(
        (r) => r.department === selectedDept && r.position === selectedPosition && r.isActive
      );

      if (existingRule) {
        setFormData({
          baseSalary: existingRule.baseSalary || 0,
          absentDeductionPerDay: existingRule.absentDeductionPerDay || 0,
          lateDeductionPerHour: existingRule.lateDeductionPerHour || 0,
          overtimeRatePerHour: existingRule.overtimeRatePerHour || 0,
          overtimeRatePerDay: existingRule.overtimeRatePerDay || 0,
          transportAllowance: existingRule.transportAllowance || 0,
          mealAllowance: existingRule.mealAllowance || 0,
          perfectAttendanceBonus: existingRule.perfectAttendanceBonus || 0,
          taxRate: existingRule.taxRate || 0,
          effectiveFrom: existingRule.effectiveFrom || new Date().toISOString().split("T")[0],
        });
      } else {
        // Use suggested base salary from employees
        setFormData((prev) => ({
          ...prev,
          baseSalary: suggestedBaseSalary,
          // Default calculations based on base salary
          absentDeductionPerDay: Math.round(suggestedBaseSalary / 30),
          overtimeRatePerDay: Math.round(suggestedBaseSalary / 30 * 1.5),
          overtimeRatePerHour: Math.round(suggestedBaseSalary / 30 / 8 * 1.5),
          transportAllowance: 200000,
          mealAllowance: 50000,
          perfectAttendanceBonus: 500000,
          taxRate: 5,
        }));
      }
    }
  }, [selectedDept, selectedPosition, existingRules, suggestedBaseSalary]);

  const handleSave = async () => {
    if (!selectedDept || !selectedPosition) {
      setMessage({ type: "error", text: "Please select department and position" });
      return;
    }

    setLoading(true);
    try {
      await savePayrollRule({
        department: selectedDept,
        position: selectedPosition,
        baseSalary: formData.baseSalary,
        absentDeductionPerDay: formData.absentDeductionPerDay,
        lateDeductionPerHour: formData.lateDeductionPerHour,
        overtimeRatePerHour: formData.overtimeRatePerHour,
        overtimeRatePerDay: formData.overtimeRatePerDay,
        transportAllowance: formData.transportAllowance,
        mealAllowance: formData.mealAllowance,
        perfectAttendanceBonus: formData.perfectAttendanceBonus,
        taxRate: formData.taxRate,
        effectiveFrom: formData.effectiveFrom,
        effectiveTo: undefined,
        isActive: true,
      });
      setMessage({ type: "success", text: "Payroll rule saved successfully" });
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Failed to save rule" });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <DollarSign size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Payroll Rules</h2>
              <p className="text-sm text-slate-500">Configure salary settings per department/position</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100">
            <X size={24} />
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 rounded-xl p-3 ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
            {message.text}
          </div>
        )}

        {/* Department & Position Selection */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedPosition("");
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Position</label>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              disabled={!selectedDept || availablePositions.length === 0}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 disabled:bg-slate-100"
            >
              <option value="">Select Position</option>
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            {selectedDept && availablePositions.length === 0 && (
              <p className="mt-1 text-xs text-rose-500">No positions found for this department. Please add employees first.</p>
            )}
          </div>
        </div>

        {/* Suggested Salary Info */}
        {suggestedBaseSalary > 0 && (
          <div className="mb-6 rounded-xl bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-blue-600" />
              <span className="text-sm text-blue-900">
                Suggested base salary from employee profiles: <strong>Rp {suggestedBaseSalary.toLocaleString("id-ID")}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Payroll Form */}
        {selectedDept && selectedPosition && (
          <div className="space-y-6">
            {/* Base Salary */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <DollarSign size={18} className="text-emerald-600" />
                Base Salary & Allowances
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Base Salary (per month)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                    placeholder="5000000"
                  />
                  <p className="mt-1 text-xs text-slate-400">Default from employee profile, but editable</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Transport Allowance (per day)</label>
                  <input
                    type="number"
                    value={formData.transportAllowance}
                    onChange={(e) => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Meal Allowance (per day)</label>
                  <input
                    type="number"
                    value={formData.mealAllowance}
                    onChange={(e) => setFormData({ ...formData, mealAllowance: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Perfect Attendance Bonus</label>
                  <input
                    type="number"
                    value={formData.perfectAttendanceBonus}
                    onChange={(e) => setFormData({ ...formData, perfectAttendanceBonus: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                </div>
              </div>
            </section>

            {/* Deductions */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Trash2 size={18} className="text-rose-600" />
                Deductions
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Absent Deduction (per day)</label>
                  <input
                    type="number"
                    value={formData.absentDeductionPerDay}
                    onChange={(e) => setFormData({ ...formData, absentDeductionPerDay: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-400">Suggested: {Math.round(formData.baseSalary / 30).toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Late Deduction (per hour)</label>
                  <input
                    type="number"
                    value={formData.lateDeductionPerHour}
                    onChange={(e) => setFormData({ ...formData, lateDeductionPerHour: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                </div>
              </div>
            </section>

            {/* Overtime */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Briefcase size={18} className="text-amber-600" />
                Overtime Rates
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Overtime Rate (per day)</label>
                  <input
                    type="number"
                    value={formData.overtimeRatePerDay}
                    onChange={(e) => setFormData({ ...formData, overtimeRatePerDay: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-400">Suggested: {Math.round(formData.baseSalary / 30 * 1.5).toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Overtime Rate (per hour)</label>
                  <input
                    type="number"
                    value={formData.overtimeRatePerHour}
                    onChange={(e) => setFormData({ ...formData, overtimeRatePerHour: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  />
                  <p className="mt-1 text-xs text-slate-400">Suggested: {Math.round(formData.baseSalary / 30 / 8 * 1.5).toLocaleString("id-ID")}</p>
                </div>
              </div>
            </section>

            {/* Tax */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
                <Users size={18} className="text-blue-600" />
                Tax Settings
              </h3>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Tax Rate (%)</label>
                <input
                  type="number"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2"
                  min="0"
                  max="100"
                />
              </div>
            </section>

            {/* Effective Date */}
            <section>
              <h3 className="mb-3 font-bold text-slate-900">Effective From</h3>
              <input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-4 py-2"
              />
            </section>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-6 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save size={18} />
                )}
                Save Rule
              </button>
            </div>
          </div>
        )}

        {/* Existing Rules List */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <h3 className="mb-4 font-bold text-slate-900">Existing Rules ({existingRules.filter(r => r.isActive).length})</h3>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {existingRules.filter(r => r.isActive).map((rule) => (
              <div key={rule.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div>
                  <p className="font-semibold text-slate-900">{rule.department} - {rule.position}</p>
                  <p className="text-xs text-slate-500">
                    Base: Rp {rule.baseSalary?.toLocaleString("id-ID")} | 
                    OT: Rp {rule.overtimeRatePerDay?.toLocaleString("id-ID")}/day |
                    Tax: {rule.taxRate}%
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDept(rule.department);
                    setSelectedPosition(rule.position);
                  }}
                  className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-emerald-600 shadow-sm hover:bg-emerald-50"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
