import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { TrendingUp, ShoppingBag, DollarSign, Users } from "lucide-react";

interface Props {
  chartData: any;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-lg">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString("id-ID")}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function COOAnalyticsCharts({ chartData }: Props) {
  if (!chartData) return null;

  return (
    <div className="space-y-4">
      {/* Revenue Trend */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            Trend Revenue 7 Hari Terakhir
          </h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#64748B"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#64748B"
                tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                name="Revenue" 
                fill="#10B981" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Orders by Hour */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-600" />
              Order per Jam (24h)
            </h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.ordersByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 10 }}
                  stroke="#64748B"
                  interval={2}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#64748B"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  name="Orders" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-600" />
              Distribusi Status Order
            </h3>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {chartData.ordersByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-600 font-medium">Peak Hour</p>
          <p className="text-lg font-bold text-blue-700">
            {chartData.ordersByHour.reduce((max: any, curr: any) => 
              curr.count > max.count ? curr : max, chartData.ordersByHour[0] || { hour: "-" }
            ).hour}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs text-emerald-600 font-medium">Best Day</p>
          <p className="text-lg font-bold text-emerald-700">
            {chartData.revenueByDay.reduce((max: any, curr: any) => 
              curr.revenue > max.revenue ? curr : max, chartData.revenueByDay[0] || { date: "-" }
            ).date}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-600 font-medium">Top Status</p>
          <p className="text-lg font-bold text-amber-700">
            {chartData.ordersByStatus.reduce((max: any, curr: any) => 
              curr.value > max.value ? curr : max, chartData.ordersByStatus[0] || { name: "-" }
            ).name}
          </p>
        </div>
        <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
          <p className="text-xs text-purple-600 font-medium">Total Orders 24h</p>
          <p className="text-lg font-bold text-purple-700">
            {chartData.ordersByHour.reduce((sum: number, curr: any) => sum + curr.count, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
