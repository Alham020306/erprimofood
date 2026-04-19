import { useState } from "react";
import {
  Crown,
  LayoutDashboard,
  FileText,
  Mail,
  Clock,
  Store,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock3,
  Send,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  DollarSign,
  Settings,
  ChevronRight,
  Bell,
  Download,
  Eye,
  MoreHorizontal,
  Filter,
  Search,
} from "lucide-react";
import { useCEOReports } from "../hooks/useCEOReports";
import { useCEOLetters } from "../hooks/useCEOLetters";
import { useCEOAttendance } from "../hooks/useCEOAttendance";
import SendReportToCEO from "../../shared/components/SendReportToCEO";

interface Props {
  user: any;
}

// Royal/Gold Theme for CEO
const theme = {
  bg: "bg-slate-950",
  card: "bg-slate-900/80 border-slate-800",
  gold: "text-amber-400 border-amber-500/50 shadow-amber-500/20",
  gradient: "bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900",
  accent: "bg-gradient-to-r from-amber-500 to-yellow-400",
};

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`rounded-2xl border ${theme.card} p-5 backdrop-blur-sm hover:border-amber-500/30 transition-all cursor-pointer group`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1 text-white group-hover:text-amber-400 transition-colors">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 ${trend > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div className="p-3 rounded-xl bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
        <Icon size={24} className="text-amber-400" />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status, getColor }: { status: string; getColor: (s: any) => string }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getColor(status)}`}>
    {status}
  </span>
);

export default function CEODashboardPageV2({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "letters" | "attendance">("overview");
  const [showSendReport, setShowSendReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedLetter, setSelectedLetter] = useState<any>(null);

  // Hooks
  const { loading: reportsLoading, reports, stats: reportStats, getPendingReports, getUrgentReports, getTypeLabel, getPriorityColor, getStatusColor } = useCEOReports(user);
  const { loading: lettersLoading, letters, stats: letterStats, getPendingLetters, getUrgentLetters, getTypeLabel: getLetterTypeLabel, getPriorityColor: getLetterPriorityColor, getStatusColor: getLetterStatusColor } = useCEOLetters(user);
  const { loading: attendanceLoading, stats: attendanceStats, allDirectorsStats, getAllDirectorsSummary } = useCEOAttendance(user);

  const TabButton = ({ id, label, icon: Icon, count }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        activeTab === id
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/50"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      }`}
    >
      <Icon size={16} />
      {label}
      {count > 0 && (
        <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded-full">{count}</span>
      )}
    </button>
  );

  const pendingReports = getPendingReports();
  const urgentReports = getUrgentReports();
  const pendingLetters = getPendingLetters();
  const urgentLetters = getUrgentLetters();
  const directorsSummary = getAllDirectorsSummary();

  return (
    <div className={`min-h-screen ${theme.bg} text-slate-200`}>
      {/* Send Report Modal */}
      <SendReportToCEO
        user={user}
        isOpen={showSendReport}
        onClose={() => setShowSendReport(false)}
      />

      {/* Header */}
      <div className={`${theme.gradient} border-b border-slate-800`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Crown size={12} />
                Chief Executive Officer
              </div>
              <h1 className="text-3xl font-bold mt-3 text-white">
                CEO <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Executive Command</span>
              </h1>
              <p className="text-slate-400 mt-1">
                Oversight, Reports & Strategic Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSendReport(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold transition-all"
              >
                <Send size={16} />
                Kirim Laporan
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-amber-400">{reportStats.total}</p>
              <p className="text-xs text-slate-500">Total Laporan</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-rose-400">{reportStats.pending + letterStats.pending}</p>
              <p className="text-xs text-slate-500">Pending Review</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-emerald-400">{reportStats.approved + letterStats.approved}</p>
              <p className="text-xs text-slate-500">Approved</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-blue-400">{letterStats.total}</p>
              <p className="text-xs text-slate-500">Surat Pengajuan</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-purple-400">{attendanceStats?.attendanceRate || 0}%</p>
              <p className="text-xs text-slate-500">Kehadiran</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-cyan-400">{directorsSummary.length}</p>
              <p className="text-xs text-slate-500">Direksi Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon={LayoutDashboard} count={0} />
            <TabButton id="reports" label="Laporan" icon={FileText} count={reportStats.pending} />
            <TabButton id="letters" label="Surat Pengajuan" icon={Mail} count={letterStats.pending + letterStats.underReview} />
            <TabButton id="attendance" label="Absensi Direksi" icon={Clock} count={0} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Urgent Items Alert */}
            {(urgentReports.length > 0 || urgentLetters.length > 0) && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-rose-400" size={24} />
                  <h3 className="text-lg font-bold text-rose-400">Item Mendesak Perlu Perhatian</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {urgentReports.slice(0, 2).map((report) => (
                    <div key={report.id} className="p-3 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-medium">{getTypeLabel(report.type)}</span>
                        <StatusBadge status={report.priority} getColor={getPriorityColor} />
                      </div>
                      <p className="text-white font-medium mt-1">{report.title}</p>
                      <p className="text-slate-500 text-sm">Dari: {report.senderName} ({report.senderRole})</p>
                    </div>
                  ))}
                  {urgentLetters.slice(0, 2).map((letter) => (
                    <div key={letter.id} className="p-3 bg-slate-900/50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-400 font-medium">{getLetterTypeLabel(letter.type)}</span>
                        <StatusBadge status={letter.priority} getColor={getLetterPriorityColor} />
                      </div>
                      <p className="text-white font-medium mt-1">{letter.subject}</p>
                      <p className="text-slate-500 text-sm">Dari: {letter.senderName} ({letter.senderRole})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <MetricCard
                title="Laporan Masuk"
                value={reportStats.total}
                subtitle={`${reportStats.pending} menunggu review`}
                icon={FileText}
                onClick={() => setActiveTab("reports")}
              />
              <MetricCard
                title="Surat Pengajuan"
                value={letterStats.total}
                subtitle={`${letterStats.pending + letterStats.underReview} perlu tindakan`}
                icon={Mail}
                onClick={() => setActiveTab("letters")}
              />
            </div>

            {/* Reports by Type */}
            <div className={`rounded-2xl border ${theme.card} p-6`}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="text-amber-400" />
                Laporan by Jenis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(reportStats.byType).map(([type, count]) => (
                  <div key={type} className="text-center p-3 rounded-xl bg-slate-800/50">
                    <p className="text-xl font-bold text-amber-400">{count}</p>
                    <p className="text-xs text-slate-500">{getTypeLabel(type as any)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Reports */}
              <div className={`rounded-2xl border ${theme.card} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="text-cyan-400" />
                    Laporan Terbaru
                  </h3>
                  <button 
                    onClick={() => setActiveTab("reports")}
                    className="text-amber-400 text-sm hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>
                <div className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div key={report.id} className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                         onClick={() => setSelectedReport(report)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{report.title}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {report.senderName} • {getTypeLabel(report.type)}
                          </p>
                        </div>
                        <StatusBadge status={report.status} getColor={getStatusColor} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Letters */}
              <div className={`rounded-2xl border ${theme.card} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Mail className="text-purple-400" />
                    Surat Terbaru
                  </h3>
                  <button 
                    onClick={() => setActiveTab("letters")}
                    className="text-amber-400 text-sm hover:underline"
                  >
                    Lihat Semua
                  </button>
                </div>
                <div className="space-y-3">
                  {letters.slice(0, 5).map((letter) => (
                    <div key={letter.id} className="p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                         onClick={() => setSelectedLetter(letter)}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium text-sm">{letter.subject}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {letter.senderName} • {getLetterTypeLabel(letter.type)}
                          </p>
                        </div>
                        <StatusBadge status={letter.status} getColor={getLetterStatusColor} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <FileText size={48} className="mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Laporan ke CEO</h2>
            <p className="text-slate-400 mt-2">Semua laporan dari berbagai departemen</p>
            <div className="mt-6 text-left">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari laporan..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 rounded-xl text-white placeholder-slate-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl text-slate-400">
                  <Filter size={18} />
                  Filter
                </button>
              </div>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{report.title}</p>
                      <p className="text-slate-500 text-sm">{report.senderName} • {getTypeLabel(report.type)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={report.priority} getColor={getPriorityColor} />
                      <StatusBadge status={report.status} getColor={getStatusColor} />
                      <button className="p-2 hover:bg-slate-700 rounded-lg">
                        <Eye size={18} className="text-slate-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Letters Tab */}
        {activeTab === "letters" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <Mail size={48} className="mx-auto text-purple-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Surat Pengajuan</h2>
            <p className="text-slate-400 mt-2">Pengajuan, permohonan, dan surat dinas</p>
            <div className="mt-6 text-left space-y-2">
              {letters.map((letter) => (
                <div key={letter.id} className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{letter.subject}</p>
                    <p className="text-slate-500 text-sm">{letter.senderName} • {getLetterTypeLabel(letter.type)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={letter.priority} getColor={getLetterPriorityColor} />
                    <StatusBadge status={letter.status} getColor={getLetterStatusColor} />
                    <button className="p-2 hover:bg-slate-700 rounded-lg">
                      <Eye size={18} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className={`rounded-2xl border ${theme.card} p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="text-amber-400" size={28} />
                <div>
                  <h2 className="text-xl font-bold text-white">Absensi & Kehadiran Direksi</h2>
                  <p className="text-slate-400 text-sm">Monitoring kehadiran seluruh C-Level dan Direksi</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-5 gap-4">
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <p className="text-3xl font-bold text-emerald-400">{allDirectorsStats.length}</p>
                  <p className="text-slate-500 text-sm">Total Direksi</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <p className="text-3xl font-bold text-cyan-400">
                    {allDirectorsStats.filter(d => d.attendanceRate >= 80).length}
                  </p>
                  <p className="text-slate-500 text-sm">Hadir Baik (≥80%)</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <p className="text-3xl font-bold text-amber-400">
                    {allDirectorsStats.reduce((sum, d) => sum + d.lateCount, 0)}
                  </p>
                  <p className="text-slate-500 text-sm">Total Terlambat</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <p className="text-3xl font-bold text-purple-400">
                    {allDirectorsStats.reduce((sum, d) => sum + d.overtimeCount, 0)}
                  </p>
                  <p className="text-slate-500 text-sm">Total Lembur</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700">
                  <p className="text-3xl font-bold text-blue-400">
                    {allDirectorsStats.reduce((sum, d) => sum + d.workFromHomeCount, 0)}
                  </p>
                  <p className="text-slate-500 text-sm">Total WFH</p>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className={`rounded-2xl border ${theme.card} overflow-hidden`}>
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Rekap Absensi per Direksi</h3>
                <p className="text-slate-400 text-sm">Bulan {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Check In</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Check Out</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Rate</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Terlambat</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Lembur</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">WFH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {allDirectorsStats.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                          Belum ada data absensi untuk bulan ini
                        </td>
                      </tr>
                    ) : (
                      allDirectorsStats.map((director) => (
                        <tr key={director.directorId} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-white">{director.name}</p>
                              <p className="text-xs text-slate-500">ID: {director.directorId.slice(-6)}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              {director.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-emerald-400 font-bold">{director.checkIns}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-cyan-400 font-bold">{director.checkOuts}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className={`w-16 h-2 rounded-full ${
                                director.attendanceRate >= 80 ? 'bg-emerald-500/30' : 
                                director.attendanceRate >= 60 ? 'bg-amber-500/30' : 'bg-rose-500/30'
                              }`}>
                                <div 
                                  className={`h-full rounded-full ${
                                    director.attendanceRate >= 80 ? 'bg-emerald-400' : 
                                    director.attendanceRate >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${Math.min(director.attendanceRate, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-bold ${
                                director.attendanceRate >= 80 ? 'text-emerald-400' : 
                                director.attendanceRate >= 60 ? 'text-amber-400' : 'text-rose-400'
                              }`}>
                                {director.attendanceRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {director.lateCount > 0 ? (
                              <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-400 text-sm font-bold">
                                {director.lateCount}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {director.overtimeCount > 0 ? (
                              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-sm font-bold">
                                {director.overtimeCount}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {director.workFromHomeCount > 0 ? (
                              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-sm font-bold">
                                {director.workFromHomeCount}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className={`rounded-2xl border ${theme.card} p-8`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="text-amber-400" />
                  Laporan ke CEO
                </h2>
                <p className="text-slate-400 mt-1">Semua laporan dari berbagai departemen</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Cari laporan..."
                    className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:bg-slate-700">
                  <Filter size={18} />
                  Filter
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="p-4 bg-slate-800/50 rounded-xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                  <div>
                    <p className="text-white font-medium">{report.title}</p>
                    <p className="text-slate-500 text-sm">{report.senderName} • {getTypeLabel(report.type)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.priority} getColor={getPriorityColor} />
                    <StatusBadge status={report.status} getColor={getStatusColor} />
                    <button className="p-2 hover:bg-slate-700 rounded-lg">
                      <Eye size={18} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
