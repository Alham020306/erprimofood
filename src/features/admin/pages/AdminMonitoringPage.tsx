import {
  Activity,
  AlertTriangle,
  Bike,
  CalendarDays,
  MapPin,
  Store,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useAdminLiveBoard } from "../hooks/useAdminLiveBoard";
import { getMerchantOperationalMessage } from "../../shared/utils/merchantOperationalStatus";

const DARK_BG = "bg-[#0f172a]";
const CARD_BG = "bg-[#1e293b]";
const MONO = "font-mono tracking-tight";

const MonitoringStat = ({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: any;
  color: string;
}) => (
  <div className={`${CARD_BG} rounded-3xl border border-white/5 p-4 shadow-xl`}>
    <div className="mb-2 flex items-start justify-between">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <Icon size={16} className={color} />
    </div>
    <div className={`text-3xl font-black text-white ${MONO}`}>{value}</div>
  </div>
);

export default function AdminMonitoringPage() {
  const { loading, board } = useAdminLiveBoard();

  if (loading) {
    return <div>Loading admin monitoring...</div>;
  }

  const liveFeed = [...(board.orders || [])]
    .sort((a: any, b: any) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0))
    .slice(0, 18);

  const issues = Array.isArray(board.issues) ? board.issues.slice(0, 8) : [];
  const restaurants = [...(board.restaurants || [])]
    .sort((a: any, b: any) => Number(b?.totalOrders || 0) - Number(a?.totalOrders || 0))
    .slice(0, 8);
  const drivers = [...(board.drivers || [])]
    .sort((a: any, b: any) => Number(b?.isOnline === true) - Number(a?.isOnline === true))
    .slice(0, 8);

  return (
    <div className={`min-h-[calc(100vh-100px)] ${DARK_BG} -m-6 overflow-hidden p-6`}>
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white">
            Monitoring Dashboard
          </h2>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-black tracking-[0.22em] text-slate-500">
            <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            ADMIN COMMAND CENTER • LIVE NOMINAL STREAM
          </div>
        </div>

        <div className={`${CARD_BG} flex items-center gap-6 rounded-2xl border border-white/10 px-6 py-3 shadow-2xl`}>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Network Load
            </p>
            <p className={`${MONO} text-sm font-black text-white`}>2.4 MS</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
              Uptime
            </p>
            <p className={`${MONO} text-sm font-black text-indigo-400`}>99.9%</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <MonitoringStat label="Orders" value={board.stats.totalOrders} icon={Zap} color="text-indigo-400" />
        <MonitoringStat label="Pending" value={board.stats.pendingOrders} icon={CalendarDays} color="text-amber-400" />
        <MonitoringStat label="Issues" value={issues.length} icon={AlertTriangle} color="text-rose-400" />
        <MonitoringStat label="Drivers" value={board.stats.onlineDrivers} icon={Bike} color="text-orange-400" />
        <MonitoringStat label="Restos" value={board.stats.openMerchants} icon={Store} color="text-emerald-400" />
        <MonitoringStat label="Users" value={board.users?.length || 0} icon={Users} color="text-sky-400" />
      </div>

      <div className="max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <div className="space-y-4 lg:col-span-3">
            <div className={`${CARD_BG} flex h-[calc(100vh-360px)] flex-col overflow-hidden rounded-[2rem] border border-white/5`}>
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20">
                    <Activity size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-white">
                      Command Center Live Feed
                    </h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Real-time stream • order traffic
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  Live Data
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {liveFeed.map((event: any) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                        <Activity size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-xs font-black text-white">
                              {(event.customerName || event.customerId || "-") + " → " + (event.restaurantName || event.restaurantId || "-")}
                            </h4>
                            <p className="mt-1 text-[11px] font-medium text-slate-400">
                              Driver: {event.driverName || "belum assigned"} • Rp{" "}
                              {Number(event.total || 0).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <span className={`rounded bg-white/5 px-2 py-1 text-[10px] text-slate-500 ${MONO}`}>
                            {event.timestamp
                              ? new Date(Number(event.timestamp)).toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="rounded bg-amber-500/20 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-amber-400">
                            {event.status || "-"}
                          </div>
                          <div className="h-px flex-1 bg-white/5" />
                          <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                            {event.paymentMethod || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 pb-10">
            <div className={`${CARD_BG} rounded-3xl border border-white/5 p-5`}>
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Operations Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-slate-400">Resto Online</span>
                  <span className="font-black text-white">{board.stats.openMerchants}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-slate-400">Drivers Active</span>
                  <span className="font-black text-white">{board.stats.onlineDrivers}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase text-slate-400">Queue Ready</span>
                  <span className="font-black text-white">{board.stats.readyOrders}</span>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-[70%] bg-indigo-500" />
                </div>
                <p className="mt-2 text-[9px] font-bold uppercase text-slate-500">
                  Utilization: 70% nominal
                </p>
              </div>
            </div>

            <div className={`${CARD_BG} rounded-3xl border border-white/5 p-5`}>
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Active Issues
              </h3>
              <div className="space-y-3">
                {issues.length ? (
                  issues.map((issue: any, index: number) => (
                    <div key={issue.id || index} className="rounded-2xl bg-white/5 p-3">
                      <div className="text-xs font-black text-white">
                        {issue.title || issue.name || "Incident"}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        {issue.description || issue.message || "Perlu ditindaklanjuti."}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-white/5 px-4 py-4 text-xs text-slate-500">
                    Belum ada incident aktif di summary saat ini.
                  </div>
                )}
              </div>
            </div>

            <div className={`${CARD_BG} rounded-3xl border border-white/5 p-5`}>
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Merchant Watch
              </h3>
              <div className="space-y-3">
                {restaurants.slice(0, 5).map((resto: any) => (
                  <div key={resto.id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-black text-white">
                          {resto.name || resto.id}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {resto.address || "-"}
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-black text-slate-400">
                        {getMerchantOperationalMessage(resto)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${CARD_BG} rounded-3xl border border-white/5 p-5`}>
              <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Driver Watch
              </h3>
              <div className="space-y-3">
                {drivers.slice(0, 5).map((driver: any) => (
                  <div key={driver.id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-black text-white">
                          {driver.name || driver.id}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {[driver.vehicleBrand, driver.plateNumber].filter(Boolean).join(" • ") || "-"}
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-black uppercase text-slate-400">
                        {driver.isOnline ? "ONLINE" : "OFFLINE"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className={`${CARD_BG} rounded-[2rem] border border-white/5 p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <TrendingUp size={18} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-white">
                  Traffic Summary
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Operational throughput
                </p>
              </div>
            </div>
            <div className="h-44 flex items-end gap-2 px-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg bg-indigo-500/20"
                  style={{ height: `${((i % 7) + 3) * 10}%` }}
                />
              ))}
            </div>
          </div>

          <div className={`${CARD_BG} rounded-[2rem] border border-white/5 p-6`}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-white">
                  Service Integrity
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Infrastructure nominal
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                "Core API",
                "Firestore DC",
                "Auth Node",
                "Media Storage",
              ].map((service) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">{service}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-emerald-400">
                      Operational
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
