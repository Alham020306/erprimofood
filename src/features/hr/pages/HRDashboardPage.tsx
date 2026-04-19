import { Users, Bike, CheckCircle, Clock, Ban, TrendingUp, AlertCircle, Briefcase, UserCheck, UserX } from "lucide-react";
import { useHRDashboard } from "../hooks/useHRDashboard";
import HRMetricCard from "../components/HRMetricCard";
import HRDemandTable from "../components/HRDemandTable";
import HRDriverFleetTable from "../components/HRDriverFleetTable";

export default function HRDashboardPage() {
  const { loading, overview, drivers, driverStats, employees, employeeStats, workforceDemand } = useHRDashboard();

  if (loading) return <div>Loading HR dashboard...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 backdrop-blur-sm">
            <Users size={14} className="text-white" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              HR Command Center
            </span>
          </div>
          
          <h1 className="mt-4 text-4xl font-black text-white">
            Workforce Management
          </h1>
          <p className="mt-3 max-w-xl text-emerald-100">
            Pantau armada driver, karyawan internal, verifikasi, dan kebutuhan tenaga kerja secara real-time.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Bike size={16} className="text-emerald-200" />
              <span className="text-sm font-bold text-white">{driverStats.total} Total Drivers</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Briefcase size={16} className="text-emerald-200" />
              <span className="text-sm font-bold text-white">{employeeStats.total} Total Employees</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-sm">
              <TrendingUp size={16} className="text-emerald-200" />
              <span className="text-sm font-bold text-white">{driverStats.onlineRate}% Online Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Employees Metrics */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Briefcase size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Internal Employees</h2>
            <p className="text-sm text-slate-500">Karyawan perusahaan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <HRMetricCard 
            title="Total Employees" 
            value={employeeStats.total}
            icon={Users}
            tone="blue"
          />
          <HRMetricCard 
            title="Active" 
            value={employeeStats.active}
            icon={UserCheck}
            tone="emerald"
          />
          <HRMetricCard 
            title="Inactive" 
            value={employeeStats.inactive}
            icon={UserX}
            tone="slate"
          />
          <HRMetricCard 
            title="Suspended" 
            value={employeeStats.suspended}
            icon={Ban}
            tone="amber"
          />
          <HRMetricCard 
            title="Terminated" 
            value={employeeStats.terminated}
            icon={Ban}
            tone="rose"
          />
        </div>
      </section>

      {/* Driver Fleet Metrics */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Bike size={20} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Driver Fleet</h2>
            <p className="text-sm text-slate-500">Statistik armada pengantar</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <HRMetricCard 
            title="Total Drivers" 
            value={overview.totalDrivers}
            icon={Users}
            tone="emerald"
          />
          <HRMetricCard 
            title="Online Now" 
            value={overview.onlineDrivers}
            icon={Bike}
            tone="emerald"
          />
          <HRMetricCard 
            title="Offline" 
            value={overview.offlineDrivers}
            icon={Clock}
            tone="slate"
          />
          <HRMetricCard 
            title="Verified" 
            value={overview.verifiedDrivers}
            icon={CheckCircle}
            tone="blue"
          />
          <HRMetricCard 
            title="Pending" 
            value={overview.pendingDriverVerification}
            icon={AlertCircle}
            tone="amber"
          />
          <HRMetricCard 
            title="Suspended" 
            value={overview.bannedDrivers}
            icon={Ban}
            tone="rose"
          />
        </div>
      </section>

      {/* Driver Fleet Table */}
      <HRDriverFleetTable drivers={drivers} />

      {/* Workforce Demand */}
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Users size={20} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Workforce Demand</h2>
            <p className="text-sm text-slate-500">Kebutuhan tenaga kerja per area</p>
          </div>
        </div>
        <HRDemandTable rows={workforceDemand} />
      </section>
    </div>
  );
}