import { useState } from "react";
import { useCFORecruitmentRequests } from "../hooks/useCFORecruitmentRequests";
import { formatCurrency } from "../utils/formatters";
import { UserPlus, Plus, Briefcase, Users, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Props {
  user: any;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING_HR: { label: "Pending HR", color: "bg-amber-100 text-amber-700", icon: Clock },
  IN_REVIEW: { label: "In Review", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-700", icon: XCircle },
  FILLED: { label: "Position Filled", color: "bg-purple-100 text-purple-700", icon: Users },
};

export default function CFORecruitmentPage({ user }: Props) {
  const { loading, myRequests, createRequest } = useCFORecruitmentRequests(user);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    position: "",
    department: "Finance",
    level: "STAFF" as "STAFF" | "MANAGER" | "DIRECTOR",
    employmentType: "FULLTIME" as "FULLTIME" | "CONTRACT" | "INTERN",
    skills: "",
    experience: "",
    education: "",
    budget: "",
    justification: "",
    neededBy: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createRequest({
      ...formData,
      skills: formData.skills.split(",").map(s => s.trim()),
      budget: Number(formData.budget),
    });
    setShowForm(false);
    setFormData({
      position: "", department: "Finance", level: "STAFF", employmentType: "FULLTIME",
      skills: "", experience: "", education: "", budget: "", justification: "",
      neededBy: "", priority: "MEDIUM"
    });
  };

  if (loading) return <div className="p-6">Loading recruitment data...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              HR Integration
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Recruitment Requests
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ajukan permintaan rekrutmen ke HR untuk tim Finance
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {["PENDING_HR", "IN_REVIEW", "APPROVED", "FILLED"].map((status) => {
          const count = myRequests.filter((r: any) => r.status === status).length;
          const config = statusConfig[status];
          return (
            <div key={status} className={`rounded-2xl border p-4 ${config.color.replace("text-", "border-").replace("700", "200")} bg-white`}>
              <div className="flex items-center gap-2">
                <config.icon size={16} />
                <span className="text-xs font-medium">{config.label}</span>
              </div>
              <div className="mt-2 text-2xl font-bold">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {myRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            <UserPlus size={48} className="mx-auto mb-4 text-slate-300" />
            <p>Belum ada recruitment request</p>
            <p className="text-sm">Klik "New Request" untuk mengajukan kebutuhan staff</p>
          </div>
        ) : (
          myRequests.map((req: any) => {
            const status = statusConfig[req.status] || statusConfig.PENDING_HR;
            return (
              <div key={req.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                        <Briefcase size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{req.position}</h3>
                        <p className="text-sm text-slate-500">{req.department} • {req.level} • {req.employmentType}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Budget</p>
                        <p className="font-medium text-slate-900">{formatCurrency(req.requirements?.budget || 0)}/mo</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Experience</p>
                        <p className="font-medium text-slate-900">{req.requirements?.experience || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Education</p>
                        <p className="font-medium text-slate-900">{req.requirements?.education || "-"}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-slate-500">Skills Required</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(req.requirements?.skills || []).map((skill: string, idx: number) => (
                          <span key={idx} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">Justification</p>
                      <p className="text-sm text-slate-700">{req.justification}</p>
                    </div>

                    {req.hrResponse?.notes && (
                      <div className="mt-3 rounded-xl bg-indigo-50 p-3">
                        <p className="text-xs text-indigo-600">HR Response</p>
                        <p className="text-sm text-indigo-800">{req.hrResponse.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${status.color}`}>
                      <status.icon size={12} />
                      {status.label}
                    </span>
                    <p className="mt-2 text-xs text-slate-400">
                      Needed by: {new Date(req.neededBy).toLocaleDateString("id-ID")}
                    </p>
                    <p className="text-xs text-slate-400">
                      Priority: {req.priority}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6">
            <h3 className="text-lg font-bold text-slate-900">New Recruitment Request</h3>
            <p className="text-sm text-slate-500">Ajukan kebutuhan staff baru ke HR</p>
            
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="e.g., Financial Analyst"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="STAFF">Staff</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Employment Type</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="FULLTIME">Full-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERN">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Monthly Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="e.g., 8000000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Needed By</label>
                  <input
                    type="date"
                    value={formData.neededBy}
                    onChange={(e) => setFormData({ ...formData, neededBy: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Skills (comma separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  placeholder="e.g., Excel, Financial Modeling, SQL"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Experience</label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="e.g., 2-3 years"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Education</label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="e.g., S1 Accounting"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Justification</label>
                <textarea
                  value={formData.justification}
                  onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                  rows={3}
                  placeholder="Mengapa posisi ini dibutuhkan?"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Submit to HR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
