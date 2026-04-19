import { useState } from "react";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  MapPin, 
  FileText,
  Coffee,
  Home
} from "lucide-react";

interface Props {
  user: any;
  todayRecord: any;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  stats: any;
  onCheckIn: (notes?: string, location?: string) => Promise<boolean>;
  onCheckOut: (notes?: string) => Promise<boolean>;
  onRequestLeave: (type: "ON_LEAVE" | "WFH", reason: string, date: string) => Promise<boolean>;
  processing: boolean;
}

export default function COOAttendancePanel({
  user,
  todayRecord,
  hasCheckedIn,
  hasCheckedOut,
  stats,
  onCheckIn,
  onCheckOut,
  onRequestLeave,
  processing,
}: Props) {
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: "ON_LEAVE" as "ON_LEAVE" | "WFH",
    reason: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleCheckIn = async () => {
    const success = await onCheckIn("", "");
    if (success) alert("✅ Check-in berhasil!");
  };

  const handleCheckOut = async () => {
    const success = await onCheckOut("");
    if (success) alert("✅ Check-out berhasil!");
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onRequestLeave(leaveForm.type, leaveForm.reason, leaveForm.date);
    if (success) {
      alert("✅ Pengajuan berhasil!");
      setShowLeaveModal(false);
      setLeaveForm({ type: "ON_LEAVE", reason: "", date: new Date().toISOString().split("T")[0] });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-emerald-100 text-emerald-700";
      case "LATE": return "bg-amber-100 text-amber-700";
      case "ABSENT": return "bg-rose-100 text-rose-700";
      case "ON_LEAVE": return "bg-blue-100 text-blue-700";
      case "WFH": return "bg-purple-100 text-purple-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PRESENT": return "Hadir";
      case "LATE": return "Terlambat";
      case "ABSENT": return "Tidak Hadir";
      case "ON_LEAVE": return "Cuti";
      case "WFH": return "WFH";
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Check In/Out Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            Absensi Hari Ini
          </h3>
          <span className="text-sm text-slate-500">
            {new Date().toLocaleDateString("id-ID", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </span>
        </div>

        {todayRecord ? (
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(todayRecord.status)}`}>
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{getStatusLabel(todayRecord.status)}</p>
                  <p className="text-sm text-slate-500">
                    Check-in: {todayRecord.checkIn?.toDate?.().toLocaleTimeString("id-ID") || "-"}
                  </p>
                </div>
              </div>
              {!hasCheckedOut && (
                <button
                  onClick={handleCheckOut}
                  disabled={processing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold disabled:opacity-50"
                >
                  {processing ? "Memproses..." : "Check Out"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleCheckIn}
              disabled={processing || hasCheckedIn}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              {processing ? "Memproses..." : "Check In"}
            </button>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="px-4 py-3 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold"
            >
              <Calendar size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Monthly Stats */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar size={16} /> Ringkasan Bulan Ini
        </h3>
        <div className="grid grid-cols-5 gap-3">
          <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-xl font-black text-emerald-600">{stats?.present || 0}</p>
            <p className="text-xs text-emerald-700 font-medium">Hadir</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-xl font-black text-amber-600">{stats?.late || 0}</p>
            <p className="text-xs text-amber-700 font-medium">Terlambat</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-rose-50 border border-rose-200">
            <p className="text-xl font-black text-rose-600">{stats?.absent || 0}</p>
            <p className="text-xs text-rose-700 font-medium">Absen</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-xl font-black text-blue-600">{stats?.onLeave || 0}</p>
            <p className="text-xs text-blue-700 font-medium">Cuti</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-purple-50 border border-purple-200">
            <p className="text-xl font-black text-purple-600">{stats?.wfh || 0}</p>
            <p className="text-xs text-purple-700 font-medium">WFH</p>
          </div>
        </div>
      </div>

      {/* Leave/WFH Modal */}
      {showLeaveModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowLeaveModal(false)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Pengajuan Izin
            </h3>
            <form onSubmit={handleLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLeaveForm({ ...leaveForm, type: "ON_LEAVE" })}
                    className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-colors ${
                      leaveForm.type === "ON_LEAVE"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <Coffee size={16} className="inline mr-1" /> Cuti
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeaveForm({ ...leaveForm, type: "WFH" })}
                    className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-colors ${
                      leaveForm.type === "WFH"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <Home size={16} className="inline mr-1" /> WFH
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={leaveForm.date}
                  onChange={(e) => setLeaveForm({ ...leaveForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alasan</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 h-20"
                  placeholder="Jelaskan alasan izin..."
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {processing ? "Memproses..." : "Ajukan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
