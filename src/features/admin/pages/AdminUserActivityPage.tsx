import { useMemo } from "react";
import { Activity, Clock, MapPin, TrendingUp } from "lucide-react";
import { useAdminOrders } from "../hooks/useAdminOrders";

const getActivityTone = (status: string) => {
  const tone = String(status || "").toUpperCase();
  if (tone === "COMPLETED") return "bg-emerald-100 text-emerald-600";
  if (tone === "PENDING") return "bg-amber-100 text-amber-600";
  if (tone === "CANCELLED" || tone === "REJECTED") return "bg-rose-100 text-rose-600";
  return "bg-indigo-100 text-indigo-600";
};

const getBadgeTone = (status: string) => {
  const tone = String(status || "").toUpperCase();
  if (tone === "COMPLETED") return "bg-emerald-500/15 text-emerald-300";
  if (tone === "PENDING") return "bg-amber-500/15 text-amber-300";
  if (tone === "CANCELLED" || tone === "REJECTED") return "bg-rose-500/15 text-rose-300";
  return "bg-indigo-500/15 text-indigo-300";
};

export default function AdminUserActivityPage() {
  const { loading, orders } = useAdminOrders();

  const activities = useMemo(
    () =>
      [...orders]
        .sort((a: any, b: any) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0))
        .slice(0, 50),
    [orders]
  );

  const stats = useMemo(() => {
    return {
      total: activities.length,
      completed: activities.filter(
        (item: any) => String(item?.status || "").toUpperCase() === "COMPLETED"
      ).length,
      pending: activities.filter(
        (item: any) => String(item?.status || "").toUpperCase() === "PENDING"
      ).length,
    };
  }, [activities]);

  if (loading) {
    return <div>Loading user activity...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <section className="rounded-[2.8rem] border border-slate-800 bg-slate-900 px-8 py-8 shadow-2xl">
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              User Activity Log
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
              Activity Stream
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Feed aktivitas order terbaru yang meniru super admin lama: mudah memantau
              siapa order ke siapa, status saat ini, nominal transaksi, dan waktu
              kejadian tanpa membuka detail penuh dulu.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Total
              </div>
              <div className="mt-3 text-3xl font-black text-white">{stats.total}</div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Completed
              </div>
              <div className="mt-3 text-3xl font-black text-white">{stats.completed}</div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Pending
              </div>
              <div className="mt-3 text-3xl font-black text-white">{stats.pending}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Recent User Activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitoring aktivitas pengguna secara real-time dari order yang masuk.
            </p>
          </div>
          <div className="rounded-full bg-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">
            Live
          </div>
        </div>

        <div className="space-y-4">
          {activities.length ? (
            activities.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-[2rem] border border-slate-100 px-5 py-5 transition-all hover:bg-slate-50"
              >
                <div
                  className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getActivityTone(
                    activity.status
                  )}`}
                >
                  <Activity size={18} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {activity.customerName || activity.customerId || "-"} →{" "}
                        {activity.restaurantName || activity.restaurantId || "-"}
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Order #{String(activity.id || "-").slice(0, 10)} • Rp{" "}
                        {Number(activity.total || 0).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getBadgeTone(
                        activity.status
                      )}`}
                    >
                      {activity.status || "-"}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={12} />
                      {activity.timestamp
                        ? new Date(Number(activity.timestamp)).toLocaleString("id-ID")
                        : "-"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={12} />
                      {activity.distanceKm || "-"} km
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <TrendingUp size={12} />
                      {activity.driverName || activity.driverId || "Driver belum ditetapkan"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              Belum ada aktivitas user yang bisa ditampilkan.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
