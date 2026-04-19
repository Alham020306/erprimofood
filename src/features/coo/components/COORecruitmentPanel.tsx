import { useState } from "react";
import { 
  Users, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Briefcase,
  Truck,
  Store,
  Code,
  Megaphone,
  AlertCircle
} from "lucide-react";
import { RecruitmentType, RecruitmentPriority, RecruitmentRequest } from "../hooks/useCOORecruitment";

interface Props {
  user: any;
  myRequests: RecruitmentRequest[];
  stats: any;
  onSubmit: (data: {
    type: RecruitmentType;
    position: string;
    department: string;
    quantity: number;
    priority: RecruitmentPriority;
    reason: string;
    requirements: string;
  }) => Promise<boolean>;
  submitting: boolean;
}

const typeIcons: Record<RecruitmentType, any> = {
  DRIVER: Truck,
  MERCHANT: Store,
  OPERATIONAL_STAFF: Briefcase,
  TECHNICAL: Code,
  MARKETING: Megaphone,
  OTHER: Users,
};

const typeLabels: Record<RecruitmentType, string> = {
  DRIVER: "Driver",
  MERCHANT: "Merchant",
  OPERATIONAL_STAFF: "Staff Operasional",
  TECHNICAL: "Teknis/IT",
  MARKETING: "Marketing",
  OTHER: "Lainnya",
};

const priorityColors: Record<RecruitmentPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-rose-100 text-rose-700",
};

const priorityLabels: Record<RecruitmentPriority, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  URGENT: "Mendesak",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-purple-100 text-purple-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  IN_PROGRESS: "Dalam Proses",
  COMPLETED: "Selesai",
};

export default function COORecruitmentPanel({ 
  user, 
  myRequests, 
  stats, 
  onSubmit, 
  submitting 
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "DRIVER" as RecruitmentType,
    position: "",
    department: "",
    quantity: 1,
    priority: "MEDIUM" as RecruitmentPriority,
    reason: "",
    requirements: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      alert("✅ Pengajuan recruitment berhasil!");
      setShowForm(false);
      setFormData({
        type: "DRIVER",
        position: "",
        department: "",
        quantity: 1,
        priority: "MEDIUM",
        reason: "",
        requirements: "",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              HR Integration
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Permintaan Rekrutmen ke HR
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ajukan permintaan rekrutmen ke HR untuk tim Operations
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            New Request
          </button>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xl font-black text-slate-600">{stats?.total || 0}</p>
          <p className="text-xs text-slate-700 font-medium">Total</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-xl font-black text-amber-600">{stats?.pending || 0}</p>
          <p className="text-xs text-amber-700 font-medium">Menunggu</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xl font-black text-emerald-600">{stats?.approved || 0}</p>
          <p className="text-xs text-emerald-700 font-medium">Disetujui</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-rose-50 border border-rose-200">
          <p className="text-xl font-black text-rose-600">{stats?.rejected || 0}</p>
          <p className="text-xs text-rose-700 font-medium">Ditolak</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-purple-50 border border-purple-200">
          <p className="text-xl font-black text-purple-600">{stats?.completed || 0}</p>
          <p className="text-xs text-purple-700 font-medium">Selesai</p>
        </div>
      </div>

      {/* Requests List */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Briefcase size={16} /> Riwayat Pengajuan
          </h3>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-auto">
          {myRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p>Belum ada pengajuan</p>
            </div>
          ) : (
            myRequests.map((req) => {
              const Icon = typeIcons[req.type];
              return (
                <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                        <Icon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{req.position}</p>
                        <p className="text-xs text-slate-500">
                          {typeLabels[req.type]} • {req.department}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${priorityColors[req.priority]}`}>
                            {priorityLabels[req.priority]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[req.status]}`}>
                            {statusLabels[req.status]}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{req.quantity}</p>
                      <p className="text-xs text-slate-500">orang</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{req.reason}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-600" />
              Pengajuan Recruitment
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Recruitment</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(typeIcons) as RecruitmentType[]).map((type) => {
                    const Icon = typeIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, type })}
                        className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                          formData.type === type
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Icon size={16} />
                        {typeLabels[type]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Posisi</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="e.g., Driver Delivery"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Departemen</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    placeholder="e.g., Operations"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as RecruitmentPriority })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="URGENT">Mendesak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alasan Recruitment</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 h-16"
                  placeholder="Jelaskan alasan kebutuhan..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Persyaratan</label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 h-20"
                  placeholder="Sebutkan persyaratan calon karyawan..."
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Memproses...
                    </>
                  ) : (
                    "Ajukan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
