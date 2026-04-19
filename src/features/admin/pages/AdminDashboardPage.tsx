import { useEffect, useMemo, useRef } from "react";
import {
  Activity,
  ArrowUpRight,
  Headset,
  MapPinned,
  Receipt,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ReviewsMonitorPanel from "../../coo/components/ReviewsMonitorPanel";
import { useAdminDashboard, type TimeFilter } from "../hooks/useAdminDashboard";
import { loadGoogleMaps } from "../../shared/utils/googleMapsLoader";
import {
  getMerchantOperationalMessage,
  isMerchantOperational,
} from "../../shared/utils/merchantOperationalStatus";

const HeroMetricCard = ({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  icon: any;
  tone: "emerald" | "indigo" | "sky" | "amber";
}) => {
  const toneMap = {
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-400/20",
    sky: "bg-sky-500/15 text-sky-300 border-sky-400/20",
    amber: "bg-amber-500/15 text-amber-200 border-amber-400/20",
  };

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
            {title}
          </div>
          <div className="mt-3 text-3xl font-black text-white">{value}</div>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneMap[tone]}`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

const OpsCard = ({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/40">
    <div className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
      {eyebrow}
    </div>
    <h3 className="mt-2 text-xl font-black text-slate-900">{title}</h3>
    <div className="mt-5">{children}</div>
  </section>
);

const AdminLiveMap = ({
  restaurants,
  drivers,
}: {
  restaurants: any[];
  drivers: any[];
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const google = await loadGoogleMaps();
      if (!google || !mapRef.current || cancelled) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 2.3825, lng: 97.955 },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1120" }] },
          ],
        });
      }

      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const bounds = new google.maps.LatLngBounds();

      restaurants
        .filter((item) => item?.coords?.lat && item?.coords?.lng)
        .slice(0, 20)
        .forEach((restaurant) => {
          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: restaurant.coords,
            title: restaurant.name || "Restaurant",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: isMerchantOperational(restaurant) ? "#10b981" : "#f59e0b",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          const info = new google.maps.InfoWindow({
            content: `
              <div style="min-width:220px;padding:10px 4px 4px 4px;font-family:Inter,Arial,sans-serif;">
                <div style="font-weight:800;font-size:14px;color:#0f172a;">${restaurant.name || "Restaurant"}</div>
                <div style="font-size:11px;color:#64748b;margin-top:4px;">${restaurant.address || "-"}</div>
                <div style="margin-top:10px;font-size:11px;font-weight:700;color:#334155;">${getMerchantOperationalMessage(
                  restaurant
                )}</div>
              </div>
            `,
          });

          marker.addListener("click", () => info.open({ anchor: marker, map: mapInstanceRef.current }));
          markersRef.current.push(marker);
          bounds.extend(marker.getPosition() as any);
        });

      drivers
        .filter((item) => item?.location?.lat && item?.location?.lng)
        .slice(0, 40)
        .forEach((driver) => {
          const marker = new google.maps.Marker({
            map: mapInstanceRef.current,
            position: driver.location,
            title: driver.name || "Driver",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: "#6366f1",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          markersRef.current.push(marker);
          bounds.extend(marker.getPosition() as any);
        });

      if (!bounds.isEmpty()) {
        mapInstanceRef.current.fitBounds(bounds, 72);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [drivers, restaurants]);

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-slate-950 p-1 shadow-2xl">
      <div ref={mapRef} className="h-[520px] w-full rounded-[2rem]" />
      <div className="absolute right-6 top-6 rounded-[1.5rem] border border-white/10 bg-slate-900/85 p-4 text-white backdrop-blur-md">
        <div className="space-y-3 text-[10px] font-black uppercase tracking-[0.24em]">
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            Restaurant
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-indigo-500" />
            Driver Live
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboardPage() {
  const {
    loading,
    metrics,
    platformMetrics,
    users,
    restaurants,
    activeUsers,
    updatedUsers,
    latestOrders,
    allOrders,
    filteredOrders,
    timeFilter,
    setTimeFilter,
    frictionOrders,
    restaurantReviews,
    driverReviews,
    supportStatus,
  } = useAdminDashboard();

  const activeDrivers = useMemo(
    () => users.filter((item: any) => String(item?.role || "").toUpperCase() === "DRIVER"),
    [users]
  );

  const orderStats = useMemo(() => {
    const stats = {
      pending: 0,
      cooking: 0,
      ready: 0,
      onDelivery: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      byDay: new Map<string, { label: string; orders: number; revenue: number }>(),
    };

    const timeFilteredOrders = filteredOrders;

    timeFilteredOrders.forEach((order: any) => {
      const status = String(order?.status || "").toUpperCase();
      const total = Number(order?.total || order?.totalPrice || 0);

      // Count by status
      if (status === "PENDING") stats.pending += 1;
      else if (status === "COOKING") stats.cooking += 1;
      else if (status === "READY") stats.ready += 1;
      else if (status === "ON_DELIVERY") stats.onDelivery += 1;
      else if (status === "COMPLETED") stats.completed += 1;
      else if (status === "CANCELLED" || status === "REJECTED") stats.cancelled += 1;

      // Revenue from completed orders only
      if (status === "COMPLETED") {
        stats.totalRevenue += total;
      }

      // Group by day/hour based on filter
      const stamp = Number(order?.timestamp || order?.createdAt || 0);
      if (stamp) {
        const date = new Date(stamp);
        let key: string;
        let sortKey: number;

        if (timeFilter === "week") {
          // Group by day for week - use day of week for sorting
          const dayIndex = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
          // Reorder so Monday=0, Tuesday=1, ..., Sunday=6
          const weekDayOrder = [1, 2, 3, 4, 5, 6, 0].indexOf(dayIndex);
          const dayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
          key = dayLabels[weekDayOrder];
          sortKey = weekDayOrder;
        } else if (timeFilter === "month") {
          // Group by day of month
          const dayOfMonth = date.getDate();
          key = `${dayOfMonth}`;
          sortKey = dayOfMonth;
        } else {
          // Group by month for year
          const monthIndex = date.getMonth(); // 0=Jan, 1=Feb, ..., 11=Dec
          const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
          key = monthLabels[monthIndex];
          sortKey = monthIndex;
        }

        const current = stats.byDay.get(key) || { label: key, orders: 0, revenue: 0, sortKey };
        current.orders += 1;
        current.revenue += total;
        stats.byDay.set(key, current);
      }
    });

    return {
      ...stats,
      active: stats.pending + stats.cooking + stats.ready + stats.onDelivery,
      byDayArray: Array.from(stats.byDay.values()).sort((a: any, b: any) => {
        // Sort by the numeric sortKey we stored
        return (a.sortKey || 0) - (b.sortKey || 0);
      }),
    };
  }, [filteredOrders, timeFilter]);

  const orderTrend = useMemo(() => {
    if (orderStats.byDayArray.length > 0) {
      return orderStats.byDayArray;
    }

    // Default empty data based on time filter - in correct time order
    if (timeFilter === "week") {
      // Monday to Sunday order
      return [
        { label: "Sen", orders: 0, revenue: 0 },
        { label: "Sel", orders: 0, revenue: 0 },
        { label: "Rab", orders: 0, revenue: 0 },
        { label: "Kam", orders: 0, revenue: 0 },
        { label: "Jum", orders: 0, revenue: 0 },
        { label: "Sab", orders: 0, revenue: 0 },
        { label: "Min", orders: 0, revenue: 0 },
      ];
    } else if (timeFilter === "month") {
      // Days 1-31 (will show only relevant days when data exists)
      return Array.from({ length: 31 }, (_, i) => ({
        label: `${i + 1}`,
        orders: 0,
        revenue: 0,
      }));
    } else {
      // Year: January to December
      return [
        { label: "Jan", orders: 0, revenue: 0 },
        { label: "Feb", orders: 0, revenue: 0 },
        { label: "Mar", orders: 0, revenue: 0 },
        { label: "Apr", orders: 0, revenue: 0 },
        { label: "Mei", orders: 0, revenue: 0 },
        { label: "Jun", orders: 0, revenue: 0 },
        { label: "Jul", orders: 0, revenue: 0 },
        { label: "Agu", orders: 0, revenue: 0 },
        { label: "Sep", orders: 0, revenue: 0 },
        { label: "Okt", orders: 0, revenue: 0 },
        { label: "Nov", orders: 0, revenue: 0 },
        { label: "Des", orders: 0, revenue: 0 },
      ];
    }
  }, [orderStats, timeFilter]);

  const statusData = useMemo(() => {
    const entries = [
      { label: "Pending", value: orderStats.pending, color: "#f59e0b" },
      { label: "Cooking", value: orderStats.cooking, color: "#06b6d4" },
      { label: "Ready", value: orderStats.ready, color: "#6366f1" },
      { label: "On Delivery", value: orderStats.onDelivery, color: "#8b5cf6" },
      { label: "Completed", value: orderStats.completed, color: "#10b981" },
      { label: "Cancelled", value: orderStats.cancelled, color: "#ef4444" },
    ];

    return entries.filter((item) => item.value > 0);
  }, [orderStats]);

  const spotlightRestaurants = useMemo(
    () =>
      restaurants
        .filter((item: any) => item?.name)
        .sort((a: any, b: any) => Number(b?.balance || 0) - Number(a?.balance || 0))
        .slice(0, 4),
    [restaurants]
  );

  if (loading || !metrics) {
    return <div>Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <section className="relative overflow-hidden rounded-[2.8rem] border border-slate-800 bg-slate-900 px-8 py-10 shadow-2xl">
        <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute -bottom-20 -left-12 h-72 w-72 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
              Admin Command Center
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white xl:text-5xl">
              Overview Platform
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Monitoring real-time aktivitas merchant, driver, user, dan order Rimo
              Food dari sudut pandang operator seperti super admin lama, tapi tetap
              mengikuti arsitektur ERP sekarang.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <HeroMetricCard
              title="Open Merchants"
              value={`${platformMetrics.openMerchants} / ${platformMetrics.totalMerchants}`}
              icon={Store}
              tone="emerald"
            />
            <HeroMetricCard
              title="Active Orders"
              value={orderStats.active}
              icon={Activity}
              tone="indigo"
            />
            <HeroMetricCard
              title="Active Users"
              value={platformMetrics.activeUsers}
              icon={Users}
              tone="sky"
            />
            <HeroMetricCard
              title="Support Signal"
              value={supportStatus.isOnline ? "ONLINE" : "OFFLINE"}
              icon={Headset}
              tone="amber"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <OpsCard eyebrow="Platform Metrics" title="Analytics Dashboard">
          <div className="mb-4 flex flex-wrap gap-2">
            {([
              { key: "week", label: "Minggu Ini (Sen-Min)" },
              { key: "month", label: "Bulan Ini" },
              { key: "year", label: "Tahun Ini" },
            ] as { key: TimeFilter; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTimeFilter(key)}
                className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
                  timeFilter === key
                    ? "bg-slate-900 text-white shadow-lg"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Revenue (Completed)
              </div>
              <div className="mt-3 flex items-center gap-3">
                <TrendingUp className="text-emerald-500" size={18} />
                <span className="text-2xl font-black text-slate-900">
                  Rp {orderStats.totalRevenue.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Dari {orderStats.completed} order completed
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Active Orders
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Receipt className="text-indigo-500" size={18} />
                <span className="text-2xl font-black text-slate-900">
                  {orderStats.active}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {orderStats.pending} pending, {orderStats.ready} ready, {orderStats.onDelivery} delivery
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Total Orders
              </div>
              <div className="mt-3 flex items-center gap-3">
                <Activity className="text-sky-500" size={18} />
                <span className="text-2xl font-black text-slate-900">
                  {filteredOrders.length}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {orderStats.cancelled} cancelled, {allOrders.length - filteredOrders.length} di luar periode
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-black text-slate-900">Order Flow</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderTrend}>
                    <defs>
                      <linearGradient id="adminOrdersGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke="#6366f1"
                      fill="url(#adminOrdersGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-black text-slate-900">Order Status Mix</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                      {statusData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </OpsCard>

        <OpsCard eyebrow="Support Desk" title="Operational Signals">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-black text-slate-900">
                  {supportStatus.isOnline ? "Support Online" : "Support Offline"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {supportStatus.reason || "Belum ada catatan operasional support."}
                </div>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${
                  supportStatus.isOnline
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {supportStatus.isOnline ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {frictionOrders.slice(0, 4).map((order: any) => (
              <div
                key={order.id}
                className="rounded-[1.5rem] border border-slate-200 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {order.customerName || order.customerId || "-"}
                    </div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {order.restaurantName || order.restaurantId || "-"}
                    </div>
                  </div>
                  <div className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-rose-700">
                    {order.status || "-"}
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {order.cancellationReason || "Tidak ada alasan pembatalan."}
                </div>
              </div>
            ))}
          </div>
        </OpsCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
                Live Map Monitoring
              </div>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                Restaurant dan driver aktif
              </h3>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Live Connected
            </div>
          </div>
          <AdminLiveMap restaurants={restaurants} drivers={activeDrivers} />
        </div>

        <div className="space-y-6">
          <OpsCard eyebrow="User Adoption" title="Recently Updated Users">
            <div className="space-y-3">
              {updatedUsers.slice(0, 6).map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between rounded-[1.5rem] border border-slate-200 px-4 py-4"
                >
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {item.name || item.email || item.id}
                    </div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                      {item.role || "-"}
                    </div>
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-500">
                    {Math.max(
                      Number(item?.lastUpdateCheck || 0),
                      Number(item?.updatedAt || 0),
                      Number(item?.activatedAt || 0),
                      Number(item?.createdAt || 0)
                    )
                      ? new Date(
                          Math.max(
                            Number(item?.lastUpdateCheck || 0),
                            Number(item?.updatedAt || 0),
                            Number(item?.activatedAt || 0),
                            Number(item?.createdAt || 0)
                          )
                        ).toLocaleString("id-ID")
                      : "-"}
                  </div>
                </div>
              ))}
            </div>
          </OpsCard>

          <OpsCard eyebrow="Merchant Watch" title="Partner Spotlight">
            <div className="space-y-3">
              {spotlightRestaurants.map((restaurant: any) => (
                <div
                  key={restaurant.id}
                  className="rounded-[1.5rem] border border-slate-200 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {restaurant.name || "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {restaurant.address || "-"}
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
                      {getMerchantOperationalMessage(restaurant)}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Balance Rp {Number(restaurant.balance || 0).toLocaleString("id-ID")}</span>
                    <span className="inline-flex items-center gap-1 font-black text-slate-700">
                      <ArrowUpRight size={12} />
                      {restaurant.rating || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </OpsCard>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <OpsCard eyebrow="Recent Transactions" title="Recent Orders">
          <div className="space-y-3">
            {latestOrders.slice(0, 6).map((order: any) => (
              <div
                key={order.id}
                className="flex items-start justify-between rounded-[1.5rem] border border-slate-200 px-4 py-4"
              >
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {order.customerName || order.customerId || "-"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {order.restaurantName || order.restaurantId || "-"}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <MapPinned size={12} />
                    {order.driverName || "Driver belum ada"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">
                    {order.status || "-"}
                  </div>
                  <div className="mt-3 text-sm font-black text-slate-900">
                    Rp {Number(order.total || 0).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </OpsCard>

        <ReviewsMonitorPanel
          restaurantReviews={restaurantReviews}
          driverReviews={driverReviews}
        />
      </div>
    </div>
  );
}
