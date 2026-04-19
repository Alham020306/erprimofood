import { useState } from "react";
import { useCOOUnifiedDashboard } from "../hooks/useCOOUnifiedDashboard";
import { useCOORecruitment } from "../hooks/useCOORecruitment";
import COOSummaryCards from "../components/COOSummaryCards";
import COORecruitmentPanel from "../components/COORecruitmentPanel";
import COOAnalyticsCharts from "../components/COOAnalyticsCharts";
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp,
  Store,
  Truck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface Props {
  user: any;
}

const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: any; 
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
      active
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-slate-600 hover:text-slate-900"
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

export default function COODashboardPageV2({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "hr-recruitment">("overview");
  
  const { 
    loading: dashboardLoading, 
    metrics, 
    chartData, 
    summary 
  } = useCOOUnifiedDashboard();

  const {
    loading: recruitmentLoading,
    submitting: recruitmentSubmitting,
    myRequests,
    stats: recruitmentStats,
    submitRequest,
  } = useCOORecruitment(user);

  const loading = dashboardLoading || recruitmentLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <LayoutDashboard size={24} className="text-blue-600" />
              COO Operations Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitoring & Analytics Operasional Real-Time
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200">
              <RefreshCw size={14} />
              <span>Live Sync: {summary?.lastUpdated?.toDate?.().toLocaleString("id-ID") || "Now"}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{user?.name || user?.email}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 bg-white rounded-t-2xl px-2">
        <TabButton
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          icon={Store}
          label="Overview"
        />
        <TabButton
          active={activeTab === "analytics"}
          onClick={() => setActiveTab("analytics")}
          icon={TrendingUp}
          label="Analytics"
        />
        <TabButton
          active={activeTab === "hr-recruitment"}
          onClick={() => setActiveTab("hr-recruitment")}
          icon={Users}
          label="Recruitment ke HR"
        />
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <COOSummaryCards metrics={metrics} />
            
            {/* Top Performers Tables */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Top 5 Merchants by Orders */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
                  <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <Store size={16} /> Top 5 Merchant (Paling Banyak Orderan)
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-auto">
                  {metrics?.topMerchants?.map((m: any, idx: number) => (
                    <div key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{m.name}</p>
                          <p className="text-xs text-slate-500">{m.category || "No category"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{m.orderCount} orders</p>
                        <p className="text-xs text-slate-400">Rp {m.revenue?.toLocaleString("id-ID") || 0}</p>
                      </div>
                    </div>
                  ))}
                  {(!metrics?.topMerchants || metrics.topMerchants.length === 0) && (
                    <div className="p-4 text-center text-slate-400 text-sm">Belum ada data</div>
                  )}
                </div>
              </div>

              {/* Top 5 Drivers by Orders */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                  <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                    <Truck size={16} /> Top 5 Driver (Paling Banyak Orderan)
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-auto">
                  {metrics?.topDrivers?.map((d: any, idx: number) => (
                    <div key={d.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{d.name || d.fullName}</p>
                          <p className="text-xs text-slate-500">⭐ {d.rating?.toFixed(1) || "0.0"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">{d.orderCount} orders</p>
                      </div>
                    </div>
                  ))}
                  {(!metrics?.topDrivers || metrics.topDrivers.length === 0) && (
                    <div className="p-4 text-center text-slate-400 text-sm">Belum ada data</div>
                  )}
                </div>
              </div>

              {/* Top 10 Menu Items */}
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden md:col-span-2">
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-200">
                  <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    <TrendingUp size={16} /> Top 10 Menu Paling Sering Dipesan
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-2 p-2 max-h-80 overflow-auto">
                  {metrics?.topMenuItems?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.restaurantName}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                        {item.count}x
                      </span>
                    </div>
                  ))}
                  {(!metrics?.topMenuItems || metrics.topMenuItems.length === 0) && (
                    <div className="col-span-2 p-4 text-center text-slate-400 text-sm">Belum ada data</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <COOAnalyticsCharts chartData={chartData} />
        )}

        {activeTab === "hr-recruitment" && (
          <COORecruitmentPanel
            user={user}
            myRequests={myRequests}
            stats={recruitmentStats}
            onSubmit={submitRequest}
            submitting={recruitmentSubmitting}
          />
        )}
      </div>

      {/* Info Footer */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800">Informasi Sinkronisasi</p>
            <p className="text-xs text-blue-600 mt-1">
              Data dashboard diperbarui secara real-time dari database utama. 
              Data absensi dan recruitment disimpan di database direksi (C-Level).
              Summary metrics disinkronkan oleh CTO ke direksi database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
