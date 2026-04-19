import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { subscribeAdminUsers } from "../services/adminMonitoringService";
import {
  getMerchantOperationalMessage,
  isMerchantOperational,
} from "../../shared/utils/merchantOperationalStatus";
import {
  hasGoogleMapsApiKey,
  loadGoogleMaps,
} from "../../shared/utils/googleMapsLoader";
import {
  updateDriverStatus,
  updateMainUserAccountStatus,
  updateMerchantStatus,
} from "../../management/services/entityManagementService";

const MetricCard = ({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint: string;
}) => (
  <div className="rounded-[28px] bg-white p-6 shadow">
    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
      {title}
    </p>
    <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{hint}</p>
  </div>
);

const getUserActivityTime = (item: any) =>
  Math.max(
    Number(item?.lastUpdateCheck || 0),
    Number(item?.updatedAt || 0),
    Number(item?.activatedAt || 0),
    Number(item?.createdAt || 0)
  );

const getPrimaryStatus = (item: any) => {
  const role = String(item?.role || "").toUpperCase();

  if (item?.isBanned === true) return "BANNED";
  if (role === "DRIVER") {
    if (item?.isOnline === true) return "ONLINE";
    if (item?.isVerified === true) return "VERIFIED";
    return "PENDING";
  }

  if (role === "RESTAURANT") {
    return getMerchantOperationalMessage(item).toUpperCase();
  }

  if (item?.isVerified === true) return "VERIFIED";
  return "ACTIVE";
};

const getStatusTone = (item: any) => {
  const status = getPrimaryStatus(item);
  if (status === "BANNED") return "bg-rose-100 text-rose-700";
  if (status === "ONLINE" || status === "BUKA" || status.startsWith("BUKA")) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "VERIFIED") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

export default function AdminUserManagementPage({ user }: { user: any }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    const unsub = subscribeAdminUsers((rows) => {
      setUsers(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((item: any) => {
      const matchesQuery = [
        item?.name,
        item?.email,
        item?.phone,
        item?.location?.address,
        item?.address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesRole =
        filterRole === "ALL"
          ? true
          : String(item?.role || "").toUpperCase() === filterRole;

      return matchesQuery && matchesRole;
    });
  }, [filterRole, searchQuery, users]);

  const analytics = useMemo(() => {
    const sortedUsers = [...users]
      .filter((item: any) => Number(item?.createdAt || 0) > 0)
      .sort((a: any, b: any) => Number(a.createdAt || 0) - Number(b.createdAt || 0));

    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 29);
    const points: { name: string; users: number; created: number }[] = [];

    let cumulative = sortedUsers.filter(
      (item: any) => Number(item?.createdAt || 0) < start.getTime()
    ).length;

    for (let index = 0; index < 30; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      current.setHours(0, 0, 0, 0);

      const next = new Date(current);
      next.setDate(current.getDate() + 1);

      const created = sortedUsers.filter((item: any) => {
        const createdAt = Number(item?.createdAt || 0);
        return createdAt >= current.getTime() && createdAt < next.getTime();
      }).length;

      cumulative += created;
      points.push({
        name: current.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
        users: cumulative,
        created,
      });
    }

    return points;
  }, [users]);

  const summary = useMemo(() => {
    const drivers = users.filter((item: any) => String(item?.role || "").toUpperCase() === "DRIVER");
    const restaurants = users.filter(
      (item: any) => String(item?.role || "").toUpperCase() === "RESTAURANT"
    );
    const customers = users.filter(
      (item: any) => String(item?.role || "").toUpperCase() === "CUSTOMER"
    );
    const updatedAccounts = users.filter((item: any) => getUserActivityTime(item) > 0);

    const onlineDrivers = drivers.filter((item: any) => item?.isOnline === true).length;
    const openMerchants = restaurants.filter((item: any) => isMerchantOperational(item)).length;
    const bannedMerchants = restaurants.filter((item: any) => item?.isBanned === true).length;
    const verifiedDrivers = drivers.filter((item: any) => item?.isVerified === true).length;

    return {
      total: users.length,
      drivers: drivers.length,
      onlineDrivers,
      verifiedDrivers,
      restaurants: restaurants.length,
      openMerchants,
      closedMerchants: restaurants.length - openMerchants - bannedMerchants,
      bannedMerchants,
      customers: customers.length,
      banned: users.filter((item: any) => item?.isBanned === true).length,
      updated: updatedAccounts.length,
    };
  }, [users]);

  const recentUpdatedUsers = useMemo(
    () =>
      [...users]
        .filter((item: any) => getUserActivityTime(item) > 0)
        .sort((a: any, b: any) => getUserActivityTime(b) - getUserActivityTime(a))
        .slice(0, 8),
    [users]
  );

  const runStatusAction = async (patch: {
    isBanned?: boolean;
    isVerified?: boolean;
  }) => {
    if (!selectedUser?.id) return;

    const role = String(selectedUser?.role || "").toUpperCase();

    if (role === "RESTAURANT") {
      await updateMerchantStatus({
        merchantId: selectedUser.id,
        actorUid: user?.uid || "",
        actorRole: user?.primaryRole || "ADMIN",
        ...patch,
      });
    } else if (role === "DRIVER") {
      await updateDriverStatus({
        driverId: selectedUser.id,
        actorUid: user?.uid || "",
        actorRole: user?.primaryRole || "ADMIN",
        ...patch,
      });
    } else {
      await updateMainUserAccountStatus({
        userId: selectedUser.id,
        actorUid: user?.uid || "",
        actorRole: user?.primaryRole || "ADMIN",
        ...patch,
      });
    }
  };

  const formatDateTime = (value: any) =>
    value ? new Date(Number(value)).toLocaleString("id-ID") : "-";

  const formatDateOnly = (value: any) =>
    value ? new Date(Number(value)).toLocaleDateString("id-ID") : "-";

  const safeNumber = (value: any, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const [activeTab, setActiveTab] = useState<"overview" | "account" | "activity">("overview");

  const userMapContainerId = "admin-user-detail-google-map";

  useEffect(() => {
    if (!selectedUser) return;
    const lat = safeNumber(selectedUser.location?.lat ?? selectedUser.lat, 0);
    const lng = safeNumber(selectedUser.location?.lng ?? selectedUser.lng, 0);
    if (!lat && !lng) return;

    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (!google || cancelled) return;
        const element = document.getElementById(userMapContainerId);
        if (!element) return;

        const map = new google.maps.Map(element, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new google.maps.Marker({
          position: { lat, lng },
          map,
          title: selectedUser.name || selectedUser.email || "User",
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  if (loading) return <div>Loading admin users...</div>;

  const role = String(selectedUser?.role || "").toUpperCase();
  const isDriver = role === "DRIVER";
  const isMerchant = role === "RESTAURANT";
  const isCustomer = role === "CUSTOMER";
  const isCLevel = ["COO", "CTO", "CFO", "CMO", "HR", "CEO", "SECRETARY", "ADMIN"].includes(role);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[44px] bg-slate-950 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-300">
              User Management
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Pusat kontrol akun seperti konsol super admin lama
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Fokus halaman ini adalah membaca pertumbuhan user, status utama akun,
              jejak update, dan konteks operasional dengan cepat sebelum operator
              masuk ke tindakan akun.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                {summary.total} total accounts
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                {summary.updated} fresh activity
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                {summary.banned} flagged
              </div>
            </div>
          </div>

          <div className="h-[220px] w-full max-w-[460px] rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">
              User Growth
            </div>
            <div className="mt-2 text-xl font-black text-white">
              30-Day Accumulation
            </div>
            <div className="mt-4 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <defs>
                    <linearGradient id="adminUserGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#60a5fa"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#adminUserGrowth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <MetricCard title="Total Users" value={summary.total} hint="Seluruh akun pada dbMain/users" />
        <MetricCard title="Drivers Online" value={summary.onlineDrivers} hint={`Dari ${summary.drivers} armada terdaftar`} />
        <MetricCard title="Merchants Open" value={summary.openMerchants} hint={`Dari ${summary.restaurants} mitra terdaftar`} />
        <MetricCard title="Customers" value={summary.customers} hint="Pengguna aktif" />
        <MetricCard title="Banned" value={summary.banned} hint="Akun perlu perhatian khusus" />
      </div>

      <section className="rounded-[36px] bg-white p-6 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari nama, email, no telp, alamat"
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none"
          />
          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="DRIVER">DRIVER</option>
            <option value="RESTAURANT">RESTAURANT</option>
            <option value="COO">COO</option>
            <option value="CTO">CTO</option>
            <option value="CFO">CFO</option>
            <option value="CMO">CMO</option>
            <option value="HR">HR</option>
          </select>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredUsers.map((item: any) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedUser(item)}
              className="rounded-[30px] border border-slate-100 bg-slate-50/40 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name || "User"}
                      className="h-14 w-14 rounded-[18px] border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-slate-200 bg-slate-100 text-sm font-black text-slate-600">
                      {String(item?.name || item?.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-base font-black tracking-tight text-slate-900">
                      {item.name || item.email || "-"}
                    </div>
                    <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {item.role || "-"}
                    </div>
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-[10px] font-black shadow-sm ${getStatusTone(item)}`}>
                  {getPrimaryStatus(item)}
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <div>{item.phone || item.email || "-"}</div>
                <div className="line-clamp-2">
                  {item.location?.address || item.address || "Tanpa alamat"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-500">
                  {item.lastSeenVersion || "No version"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-500">
                  {item.isVerified ? "Verified" : "Pending"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-500">
                  {getUserActivityTime(item)
                    ? new Date(getUserActivityTime(item)).toLocaleDateString("id-ID")
                    : "No activity"}
                </span>
              </div>
            </button>
          ))}
        </div>

        {!loading && !filteredUsers.length ? (
          <div className="pt-4 text-sm text-slate-500">Tidak ada user ditemukan.</div>
        ) : null}
      </section>

      <section className="rounded-[36px] bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="text-lg font-black text-slate-900">Recently Updated Users</h3>
          <p className="text-sm text-slate-500">
            Akun yang paling terakhir melakukan activity, update app, atau aktivasi.
          </p>
        </div>

        <div className="space-y-3">
          {recentUpdatedUsers.map((item: any) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedUser(item)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-left transition hover:border-orange-200 hover:shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-slate-900">
                    {item.name || item.email || item.id}
                  </div>
                  <div className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {item.role || "-"}
                  </div>
                </div>
                <div className="text-right text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {new Date(getUserActivityTime(item)).toLocaleString("id-ID")}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-slate-50 shadow-2xl">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-2xl font-black text-slate-900">
                      {selectedUser.name || selectedUser.email || "User"}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(selectedUser)}`}>
                      {getPrimaryStatus(selectedUser)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedUser.role || "-"} · {selectedUser.email || selectedUser.id || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.65fr)_340px]">
              <div className="min-h-0 overflow-y-auto p-6">
                <div className="flex gap-6 border-b border-slate-200 pb-4">
                  {(["overview", "account", "activity"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`text-sm font-black uppercase tracking-[0.14em] transition ${
                        activeTab === tab
                          ? "border-b-2 border-sky-500 text-sky-600"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="mt-6 space-y-6">
                    <div className="grid gap-4 grid-cols-2">
                      <div className="rounded-2xl bg-sky-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-400">Role</div>
                        <div className="mt-2 text-base font-black text-slate-900">{selectedUser.role || "-"}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</div>
                        <div className="mt-2 text-base font-black text-slate-900">
                          {selectedUser.isBanned ? "BANNED" : selectedUser.isVerified ? "VERIFIED" : "PENDING"}
                        </div>
                      </div>
                    </div>

                    {isDriver && (
                      <div className="grid gap-4 grid-cols-3">
                        <div className="rounded-2xl bg-emerald-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Online</div>
                          <div className="mt-2 text-base font-black text-slate-900">{selectedUser.isOnline ? "YES" : "NO"}</div>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Balance</div>
                          <div className="mt-2 text-base font-black text-slate-900">Rp {safeNumber(selectedUser.balance).toLocaleString("id-ID")}</div>
                        </div>
                        <div className="rounded-2xl bg-amber-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Vehicle</div>
                          <div className="mt-2 text-base font-black text-slate-900">{selectedUser.vehicleBrand || "-"}</div>
                        </div>
                      </div>
                    )}

                    {isMerchant && (
                      <div className="grid gap-4 grid-cols-3">
                        <div className="rounded-2xl bg-emerald-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Open</div>
                          <div className="mt-2 text-base font-black text-slate-900">{selectedUser.isOpen ? "YES" : "NO"}</div>
                        </div>
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Balance</div>
                          <div className="mt-2 text-base font-black text-slate-900">Rp {safeNumber(selectedUser.balance).toLocaleString("id-ID")}</div>
                        </div>
                        <div className="rounded-2xl bg-amber-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Operational</div>
                          <div className="mt-2 text-base font-black text-slate-900">{getMerchantOperationalMessage(selectedUser)}</div>
                        </div>
                      </div>
                    )}

                    {isCustomer && (
                      <div className="grid gap-4 grid-cols-2">
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Balance</div>
                          <div className="mt-2 text-base font-black text-slate-900">Rp {safeNumber(selectedUser.balance).toLocaleString("id-ID")}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</div>
                          <div className="mt-2 text-base font-black text-slate-900">{selectedUser.phone || "-"}</div>
                        </div>
                      </div>
                    )}

                    {isCLevel && (
                      <div className="grid gap-4 grid-cols-2">
                        <div className="rounded-2xl bg-blue-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Primary Role</div>
                          <div className="mt-2 text-base font-black text-slate-900">{selectedUser.primaryRole || selectedUser.role || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Token Verified</div>
                          <div className="mt-2 text-base font-black text-slate-900">{selectedUser.isTokenVerified ? "YES" : "NO"}</div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Contact Info</div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Email</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.email || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.phone || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Address</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.location?.address || selectedUser.address || "-"}</div>
                        </div>
                      </div>
                    </div>

                    {(safeNumber(selectedUser.location?.lat ?? selectedUser.lat, 0) !== 0 ||
                      safeNumber(selectedUser.location?.lng ?? selectedUser.lng, 0) !== 0) && (
                      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Location Map</div>
                        </div>
                        <div className="h-[300px] w-full">
                          {hasGoogleMapsApiKey() ? (
                            <div id={userMapContainerId} className="h-full w-full" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                              Google Maps API key belum tersedia.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "account" && (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Account Details</div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Account ID</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 break-all">{selectedUser.id || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Verified</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.isVerified ? "YES" : "NO"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Token Verified</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.isTokenVerified ? "YES" : "NO"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Banned</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.isBanned ? "YES" : "NO"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Verification Token</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900 break-all">{selectedUser.verificationToken || "-"}</div>
                        </div>
                      </div>
                    </div>

                    {isDriver && (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Driver Info</div>
                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Vehicle Brand</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.vehicleBrand || "-"}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Plate Number</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.plateNumber || "-"}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Balance</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">Rp {safeNumber(selectedUser.balance).toLocaleString("id-ID")}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isMerchant && (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Merchant Info</div>
                        <div className="mt-4 space-y-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Operational</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{getMerchantOperationalMessage(selectedUser)}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Open</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.isOpen ? "YES" : "NO"}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Balance</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">Rp {safeNumber(selectedUser.balance).toLocaleString("id-ID")}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="mt-6 space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Activity Timeline</div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Created</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedUser.createdAt)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Activated</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedUser.activatedAt)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Last Update Check</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedUser.lastUpdateCheck)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Last Updated</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateTime(selectedUser.updatedAt)}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">App Version</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.lastSeenVersion || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <aside className="border-l border-slate-200 bg-white p-6">
                <div className="sticky top-0 space-y-5">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-black text-slate-900">Quick Actions</h3>

                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          runStatusAction({ isVerified: selectedUser.isVerified !== true })
                        }
                        className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {selectedUser.isVerified ? "Set Unverified" : "Verify Account"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          runStatusAction({ isBanned: selectedUser.isBanned !== true })
                        }
                        className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        {selectedUser.isBanned ? "Unban Account" : "Ban Account"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-black text-slate-900">Account Summary</h3>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Status</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {getPrimaryStatus(selectedUser)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Account ID</div>
                        <div className="mt-2 text-xs font-semibold text-slate-900 break-all">{selectedUser.id || "-"}</div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Created</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{formatDateOnly(selectedUser.createdAt)}</div>
                      </div>

                      {isDriver && (
                        <>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Plate</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.plateNumber || "-"}</div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Online</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">{selectedUser.isOnline ? "YES" : "NO"}</div>
                          </div>
                        </>
                      )}

                      {isMerchant && (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Operational</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{getMerchantOperationalMessage(selectedUser)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
