import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  Store,
  AlertTriangle,
  Receipt,
  DollarSign,
  PieChart as PieChartIcon,
  FileText,
  Printer,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useCFODailyFinancial } from "../hooks/useCFODailyFinancial";
import { formatCurrency, formatNumber } from "../utils/formatters";

// Metric Card
const MetricCard = ({
  title,
  value,
  icon: Icon,
  tone,
  subtitle,
  trend,
}: {
  title: string;
  value: string;
  icon: any;
  tone: "emerald" | "blue" | "amber" | "rose" | "slate";
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
}) => {
  const toneMap = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone]}`}>
      <div className="flex items-start justify-between">
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
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
            {trend.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

// Chart Card
const ChartCard = ({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
    <div className="h-64">{children}</div>
  </div>
);

// Income Statement Section
const IncomeStatement = ({ data }: { data: any }) => {
  if (!data) return null;

  const rows = [
    { label: "Operating Revenue", value: data.operatingRevenue?.total || 0, bold: true },
    { label: "  Order Revenue", value: data.operatingRevenue?.orderRevenue || 0, indent: true },
    { label: "  Commission Income", value: data.operatingRevenue?.commissionIncome || 0, indent: true },
    { label: "  Other Income", value: data.operatingRevenue?.otherIncome || 0, indent: true },
    { label: "Cost of Revenue", value: -(data.costOfRevenue?.total || 0), bold: true, negative: true },
    { label: "  Driver Incentives", value: -(data.costOfRevenue?.driverIncentives || 0), indent: true, negative: true },
    { label: "  Restaurant Promotions", value: -(data.costOfRevenue?.restaurantPromotions || 0), indent: true, negative: true },
    { label: "  Payment Gateway", value: -(data.costOfRevenue?.paymentGatewayFees || 0), indent: true, negative: true },
    { label: "Gross Profit", value: data.grossProfit || 0, bold: true, highlight: true },
    { label: "Operating Expenses", value: -(data.operatingExpenses?.total || 0), bold: true, negative: true },
    { label: "  Marketing", value: -(data.operatingExpenses?.marketing || 0), indent: true, negative: true },
    { label: "  Salaries", value: -(data.operatingExpenses?.salaries || 0), indent: true, negative: true },
    { label: "  Technology", value: -(data.operatingExpenses?.technology || 0), indent: true, negative: true },
    { label: "  Office", value: -(data.operatingExpenses?.office || 0), indent: true, negative: true },
    { label: "Operating Income", value: data.operatingIncome || 0, bold: true, highlight: true },
    { label: "Tax (20%)", value: -(data.tax || 0), negative: true },
    { label: "Net Income", value: data.netIncome || 0, bold: true, highlight: true, success: data.netIncome > 0 },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Income Statement</h3>
          <p className="text-xs text-slate-500">Laporan laba rugi harian</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200">
          <Printer size={14} />
          Print
        </button>
      </div>
      
      <div className="space-y-1">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between py-2 ${
              row.bold ? "border-t border-slate-100 font-semibold" : ""
            } ${row.highlight ? "bg-slate-50 -mx-2 px-2 rounded-lg" : ""}`}
          >
            <span className={`text-sm ${row.indent ? "pl-4 text-slate-600" : "text-slate-800"}`}>
              {row.label}
            </span>
            <span className={`text-sm font-medium ${
              row.negative ? "text-rose-600" : row.success ? "text-emerald-600" : "text-slate-900"
            }`}>
              {row.negative ? "-" : ""}{formatCurrency(Math.abs(row.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Partner Balances
const PartnerBalances = ({ data }: { data: any }) => {
  if (!data) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">Partner & Driver Balances</h3>
        <p className="text-xs text-slate-500">Total balance dan exposure</p>
      </div>

      <div className="space-y-4">
        {/* Restaurant Balance */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Store size={16} className="text-emerald-500" />
            Restaurant Balance
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(data.totalRestaurantBalance || 0)}
          </div>
          <div className="mt-1 text-xs text-rose-600">
            Unpaid Commission: {formatCurrency(data.totalUnpaidCommission || 0)}
          </div>
        </div>

        {/* Driver Balance */}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Users size={16} className="text-blue-500" />
            Driver Balance
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {formatCurrency(data.totalDriverBalance || 0)}
          </div>
        </div>

        {/* At Risk */}
        {(data.atRiskBalance || 0) > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
              <AlertTriangle size={16} />
              At Risk Balance
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-700">
              {formatCurrency(data.atRiskBalance || 0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CFOFinancialDashboardPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const { loading, summary, chartData } = useCFODailyFinancial(selectedDate);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <p className="text-slate-500">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} />
          <span className="font-semibold">Financial data not available for {selectedDate}</span>
        </div>
        <p className="mt-1 text-sm">Daily summary belum di-generate. Hubungi CTO untuk refresh data.</p>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="mt-4 rounded-xl border border-amber-300 px-3 py-2"
        />
      </div>
    );
  }

  const isProfitable = summary.netIncome > 0;
  const profitMargin = summary.operatingRevenue?.total > 0 
    ? (summary.netIncome / summary.operatingRevenue.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              Daily Financial Report
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Financial Dashboard
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Data tersinkronisasi harian - Hemat reads dengan summary architecture
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
            />
            <button className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
      </section>

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          title="Gross Revenue"
          value={formatCurrency(summary.grossRevenue)}
          icon={Receipt}
          tone="slate"
          subtitle={`${formatNumber(summary.metrics?.orderCount || 0)} orders`}
        />
        <MetricCard
          title="Net Revenue"
          value={formatCurrency(summary.netRevenue)}
          icon={TrendingUp}
          tone="emerald"
          subtitle="After cancellations"
        />
        <MetricCard
          title="Gross Profit"
          value={formatCurrency(summary.grossProfit)}
          icon={PieChartIcon}
          tone="blue"
          subtitle={`Margin: ${summary.grossRevenue > 0 ? ((summary.grossProfit / summary.grossRevenue) * 100).toFixed(1) : 0}%`}
        />
        <MetricCard
          title="Net Income"
          value={formatCurrency(summary.netIncome)}
          icon={isProfitable ? TrendingUp : TrendingDown}
          tone={isProfitable ? "emerald" : "rose"}
          subtitle={`Margin: ${profitMargin.toFixed(1)}%`}
        />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Revenue Trend */}
        <ChartCard
          title="Revenue Trend (7 Days)"
          subtitle="Gross Revenue vs Net Revenue vs Net Income"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rp${(v/1000000).toFixed(0)}M`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="grossRevenue" name="Gross Revenue" stroke="#94a3b8" fill="#e2e8f0" fillOpacity={0.3} />
              <Area type="monotone" dataKey="netRevenue" name="Net Revenue" stroke="#10b981" fill="#d1fae5" fillOpacity={0.5} />
              <Line type="monotone" dataKey="netIncome" name="Net Income" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expense Breakdown */}
        <ChartCard
          title="Operating Expenses Breakdown"
          subtitle={`Total: ${formatCurrency(summary.operatingExpenses?.total || 0)}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Marketing", value: summary.operatingExpenses?.marketing || 0, fill: "#f59e0b" },
                { name: "Salaries", value: summary.operatingExpenses?.salaries || 0, fill: "#6366f1" },
                { name: "Technology", value: summary.operatingExpenses?.technology || 0, fill: "#0ea5e9" },
                { name: "Office", value: summary.operatingExpenses?.office || 0, fill: "#8b5cf6" },
                { name: "Other", value: summary.operatingExpenses?.other || 0, fill: "#94a3b8" },
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `Rp${(v/1000000).toFixed(0)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "none" }}
                formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
              />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Income Statement & Partner Balances */}
      <div className="grid gap-6 xl:grid-cols-2">
        <IncomeStatement data={summary} />
        <PartnerBalances data={summary.partnerBalances} />
      </div>

      {/* Alerts */}
      {summary.alerts && summary.alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertTriangle size={18} />
            Financial Alerts ({summary.alerts.length})
          </div>
          <div className="space-y-2">
            {summary.alerts.map((alert: string, index: number) => (
              <div key={index} className="text-sm text-amber-700">
                • {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(summary.metrics?.completedOrders || 0)}
          </div>
          <div className="text-xs text-slate-500">Completed Orders</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(summary.metrics?.activeMerchants || 0)}
          </div>
          <div className="text-xs text-slate-500">Active Merchants</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatNumber(summary.metrics?.activeDrivers || 0)}
          </div>
          <div className="text-xs text-slate-500">Active Drivers</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(summary.metrics?.averageOrderValue || 0)}
          </div>
          <div className="text-xs text-slate-500">Avg Order Value</div>
        </div>
      </div>
    </div>
  );
}
