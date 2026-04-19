import { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  Cpu,
  Database,
  HardDrive,
  LayoutDashboard,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Shield,
  Signal,
  Users,
  Wifi,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Ban,
  UserX,
  Play,
  Square,
  Download,
  Upload,
  Trash2,
  Settings,
  MapPin,
  Truck,
  Store,
  CreditCard,
} from "lucide-react";
import { useCTOSync } from "../hooks/useCTOSync";
import { useCTOSystemHealth } from "../hooks/useCTOSystemHealth";
import { useCTODatabaseBackup } from "../hooks/useCTODatabaseBackup";
import { useCTONetworkMonitor } from "../hooks/useCTONetworkMonitor";
import { useCTOUserAnalytics } from "../hooks/useCTOUserAnalytics";
import { useCTOAttendance } from "../hooks/useCTOAttendance";
import { useCTORecruitment } from "../hooks/useCTORecruitment";

interface Props {
  user: any;
}

// Neon Galaxy Theme Colors
const theme = {
  bg: "bg-slate-950",
  card: "bg-slate-900/80 border-slate-800",
  neon: {
    cyan: "text-cyan-400 border-cyan-500/50 shadow-cyan-500/20",
    purple: "text-purple-400 border-purple-500/50 shadow-purple-500/20",
    pink: "text-pink-400 border-pink-500/50 shadow-pink-500/20",
    emerald: "text-emerald-400 border-emerald-500/50 shadow-emerald-500/20",
    amber: "text-amber-400 border-amber-500/50 shadow-amber-500/20",
    rose: "text-rose-400 border-rose-500/50 shadow-rose-500/20",
  },
  gradient: "bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900",
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color = "cyan", trend }: any) => (
  <div className={`rounded-2xl border ${theme.card} p-5 backdrop-blur-sm`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className={`text-2xl font-bold mt-1 text-${color}-400`}>{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 ${trend > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl bg-${color}-500/10`}>
        <Icon size={24} className={`text-${color}-400`} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    HEALTHY: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
    WARNING: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    CRITICAL: "bg-rose-500/20 text-rose-400 border-rose-500/50",
    SYNCED: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/50",
    FAILED: "bg-rose-500/20 text-rose-400 border-rose-500/50",
    RUNNING: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 animate-pulse",
    COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || colors.HEALTHY}`}>
      {status}
    </span>
  );
};

export default function CTODashboardPageV2({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "sync" | "backup" | "network" | "users" | "system">("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hooks dengan try-catch wrapper
  let syncData, healthData, backupData, networkData, userData, attendanceData, recruitmentData;
  
  try {
    syncData = useCTOSync();
  } catch (e) { syncData = { loading: false, syncStatus: [], syncHealth: { synced: 0, totalCollections: 6 }, performFullSync: async () => false, syncing: false }; }
  
  try {
    healthData = useCTOSystemHealth();
  } catch (e) { healthData = { loading: false, metrics: null, dbHealth: [], healthStatus: "UNKNOWN", acknowledgeAlert: async () => {} }; }
  
  try {
    backupData = useCTODatabaseBackup();
  } catch (e) { backupData = { loading: false, backups: [], stats: null, createBackup: async () => false, creating: false }; }
  
  try {
    networkData = useCTONetworkMonitor();
  } catch (e) { networkData = { loading: false, isMonitoring: false, currentMetrics: null, quality: null, toggleMonitoring: () => {}, collectMetrics: async () => {} }; }
  
  try {
    userData = useCTOUserAnalytics();
  } catch (e) { userData = { loading: false, stats: null, bannedUsers: [], allUsers: [], getUsersBySource: () => [], banUser: async () => false, unbanUser: async () => false }; }
  
  try {
    attendanceData = useCTOAttendance(user);
  } catch (e) { attendanceData = { loading: false, stats: null, recordAttendance: async () => false }; }
  
  try {
    recruitmentData = useCTORecruitment(user);
  } catch (e) { recruitmentData = { loading: false, myRequests: [], stats: null, submitRequest: async () => false }; }

  const { loading: syncLoading, syncStatus, syncHealth, performFullSync, syncing } = syncData;
  const { loading: healthLoading, metrics, dbHealth, alerts, healthStatus } = healthData;
  const { loading: backupLoading, backups, stats: backupStats, createBackup, creating } = backupData;
  const { loading: networkLoading, isMonitoring, currentMetrics, quality, toggleMonitoring, collectMetrics } = networkData;
  const { loading: userLoading, stats: userStats, bannedUsers, allUsers, getUsersBySource } = userData;
  
  // Get user counts by source
  const mainUsers = getUsersBySource ? getUsersBySource("main") : [];
  const direksiUsers = getUsersBySource ? getUsersBySource("direksi") : [];
  const { loading: attendanceLoading, stats: attendanceStats } = attendanceData;
  const { loading: recruitmentLoading, stats: recruitmentStats } = recruitmentData;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      performFullSync?.(),
      collectMetrics?.(),
    ].filter(Boolean));
    setTimeout(() => setRefreshing(false), 1000);
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        activeTab === id
          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

  // Loading state
  const isLoading = syncLoading || healthLoading || backupLoading || networkLoading || userLoading || attendanceLoading || recruitmentLoading;

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cyan-400 font-medium">Initializing CTO Galaxy Control...</p>
          <p className="text-slate-500 text-sm mt-2">Loading system metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} text-slate-200`}>
      {/* Header */}
      <div className={`${theme.gradient} border-b border-slate-800`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Zap size={12} />
                System Command Center
              </div>
              <h1 className="text-3xl font-bold mt-3 text-white">
                CTO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Galaxy Control</span>
              </h1>
              <p className="text-slate-400 mt-1">
                Monitoring, Synchronization & Infrastructure Management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                Sync All
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm font-medium">Online</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-cyan-400">{syncHealth.synced}/{syncHealth.totalCollections}</p>
              <p className="text-xs text-slate-500">Synced</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-purple-400">{backupStats?.totalBackups || 0}</p>
              <p className="text-xs text-slate-500">Backups</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-emerald-400">{quality?.score || 0}</p>
              <p className="text-xs text-slate-500">Net Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-amber-400">{userStats?.total || 0}</p>
              <p className="text-xs text-slate-500">Users Total</p>
              <div className="flex justify-center gap-1 mt-1">
                <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1 rounded">M:{mainUsers.length}</span>
                <span className="text-[10px] text-purple-400 bg-purple-400/10 px-1 rounded">D:{direksiUsers.length}</span>
              </div>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-pink-400">{attendanceStats?.presentDays || 0}</p>
              <p className="text-xs text-slate-500">Present</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
              <p className="text-2xl font-bold text-rose-400">{bannedUsers.length}</p>
              <p className="text-xs text-slate-500">Banned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex flex-wrap gap-2">
            <TabButton id="overview" label="Overview" icon={LayoutDashboard} />
            <TabButton id="sync" label="Data Sync" icon={RefreshCw} />
            <TabButton id="backup" label="Backup" icon={Archive} />
            <TabButton id="network" label="Network" icon={Wifi} />
            <TabButton id="users" label="Users" icon={Users} />
            <TabButton id="system" label="System" icon={Server} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* System Health Status */}
            <div className={`rounded-2xl border ${theme.card} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="text-cyan-400" />
                  System Health Monitor
                </h2>
                <StatusBadge status={healthStatus} />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="CPU Usage"
                  value={`${metrics?.cpuUsage || 0}%`}
                  icon={Cpu}
                  color={metrics && metrics.cpuUsage > 80 ? "rose" : "cyan"}
                />
                <MetricCard
                  title="Memory"
                  value={`${Math.round(metrics?.memoryUsage || 0)}%`}
                  icon={MemoryStick}
                  color={metrics && metrics.memoryUsage > 85 ? "rose" : "purple"}
                />
                <MetricCard
                  title="Disk Usage"
                  value={`${metrics?.diskUsage || 0}%`}
                  icon={HardDrive}
                  color={metrics && metrics.diskUsage > 90 ? "rose" : "emerald"}
                />
                <MetricCard
                  title="Active Conn."
                  value={metrics?.activeConnections || 0}
                  icon={Network}
                  color="amber"
                />
              </div>
            </div>

            {/* Database Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`rounded-2xl border ${theme.card} p-6`}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Database className="text-cyan-400" />
                  Database Health
                </h3>
                <div className="space-y-3">
                  {dbHealth.map((db) => (
                    <div key={db.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${db.status === "HEALTHY" ? "bg-emerald-400" : db.status === "DEGRADED" ? "bg-amber-400" : "bg-rose-400"}`} />
                        <span className="text-slate-300 capitalize">{db.name} DB</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-slate-400">{db.responseTime}ms</span>
                        <p className="text-xs text-slate-500">{db.connections} conn</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Quality */}
              <div className={`rounded-2xl border ${theme.card} p-6`}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Signal className="text-purple-400" />
                  Network Quality
                </h3>
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                      {quality?.grade || "-"}
                    </p>
                    <p className={`text-lg font-medium mt-2 ${
                      quality?.status === "EXCELLENT" ? "text-emerald-400" :
                      quality?.status === "GOOD" ? "text-cyan-400" :
                      quality?.status === "FAIR" ? "text-amber-400" :
                      quality?.status === "POOR" ? "text-orange-400" : "text-rose-400"
                    }`}>
                      {quality?.status || "Unknown"}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Score: {quality?.score || 0}/100</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="text-center p-2 rounded-lg bg-slate-800/50">
                    <p className="text-cyan-400 font-bold">{currentMetrics?.downloadSpeed?.toFixed(1) || 0}</p>
                    <p className="text-xs text-slate-500">↓ Mbps</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-slate-800/50">
                    <p className="text-purple-400 font-bold">{currentMetrics?.uploadSpeed?.toFixed(1) || 0}</p>
                    <p className="text-xs text-slate-500">↑ Mbps</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Status */}
            <div className={`rounded-2xl border ${theme.card} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <RefreshCw className="text-emerald-400" />
                  Data Synchronization
                </h3>
                <button
                  onClick={() => performFullSync()}
                  disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 text-sm font-medium disabled:opacity-50"
                >
                  <RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
                  {syncing ? "Syncing..." : "Full Sync"}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {syncStatus.slice(0, 8).map((status) => (
                  <div key={status.id} className="p-3 rounded-xl bg-slate-800/50 flex items-center justify-between">
                    <span className="text-sm text-slate-300 capitalize">{status.collection}</span>
                    <StatusBadge status={status.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder - would expand in real implementation */}
        {activeTab === "sync" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <RefreshCw size={48} className="mx-auto text-cyan-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Data Synchronization</h2>
            <p className="text-slate-400 mt-2">Real-time sync between Main and Direksi databases</p>
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 rounded-xl bg-slate-800/50">
                <h3 className="text-cyan-400 font-bold mb-2">Main Database</h3>
                <p className="text-3xl font-bold text-white">{syncStatus.reduce((acc, s) => acc + (s.sourceCount || 0), 0).toLocaleString()}</p>
                <p className="text-slate-500 text-sm">Total Records</p>
              </div>
              <div className="p-6 rounded-xl bg-slate-800/50">
                <h3 className="text-purple-400 font-bold mb-2">Direksi Database</h3>
                <p className="text-3xl font-bold text-white">{syncStatus.reduce((acc, s) => acc + (s.targetCount || 0), 0).toLocaleString()}</p>
                <p className="text-slate-500 text-sm">Total Records</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "backup" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <Archive size={48} className="mx-auto text-purple-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Database Backup</h2>
            <p className="text-slate-400 mt-2">Automated and manual backup management</p>
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => createBackup("FULL", "both")}
                disabled={creating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400 font-bold disabled:opacity-50"
              >
                <Download size={20} />
                {creating ? "Creating..." : "Full Backup"}
              </button>
            </div>
            <p className="text-slate-500 text-sm mt-4">
              Total Size: {((backupStats?.totalSize || 0) / 1024).toFixed(2)} GB | 
              Last Backup: {backupStats?.lastBackup ? new Date(backupStats.lastBackup.toDate()).toLocaleString("id-ID") : "Never"}
            </p>
          </div>
        )}

        {activeTab === "network" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <Wifi size={48} className="mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-bold text-white">Network Monitor</h2>
            <p className="text-slate-400 mt-2">Real-time network performance tracking</p>
            <button
              onClick={toggleMonitoring}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl mx-auto mt-8 font-bold transition-all ${
                isMonitoring 
                  ? "bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400" 
                  : "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400"
              }`}
            >
              {isMonitoring ? <Square size={20} /> : <Play size={20} />}
              {isMonitoring ? "Stop Monitor" : "Start Monitor"}
            </button>
            <p className="text-slate-500 text-sm mt-4">
              Current Ping: {currentMetrics?.ping || 0}ms | 
              Packet Loss: {currentMetrics?.packetLoss?.toFixed(2) || 0}%
            </p>
          </div>
        )}

        {activeTab === "users" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <Users size={48} className="mx-auto text-pink-400 mb-4" />
            <h2 className="text-xl font-bold text-white">User Management</h2>
            <p className="text-slate-400 mt-2">User analytics and access control</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-3xl font-bold text-pink-400">{userStats?.total || 0}</p>
                <p className="text-slate-500 text-sm">Total Users</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-3xl font-bold text-emerald-400">{userStats?.byStatus?.active || 0}</p>
                <p className="text-slate-500 text-sm">Active</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-3xl font-bold text-rose-400">{bannedUsers.length}</p>
                <p className="text-slate-500 text-sm">Banned</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <p className="text-3xl font-bold text-amber-400">{userStats?.growth?.daily || 0}</p>
                <p className="text-slate-500 text-sm">New Today</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "system" && (
          <div className={`rounded-2xl border ${theme.card} p-8 text-center`}>
            <Server size={48} className="mx-auto text-cyan-400 mb-4" />
            <h2 className="text-xl font-bold text-white">System Configuration</h2>
            <p className="text-slate-400 mt-2">System settings and parameters</p>
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-slate-800/50">
                <Settings className="mx-auto text-cyan-400 mb-2" size={24} />
                <p className="text-slate-300 font-medium">System Config</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <MapPin className="mx-auto text-purple-400 mb-2" size={24} />
                <p className="text-slate-300 font-medium">Operational Map</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/50">
                <CreditCard className="mx-auto text-emerald-400 mb-2" size={24} />
                <p className="text-slate-300 font-medium">Pricing Config</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
