import { Users, UserCheck, UserX, Briefcase, Search, Plus, Database, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useHREmployees } from "../hooks/useHREmployees";
import HRMetricCard from "../components/HRMetricCard";
import HREmployeeTable from "../components/HREmployeeTable";
import HRAddEmployeeModal from "../components/HRAddEmployeeModal";
import { checkHREmployeesCollection, seedHREmployees } from "../services/hrEmployeeService";

export default function HREmployeesPage() {
  const result = useHREmployees();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [needsSeed, setNeedsSeed] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const loading = result?.loading ?? false;
  const items = result?.items ?? [];
  const summary = result?.summary ?? {
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    terminated: 0,
  };

  // Check if collection needs seeding
  useEffect(() => {
    const checkCollection = async () => {
      try {
        const hasData = await checkHREmployeesCollection();
        setNeedsSeed(!hasData);
      } catch {
        setNeedsSeed(true);
      }
    };
    checkCollection();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedHREmployees();
      setNeedsSeed(false);
      window.location.reload(); // Reload to refresh data
    } catch (err) {
      console.error("Failed to seed employees:", err);
    } finally {
      setSeeding(false);
    }
  };

  const filteredItems = items.filter((item: any) =>
    String(item?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item?.department || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item?.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-emerald-500/20 bg-white p-8 shadow-xl">
          <p className="text-sm text-slate-500">Loading employees...</p>
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
            <Briefcase size={14} className="text-white" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">
              Employee Management
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black text-white">Internal Employees</h1>
          <p className="mt-2 text-emerald-100">
            Manage company workforce, departments, and employment status.
          </p>
        </div>
      </section>

      {/* Seed Alert */}
      {needsSeed && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <AlertCircle size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Database Setup Required</h3>
              <p className="mt-1 text-sm text-amber-700">
                The employee collection is empty. Click the button below to seed initial HR employee data.
              </p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="mt-4 flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {seeding ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Seeding...
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    Seed Employee Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <HRMetricCard 
          title="Total Employees" 
          value={summary.total} 
          icon={Users}
          tone="emerald"
        />
        <HRMetricCard 
          title="Active" 
          value={summary.active} 
          icon={UserCheck}
          tone="emerald"
        />
        <HRMetricCard 
          title="Inactive" 
          value={summary.inactive || 0} 
          icon={UserX}
          tone="slate"
        />
        <HRMetricCard 
          title="Suspended" 
          value={summary.suspended || 0} 
          icon={UserX}
          tone="rose"
        />
        <HRMetricCard 
          title="Departments" 
          value={new Set(items.map((i: any) => i.department)).size} 
          icon={Briefcase}
          tone="blue"
        />
      </div>

      {/* Search & Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employees..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none ring-2 ring-transparent transition focus:border-emerald-300 focus:ring-emerald-100"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Table */}
      <HREmployeeTable rows={filteredItems} />

      {/* Add Employee Modal */}
      <HRAddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setIsModalOpen(false)}
      />
    </div>
  );
}