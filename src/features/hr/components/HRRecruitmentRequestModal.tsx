import { useState, FormEvent } from "react";
import { X, Briefcase, Users, DollarSign, Calendar, FileText, CheckCircle, Send } from "lucide-react";
import { RecruitmentRequest, RecruitmentPositionLevel, EmploymentType } from "../services/hrRecruitmentApprovalService";
import { UserRole } from "../../../core/types/roles";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: any, submitForApproval: boolean) => Promise<void>;
  userRole: UserRole;
};

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

const POSITION_LEVELS: { value: RecruitmentPositionLevel; label: string }[] = [
  { value: "ENTRY", label: "Entry Level" },
  { value: "MID", label: "Mid Level" },
  { value: "SENIOR", label: "Senior Level" },
  { value: "MANAGER", label: "Manager" },
  { value: "EXECUTIVE", label: "Executive" },
];

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

const APPROVAL_ROLES = [
  { value: UserRole.HR, label: "HR (Human Resources)" },
  { value: UserRole.CEO, label: "CEO (Chief Executive Officer)" },
  { value: UserRole.COO, label: "COO (Chief Operating Officer)" },
  { value: UserRole.CTO, label: "CTO (Chief Technology Officer)" },
  { value: UserRole.CFO, label: "CFO (Chief Financial Officer)" },
  { value: UserRole.CMO, label: "CMO (Chief Marketing Officer)" },
];

export default function HRRecruitmentRequestModal({ isOpen, onClose, onSubmit, userRole }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitType, setSubmitType] = useState<"draft" | "submit">("draft");

  const [formData, setFormData] = useState<Partial<RecruitmentRequest>>({
    title: "",
    department: "",
    position: "",
    positionLevel: "MID",
    employmentType: "FULL_TIME",
    quantity: 1,
    reason: "",
    jobDescription: "",
    requirements: "",
    budgetApproval: false,
    budgetAmount: undefined,
    targetApprovalRole: UserRole.HR,
    targetStartDate: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate
      if (!formData.title || !formData.department || !formData.position || !formData.reason) {
        throw new Error("Please fill all required fields");
      }

      const requestData = {
        ...formData,
        status: "DRAFT",
        requestedByUid: "", // Will be filled by parent
        requestedByName: "",
        requestedByRole: userRole,
      };

      await onSubmit(requestData, submitType === "submit");
      
      if (submitType === "submit") {
        setStep(2);
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({
      title: "",
      department: "",
      position: "",
      positionLevel: "MID",
      employmentType: "FULL_TIME",
      quantity: 1,
      reason: "",
      jobDescription: "",
      requirements: "",
      budgetApproval: false,
      budgetAmount: undefined,
      targetApprovalRole: UserRole.HR,
      targetStartDate: "",
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Briefcase size={24} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {step === 1 ? "New Recruitment Request" : "Request Submitted!"}
                </h2>
                <p className="text-sm text-slate-500">
                  {step === 1 ? "Fill in the position details" : "Your request is now pending approval"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress */}
          {step === 1 && (
            <div className="mt-4 flex gap-2">
              <div className="h-2 flex-1 rounded-full bg-emerald-500" />
              <div className="h-2 flex-1 rounded-full bg-slate-200" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <Briefcase size={18} className="text-emerald-600" />
                  Position Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Request Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="e.g., Frontend Developer Hiring Q1 2024"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Position Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="e.g., Senior Frontend Developer"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Position Level
                    </label>
                    <select
                      value={formData.positionLevel}
                      onChange={(e) => setFormData((prev) => ({ ...prev, positionLevel: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      {POSITION_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Employment Type
                    </label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData((prev) => ({ ...prev, employmentType: e.target.value as any }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Quantity Needed
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.quantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Target Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.targetStartDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, targetStartDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
              </section>

              {/* Details */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <FileText size={18} className="text-emerald-600" />
                  Job Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Reason for Hiring <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.reason}
                      onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      rows={3}
                      placeholder="Why is this position needed? Team expansion, replacement, new project, etc."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Job Description
                    </label>
                    <textarea
                      value={formData.jobDescription}
                      onChange={(e) => setFormData((prev) => ({ ...prev, jobDescription: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      rows={4}
                      placeholder="Describe the responsibilities, daily tasks, and scope of work..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Requirements
                    </label>
                    <textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      rows={3}
                      placeholder="Skills, experience, education, certifications required..."
                    />
                  </div>
                </div>
              </section>

              {/* Budget */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <DollarSign size={18} className="text-emerald-600" />
                  Budget Information
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.budgetApproval}
                        onChange={(e) => setFormData((prev) => ({ ...prev, budgetApproval: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Budget Already Approved</span>
                    </label>
                  </div>
                  {formData.budgetApproval && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Budget Amount (IDR)
                      </label>
                      <input
                        type="number"
                        value={formData.budgetAmount || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, budgetAmount: parseInt(e.target.value) || undefined }))}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="15000000"
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Approval Flow */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900">
                  <Users size={18} className="text-emerald-600" />
                  Approval Flow
                </h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Request Approval From <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.targetApprovalRole}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetApprovalRole: e.target.value as any }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Select Approver</option>
                    {APPROVAL_ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {formData.targetApprovalRole === userRole 
                      ? "⚠️ You are requesting approval from your own division. This will require additional justification."
                      : formData.department === "Human Resources" && formData.targetApprovalRole === UserRole.CEO
                      ? "✓ HR hiring requests typically need CEO approval."
                      : "Select the division head who will review and approve this recruitment request."}
                  </p>
                </div>
              </section>

              {/* Submit Options */}
              <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitType("draft")}
                  disabled={loading}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  {loading ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="submit"
                  onClick={() => setSubmitType("submit")}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit for Approval
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-900">Request Submitted!</h3>
              <p className="mt-2 max-w-md text-slate-500">
                Your recruitment request for <strong>{formData.position}</strong> has been submitted and is now pending approval from{" "}
                <strong>{APPROVAL_ROLES.find(r => r.value === formData.targetApprovalRole)?.label}</strong>.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleClose}
                  className="rounded-xl bg-emerald-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
