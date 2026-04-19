import { 
  Store, 
  Truck, 
  ShoppingBag, 
  TrendingUp, 
  Users, 
  Star, 
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from "lucide-react";
import { formatCurrency } from "../utils/formatters";

interface Props {
  metrics: any;
}

const Card = ({ 
  title, 
  value, 
  icon: Icon, 
  color,
  subtitle,
  trend
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  color: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}) => {
  const colorClasses: Record<string, string> = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    rose: "from-rose-500 to-rose-600",
    purple: "from-purple-500 to-purple-600",
    indigo: "from-indigo-500 to-indigo-600",
    cyan: "from-cyan-500 to-cyan-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorClasses[color]} p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
          <h3 className="text-2xl font-black mt-1">{value}</h3>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {trend === "up" ? (
            <>
              <TrendingUp size={14} className="text-emerald-200" />
              <span className="text-emerald-100">Meningkat</span>
            </>
          ) : trend === "down" ? (
            <>
              <TrendingUp size={14} className="text-rose-200 rotate-180" />
              <span className="text-rose-100">Menurun</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default function COOSummaryCards({ metrics }: Props) {
  if (!metrics) return null;

  return (
    <div className="space-y-4">
      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          title="Total Merchants"
          value={metrics.totalMerchants}
          icon={Store}
          color="blue"
          subtitle={`${metrics.activeMerchants} aktif`}
        />
        <Card
          title="Total Drivers"
          value={metrics.totalDrivers}
          icon={Truck}
          color="emerald"
          subtitle={`${metrics.activeDrivers} online`}
        />
        <Card
          title="Total Orders"
          value={metrics.totalOrders}
          icon={ShoppingBag}
          color="amber"
          subtitle={`${metrics.completedOrders} completed`}
        />
        <Card
          title="Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={TrendingUp}
          color="purple"
          subtitle={`Avg: ${formatCurrency(metrics.avgOrderValue)}`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          title="Active Orders"
          value={metrics.activeOrders}
          icon={Clock}
          color="cyan"
          subtitle="Sedang berlangsung"
        />
        <Card
          title="Cancelled"
          value={metrics.cancelledOrders}
          icon={Ban}
          color="rose"
          subtitle="Dibatalkan"
        />
        <Card
          title="Avg Rating"
          value={`${metrics.avgRating}/5`}
          icon={Star}
          color="orange"
          subtitle={`${metrics.totalReviews} reviews`}
        />
        <Card
          title="New Merchants"
          value={metrics.newMerchantsThisMonth}
          icon={CheckCircle}
          color="indigo"
          subtitle="Bulan ini"
        />
      </div>

      {/* Fleet Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Truck size={16} /> Status Armada Driver
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="text-2xl font-black text-emerald-600">{metrics.activeDrivers}</p>
            <p className="text-xs text-emerald-700 font-medium">Online</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-2xl font-black text-blue-600">{metrics.busyDrivers}</p>
            <p className="text-xs text-blue-700 font-medium">Sibuk</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-2xl font-black text-slate-600">{metrics.offlineDrivers}</p>
            <p className="text-xs text-slate-700 font-medium">Offline</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-rose-50 border border-rose-200">
            <p className="text-2xl font-black text-rose-600">{metrics.bannedDrivers}</p>
            <p className="text-xs text-rose-700 font-medium">Banned</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {metrics.incidents?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertCircle size={16} /> Peringatan Operasional
          </h3>
          <div className="space-y-2">
            {metrics.incidents.map((incident: string, index: number) => (
              <div
                key={index}
                className="rounded-lg bg-amber-100/50 px-3 py-2 text-sm text-amber-800"
              >
                {incident}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
