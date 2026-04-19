import { useState } from "react";
import {
  Users,
  CheckCircle,
  Clock,
  Ban,
  UserPlus,
  Search,
  FileText,
  Briefcase,
  Plus,
  Check,
  X,
  AlertCircle,
  Building2,
  DollarSign,
  UserCheck,
  FolderOpen,
  Calendar,
} from "lucide-react";
import { useHRRecruitmentApproval } from "../hooks/useHRRecruitmentApproval";
import HRMetricCard from "../components/HRMetricCard";
import HRRecruitmentRequestModal from "../components/HRRecruitmentRequestModal";
import { RecruitmentRequest } from "../services/hrRecruitmentApprovalService";
import { UserRole } from "../../../core/types/roles";
import { DirectorUser } from "../../../core/types/auth";

type Props = {
  user: DirectorUser;
};

type Tab = "all" | "pending" | "my-requests" | "approved";

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
  DRAFT: { bg: "bg-slate-100", text: "text-slate-600", icon: FileText },
  SUBMITTED: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
  REJECTED: { bg: "bg-rose-100", text: "text-rose-700", icon: Ban },
  IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", icon: UserPlus },
  COMPLETED: { bg: "bg-violet-100", text: "text-violet-700", icon: CheckCircle },
  CANCELLED: { bg: "bg-slate-100", text: "text-slate-500", icon: X },
};

const LEVEL_LABELS: Record<string, string> = {
  ENTRY: "Entry Level",
  MID: "Mid Level",
  SENIOR: "Senior Level",
  MANAGER: "Manager",
  EXECUTIVE: "Executive",
};

const ROLE_LABELS: Record<string, string> = {
  [UserRole.HR]: "HR",
  [UserRole.CEO]: "CEO",
  [UserRole.COO]: "COO",
  [UserRole.CTO]: "CTO",
  [UserRole.CFO]: "CFO",
  [UserRole.CMO]: "CMO",
  [UserRole.ADMIN]: "Admin",
};

export default function HRRecruitmentPage({ user }: Props) {
  const {
    loading,
    allRequests,
    myRequests,
    pendingRequests,
    requestsByStatus,
    stats,
    canApprove,
    submitNewRequest,
    approve,
    reject,
    setSelectedRequest,
    selectedRequest,
    isModalOpen,
    setIsModalOpen,
  } = useHRRecruitmentApproval({ uid: user.uid, fullName: user.fullName, primaryRole: user.primaryRole });

  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const getFilteredRequests = () => {
    let requests: RecruitmentRequest[] = [];
    switch (activeTab) {
      case "all":
        requests = allRequests;
        break;
      case "pending":
        requests = pendingRequests;
        break;
      case "my-requests":
        requests = myRequests;
        break;
      case "approved":
        requests = requestsByStatus.approved;
        break;
    }
    
    return requests.filter((r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleApprove = async (request: RecruitmentRequest) => {
    setProcessingId(request.id!);
    try {
      await approve(request.id!, `Approved by ${user?.fullName}`);
      setSelectedRequest(null);
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason) return;
    
    setProcessingId(selectedRequest.id!);
    try {
      await reject(selectedRequest.id!, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedRequest(null);
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitNew = async (request: any, submitForApproval: boolean) => {
    await submitNewRequest(request, submitForApproval);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-8 shadow-xl">
          <p className="text-sm text-slate-500">Loading recruitment approval system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
            <UserPlus size={14} className="text-white" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Recruitment Approval System
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black text-white">Recruitment Requests</h1>
          <p className="mt-2 text-emerald-100">
            Manage hiring requests from all divisions. Review, approve, and track recruitment workflow.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <HRMetricCard title="Total" value={stats.total} icon={FolderOpen} tone="emerald" />
        <HRMetricCard title="Draft" value={stats.draft} icon={FileText} tone="slate" />
        <HRMetricCard title="Pending" value={stats.pending} icon={Clock} tone="amber" />
        <HRMetricCard title="Approved" value={stats.approved} icon={CheckCircle} tone="blue" />
        <HRMetricCard title="Rejected" value={stats.rejected} icon={Ban} tone="rose" />
        <HRMetricCard title="In Progress" value={stats.inProgress} icon={UserPlus} tone="blue" />
        <HRMetricCard title="Completed" value={stats.completed} icon={CheckCircle} tone="emerald" />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requests..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none ring-2 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-100"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All Requests", count: allRequests.length },
          { key: "pending", label: "Needs My Approval", count: pendingRequests.length },
          { key: "my-requests", label: "My Requests", count: myRequests.length },
          { key: "approved", label: "Approved", count: requestsByStatus.approved.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as Tab)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.key ? "bg-white/20" : "bg-slate-200"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Request</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Department</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Level</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Qty</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Requester</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Approver</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {getFilteredRequests().length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <FolderOpen size={48} />
                      <p className="text-lg font-medium">No requests found</p>
                      <p className="text-sm">Create a new recruitment request to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredRequests().map((request) => {
                  const statusStyle = STATUS_STYLES[request.status] || STATUS_STYLES.DRAFT;
                  const StatusIcon = statusStyle.icon;
                  const canAct = canApprove(request) && request.status === "SUBMITTED";

                  return (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-900">{request.title}</p>
                          <p className="text-sm text-slate-500">{request.position}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Building2 size={14} className="text-slate-400" />
                          {request.department}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {LEVEL_LABELS[request.positionLevel]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{request.quantity}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle.bg} ${statusStyle.text}`}>
                          <StatusIcon size={12} />
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div>
                          <p>{request.requestedByName}</p>
                          <p className="text-xs text-slate-400">{ROLE_LABELS[request.requestedByRole]}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {ROLE_LABELS[request.targetApprovalRole] || request.targetApprovalRole}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                            title="View Details"
                          >
                            <FolderOpen size={16} />
                          </button>
                          {canAct && (
                            <>
                              <button
                                onClick={() => handleApprove(request)}
                                disabled={processingId === request.id}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                                title="Approve"
                              >
                                {processingId === request.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                                ) : (
                                  <Check size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                title="Reject"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail Modal */}
      {selectedRequest && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                    <Briefcase size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">{selectedRequest.title}</h2>
                    <p className="text-sm text-slate-500">
                      {selectedRequest.department} • {selectedRequest.position}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* Status */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const style = STATUS_STYLES[selectedRequest.status];
                    const Icon = style.icon;
                    return (
                      <>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${style.bg}`}>
                          <Icon size={20} className={style.text} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Status</p>
                          <p className={`font-bold ${style.text}`}>{selectedRequest.status}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                {selectedRequest.approvedBy && (
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Approved By</p>
                    <p className="font-semibold text-slate-900">{selectedRequest.approvedBy}</p>
                  </div>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Users size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Quantity</p>
                    <p className="font-semibold text-slate-900">{selectedRequest.quantity} person(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Briefcase size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Employment Type</p>
                    <p className="font-semibold text-slate-900">{selectedRequest.employmentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <UserCheck size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Level</p>
                    <p className="font-semibold text-slate-900">{LEVEL_LABELS[selectedRequest.positionLevel]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Calendar size={18} className="text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Target Start</p>
                    <p className="font-semibold text-slate-900">{selectedRequest.targetStartDate || "ASAP"}</p>
                  </div>
                </div>
              </div>

              {/* Budget */}
              {selectedRequest.budgetApproval && (
                <div className="rounded-xl bg-emerald-50 p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-xs text-emerald-600">Budget Approved</p>
                      <p className="font-bold text-emerald-900">
                        Rp {(selectedRequest.budgetAmount || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <h4 className="mb-2 font-bold text-slate-900">Reason for Hiring</h4>
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{selectedRequest.reason}</p>
              </div>

              {/* Job Description */}
              {selectedRequest.jobDescription && (
                <div>
                  <h4 className="mb-2 font-bold text-slate-900">Job Description</h4>
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{selectedRequest.jobDescription}</p>
                </div>
              )}

              {/* Requirements */}
              {selectedRequest.requirements && (
                <div>
                  <h4 className="mb-2 font-bold text-slate-900">Requirements</h4>
                  <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{selectedRequest.requirements}</p>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.rejectionReason && (
                <div className="rounded-xl bg-rose-50 p-4">
                  <h4 className="mb-2 font-bold text-rose-900">Rejection Reason</h4>
                  <p className="text-sm text-rose-700">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {canApprove(selectedRequest) && selectedRequest.status === "SUBMITTED" && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={processingId === selectedRequest.id}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {processingId === selectedRequest.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Check size={18} />
                    )}
                    Approve Request
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-6 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
                <AlertCircle size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Reject Request</h3>
                <p className="text-sm text-slate-500">{selectedRequest.title}</p>
              </div>
            </div>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-rose-500 focus:outline-none"
              rows={4}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || processingId === selectedRequest.id}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {processingId === selectedRequest.id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {isModalOpen && (
        <HRRecruitmentRequestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmitNew}
          userRole={user?.primaryRole || UserRole.HR}
        />
      )}
    </div>
  );
}