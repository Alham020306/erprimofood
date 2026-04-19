import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Store,
  AlertTriangle,
  Receipt,
  ArrowRight,
  PieChart,
  FileText,
  DollarSign,
} from "lucide-react";
import { useCFOUnifiedDashboard } from "../hooks/useCFOUnifiedDashboard";
import { formatCurrency, formatNumber } from "../utils/formatters";

// Compact metric dengan icon
const CompactMetric = ({
  title,
  value,
  icon: Icon,
  tone,
  subtitle,
  onClick,
}: {
  title: string;
  value: string;
  icon: any;
  tone: "emerald" | "blue" | "amber" | "rose" | "indigo";
  subtitle?: string;
  onClick?: () => void;
}) => {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div 
      onClick={onClick}
      className={`rounded-2xl border p-4 ${toneMap[tone]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70">
          <Icon size={20} />
        </div>
        <div>
          <div className="text-xs font-medium opacity-80">{title}</div>
          <div className="text-lg font-bold">{value}</div>
          {subtitle && <div className="text-[10px] opacity-60">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

// Navigation Card
const NavCard = ({
  title,
  description,
  icon: Icon,
  href,
  tone,
}: {
  title: string;
  description: string;
  icon: any;
  href: string;
  tone: "emerald" | "indigo" | "amber" | "rose" | "blue";
}) => {
  const toneMap = {
    emerald: "from-emerald-50 to-teal-50 border-emerald-200",
    indigo: "from-indigo-50 to-purple-50 border-indigo-200",
    amber: "from-amber-50 to-orange-50 border-amber-200",
    rose: "from-rose-50 to-pink-50 border-rose-200",
    blue: "from-blue-50 to-sky-50 border-blue-200",
  };

  return (
    <a
      href={`#${href}`}
      className={`block rounded-2xl border bg-gradient-to-br ${toneMap[tone]} p-5 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon size={24} className={`text-${tone}-600`} />
        </div>
        <ArrowRight size={18} className="text-slate-400" />
      </div>
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </a>
  );
};

export default function CFODashboardPage() {
  const { loading, metrics, orderAnalysis } = useCFOUnifiedDashboard();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-500">Loading CFO dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className="font-semibold">Financial data not available</span>
        </div>
        <p className="mt-1 text-sm">Summary belum di-generate. Hubungi CTO untuk refresh data.</p>
      </div>
    );
  }

  const cashflowHealth = metrics.netCashflow >= 0 ? "emerald" : "rose";
  const CashflowIcon = metrics.netCashflow >= 0 ? TrendingUp : TrendingDown;
  const isProfitable = metrics.netIncome > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              CFO Command Center
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Financial Overview
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Quick summary dengan akses cepat ke modul finansial
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Last Update</p>
            <p className="text-sm font-medium text-slate-700">
              {metrics.updatedAt ? new Date(metrics.updatedAt).toLocaleString("id-ID") : "-"}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Access Modules */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NavCard
          title="Revenue Report"
          description="Income statement, balance sheet & analisis lengkap"
          icon={FileText}
          href="revenue"
          tone="emerald"
        />
        <NavCard
          title="Fund & Cash"
          description="Fund requests, cash in/out, approval workflow"
          icon={DollarSign}
          href="fund-management"
          tone="indigo"
        />
        <NavCard
          title="Recruitment"
          description="Ajukan kebutuhan staff ke HR"
          icon={Users}
          href="recruitment"
          tone="blue"
        />
        <NavCard
          title="Settlements"
          description="Partner & driver balance management"
          icon={Wallet}
          href="settlements"
          tone="amber"
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CompactMetric
          title="Net Cashflow"
          value={formatCurrency(metrics.netCashflow)}
          icon={CashflowIcon}
          tone={cashflowHealth}
          subtitle={metrics.netCashflow >= 0 ? "Healthy" : "Attention"}
        />
        <CompactMetric
          title="Revenue (Completed)"
          value={formatCurrency(orderAnalysis?.totalRevenue || 0)}
          icon={TrendingUp}
          tone="emerald"
          subtitle={`${orderAnalysis?.completed || 0} orders`}
        />
        <CompactMetric
          title="Settlement Exposure"
          value={formatCurrency(metrics.totalRestaurantBalance + metrics.totalDriverBalance)}
          icon={Wallet}
          tone="amber"
          subtitle={`${formatCurrency(metrics.totalUnpaidCommission)} unpaid`}
        />
        <CompactMetric
          title="Net Income"
          value={formatCurrency(metrics.netIncome || 0)}
          icon={isProfitable ? TrendingUp : TrendingDown}
          tone={isProfitable ? "emerald" : "rose"}
          subtitle={isProfitable ? "Profitable" : "Loss"}
        />
      </div>

      {/* Alerts */}
      {metrics.financeAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertTriangle size={18} />
            Financial Alerts ({metrics.financeAlerts.length})
          </div>
          <div className="space-y-1">
            {metrics.financeAlerts.slice(0, 3).map((alert: string, index: number) => (
              <div key={index} className="text-sm text-amber-700">
                • {alert}
              </div>
            ))}
            {metrics.financeAlerts.length > 3 && (
              <div className="text-xs text-amber-600">
                +{metrics.financeAlerts.length - 3} more alerts di Revenue Report
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(orderAnalysis?.total || 0)}
          </div>
          <div className="text-xs text-slate-500">Total Orders</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(metrics.verifiedRestaurants)}
          </div>
          <div className="text-xs text-slate-500">Merchants</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(metrics.verifiedDrivers)}
          </div>
          <div className="text-xs text-slate-500">Drivers</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(metrics.metrics?.averageOrderValue || 0)}
          </div>
          <div className="text-xs text-slate-500">Avg Order</div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <PieChart size={20} className="mt-0.5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-700">
              Data Keuangan Tersinkronisasi Harian
            </p>
            <p className="text-xs text-slate-500 mt-1">
              CFO Dashboard menampilkan summary real-time. Untuk laporan lengkap dengan
              Income Statement, Balance Sheet, dan analisis detail, gunakan halaman{" "}
              <a href="#revenue" className="text-emerald-600 hover:underline">Revenue</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

