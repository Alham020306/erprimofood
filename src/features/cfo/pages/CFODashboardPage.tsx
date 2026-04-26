import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  FileText,
  Package,
  PieChart,
  Receipt,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useCFOUnifiedDashboard } from "../hooks/useCFOUnifiedDashboard";
import { formatCurrency, formatNumber } from "../utils/formatters";
import SettlementTrendLineChart from "../components/SettlementTrendLineChart";

const CompactMetric = ({
  title,
  value,
  icon: Icon,
  tone,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  tone: "emerald" | "blue" | "amber" | "rose" | "indigo";
  subtitle?: string;
}) => {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
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

const ActionCard = ({
  title,
  description,
  icon: Icon,
  tone,
  onClick,
}: {
  title: string;
  description: string;
  icon: any;
  tone: "emerald" | "indigo" | "amber" | "rose" | "blue";
  onClick: () => void;
}) => {
  const toneMap = {
    emerald: "from-emerald-50 to-teal-50 border-emerald-200",
    indigo: "from-indigo-50 to-purple-50 border-indigo-200",
    amber: "from-amber-50 to-orange-50 border-amber-200",
    rose: "from-rose-50 to-pink-50 border-rose-200",
    blue: "from-blue-50 to-sky-50 border-blue-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`block rounded-2xl border bg-gradient-to-br ${toneMap[tone]} p-5 text-left shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
          <Icon size={24} />
        </div>
        <ArrowRight size={18} className="text-slate-400" />
      </div>
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </button>
  );
};

type Props = {
  onNavigate?: (page: string) => void;
};

export default function CFODashboardPage({ onNavigate }: Props) {
  const { loading, metrics, orderAnalysis, settlementSummary, settlementTrend, commissionRates } =
    useCFOUnifiedDashboard();
  const [settlementChartMode, setSettlementChartMode] = useState<
    "ALL" | "RESTAURANT" | "DRIVER"
  >("ALL");

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
  const isProfitable = metrics.netCashflow > 0;
  const merchantRateLabel = `${Math.round(commissionRates.RESTAURANT * 100)}%`;
  const driverRateLabel = `${Math.round(commissionRates.DRIVER * 100)}%`;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              CFO Command Center
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Financial Overview</h2>
            <p className="mt-1 text-sm text-slate-600">
              Ringkasan cashflow, exposure komisi, dan perilaku order terbaru.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Last Update</p>
            <p className="text-sm font-medium text-slate-700">
              {metrics.updatedAt ? new Date(metrics.updatedAt).toLocaleString("id-ID") : "-"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Komisi Merchant {merchantRateLabel} | Driver {driverRateLabel}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          title="Revenue Report"
          description="Income statement, balance sheet, dan laporan lengkap."
          icon={FileText}
          tone="emerald"
          onClick={() => onNavigate?.("revenue")}
        />
        <ActionCard
          title="Fund & Cash"
          description="Fund requests, cash in/out, dan kebutuhan dana."
          icon={DollarSign}
          tone="indigo"
          onClick={() => onNavigate?.("fund-management")}
        />
        <ActionCard
          title="Recruitment"
          description="Ajukan kebutuhan staff finansial ke HR."
          icon={Users}
          tone="blue"
          onClick={() => onNavigate?.("recruitment")}
        />
        <ActionCard
          title="Settlements"
          description="Monitor exposure merchant dan driver yang belum lunas."
          icon={Wallet}
          tone="amber"
          onClick={() => onNavigate?.("settlements")}
        />
      </div>

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
          value={formatCurrency(orderAnalysis.totalRevenue)}
          icon={TrendingUp}
          tone="emerald"
          subtitle={`${orderAnalysis.completed} completed orders`}
        />
        <CompactMetric
          title="Settlement Exposure"
          value={formatCurrency(settlementSummary.totalUnpaid)}
          icon={Wallet}
          tone="amber"
          subtitle={`Paid ${formatCurrency(settlementSummary.totalPaid)} | Total ${formatCurrency(settlementSummary.totalCommission)}`}
        />
        <CompactMetric
          title="Net Income"
          value={formatCurrency(metrics.netCashflow)}
          icon={isProfitable ? TrendingUp : TrendingDown}
          tone={isProfitable ? "emerald" : "rose"}
          subtitle={isProfitable ? "Profitable" : "Loss"}
        />
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Order Analytics
            </div>
            <h3 className="mt-2 text-xl font-black text-slate-900">Merchant & Driver Averages</h3>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
            {orderAnalysis.completed} completed
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <Receipt size={14} />
              Avg Food Purchase
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {formatCurrency(orderAnalysis.avgFoodSubtotal)}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Rata-rata nilai makanan dari sisi merchant.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <Truck size={14} />
              Avg Delivery Fee
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {formatCurrency(orderAnalysis.avgDeliveryFee)}
            </div>
            <div className="mt-2 text-xs text-slate-500">Rata-rata ongkir per order selesai.</div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <Truck size={14} />
              Avg Delivery Distance
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {formatNumber(orderAnalysis.avgDistanceKm)} km
            </div>
            <div className="mt-2 text-xs text-slate-500">Rata-rata jarak pengantaran driver.</div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              <Package size={14} />
              Completion Rate
            </div>
            <div className="mt-3 text-2xl font-black text-slate-900">
              {formatNumber(orderAnalysis.completionRate)}%
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Persentase order selesai dari total order.
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
              Settlement Trend
            </div>
            <h3 className="mt-2 text-xl font-black text-slate-900">
              Revenue vs Paid vs Unpaid
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Grafik settlement 14 hari terakhir untuk semua, merchant, dan driver.
            </p>
          </div>

          <div className="flex rounded-2xl bg-slate-100 p-1.5">
            {([
              ["ALL", "Semua"],
              ["RESTAURANT", "Restaurant"],
              ["DRIVER", "Driver"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSettlementChartMode(value)}
                className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] transition ${
                  settlementChartMode === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <SettlementTrendLineChart
            data={settlementTrend}
            mode={settlementChartMode}
          />
        </div>
      </section>

      {metrics.financeAlerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertTriangle size={18} />
            Financial Alerts ({metrics.financeAlerts.length})
          </div>
          <div className="space-y-1">
            {metrics.financeAlerts.slice(0, 4).map((alert: string, index: number) => (
              <div key={index} className="text-sm text-amber-700">
                • {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{formatNumber(orderAnalysis.total)}</div>
          <div className="text-xs text-slate-500">Total Orders</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{formatNumber(metrics.verifiedRestaurants)}</div>
          <div className="text-xs text-slate-500">Verified Merchants</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{formatNumber(metrics.verifiedDrivers)}</div>
          <div className="text-xs text-slate-500">Verified Drivers</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(orderAnalysis.completed > 0 ? orderAnalysis.totalRevenue / orderAnalysis.completed : 0)}
          </div>
          <div className="text-xs text-slate-500">Avg Completed Order</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <PieChart size={20} className="mt-0.5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-700">Dashboard CFO sekarang memakai dua sumber</p>
            <p className="text-xs text-slate-500 mt-1">
              Ringkasan cashflow, balances, exposure, dan alerts dibaca dari summary terbaru.
              Analisis order, rata-rata harga makanan, ongkir, dan jarak pengantaran dibaca
              dari order live terbaru agar keputusan finansial lebih akurat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
