import { useEffect, useMemo, useState } from "react";
import {
  provisionDriverAccount,
  subscribeDriverAccounts,
  updateDriverStatus,
} from "../services/entityManagementService";
import { collection, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";

type Props = {
  user: any;
};

const parseGoogleMapsCoords = (value: string) => {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1] && match?.[2]) {
      return {
        lat: match[1],
        lng: match[2],
      };
    }
  }

  return null;
};

const safeNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDateTime = (value: any) => {
  const number = safeNumber(value, 0);
  return number ? new Date(number).toLocaleString("id-ID") : "-";
};

const formatDateOnly = (value: any) => {
  const number = safeNumber(value, 0);
  return number ? new Date(number).toLocaleDateString("id-ID") : "-";
};

export default function DriverManagementPage({ user }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "VERIFIED" | "PENDING" | "ONLINE" | "BANNED"
  >("ALL");
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [driverReviews, setDriverReviews] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<
    {
      email: string;
      password: string;
      verificationToken: string;
    } | null
  >(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    vehicleBrand: "",
    plateNumber: "",
  });

  useEffect(() => {
    const unsub = subscribeDriverAccounts((rows) => {
      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(dbMain, "orders"), (snap) => {
      setOrders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDriverReviews = onSnapshot(collection(dbMain, "driver_reviews"), (snap) => {
      setDriverReviews(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubOrders();
      unsubDriverReviews();
    };
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesQuery = [
        item.name,
        item.email,
        item.phone,
        item.location?.address,
        item.plateNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      const status = item.isBanned
        ? "BANNED"
        : item.isOnline
        ? "ONLINE"
        : item.isVerified
        ? "VERIFIED"
        : "PENDING";

      const matchesStatus = statusFilter === "ALL" ? true : status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: items.length,
      verified: items.filter((item) => item.isVerified === true).length,
      banned: items.filter((item) => item.isBanned === true).length,
      online: items.filter((item) => item.isOnline === true).length,
    };
  }, [items]);

  const selectedDriverOrders = useMemo(() => {
    if (!selectedDriver) return [];
    const driverId = String(selectedDriver.id || "");
    return orders
      .filter((item: any) => String(item.driverId || "") === driverId)
      .sort((a: any, b: any) => safeNumber(b.timestamp) - safeNumber(a.timestamp))
      .slice(0, 8);
  }, [orders, selectedDriver]);

  const selectedDriverReviewRows = useMemo(() => {
    if (!selectedDriver) return [];
    const driverId = String(selectedDriver.id || "");
    return driverReviews
      .filter((item: any) => String(item.driverId || "") === driverId)
      .sort((a: any, b: any) => safeNumber(b.createdAt) - safeNumber(a.createdAt))
      .slice(0, 6);
  }, [driverReviews, selectedDriver]);

  const selectedDriverEarnings = useMemo(
    () =>
      selectedDriverOrders.reduce(
        (sum: number, item: any) => sum + safeNumber(item.driverEarnings),
        0
      ),
    [selectedDriverOrders]
  );

  const submit = async () => {
    setSubmitting(true);
    setErrorText("");
    setCreatedCredentials(null);

    try {
      const created = await provisionDriverAccount({
        ...form,
        lat: 0,
        lng: 0,
        imageFile,
        actorUid: user?.uid || "",
        actorRole: user?.primaryRole || "COO",
      });

      setCreatedCredentials(created);

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        vehicleBrand: "",
        plateNumber: "",
      });

      setImageFile(null);
    } catch (error: any) {
      setErrorText(error?.message || "Gagal membuat akun driver.");
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (patch: {
    isVerified?: boolean;
    isBanned?: boolean;
  }) => {
    if (!selectedDriver?.id) return;

    await updateDriverStatus({
      driverId: selectedDriver.id,
      actorUid: user?.uid || "",
      actorRole: user?.primaryRole || "COO",
      ...patch,
    });
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[44px] bg-slate-950 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-sky-300">
              Driver Fleet Management
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Kontrol armada driver dengan tampilan konsol super admin
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Halaman ini mengikuti pola super admin: daftar driver yang visual,
              filter status cepat, dan detail operasional lengkap untuk verifikasi.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                {summary.total} total drivers
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                {summary.online} online now
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                {summary.verified} verified
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{summary.online}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                Online Now
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{summary.verified}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-300">
                Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="rounded-[28px] bg-white p-6 shadow">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Total Drivers
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">{summary.total}</p>
          <p className="mt-2 text-sm text-slate-500">Seluruh armada terdaftar</p>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Online Now
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">{summary.online}</p>
          <p className="mt-2 text-sm text-slate-500">Driver aktif saat ini</p>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Verified
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">{summary.verified}</p>
          <p className="mt-2 text-sm text-slate-500">Terverifikasi</p>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Pending
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {summary.total - summary.verified}
          </p>
          <p className="mt-2 text-sm text-slate-500">Menunggu verifikasi</p>
        </div>

        <div className="rounded-[28px] bg-white p-6 shadow">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
            Banned
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">{summary.banned}</p>
          <p className="mt-2 text-sm text-slate-500">Diblokir</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[36px] bg-white p-6 shadow-xl xl:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Driver Fleet Directory</h3>
              <p className="mt-2 text-sm text-slate-500">
                Kelola verifikasi, status operasional, dan data driver
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-sky-200 transition-all hover:scale-[1.02]"
            >
              + New Driver
            </button>
          </div>

          <div className="mb-6 flex flex-col gap-3 md:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari driver, email, nomor polisi, alamat"
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
            />

            <div className="flex rounded-2xl bg-slate-100 p-1.5">
              {(["ALL", "VERIFIED", "PENDING", "ONLINE", "BANNED"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black transition-all ${
                    statusFilter === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedDriver(item)}
                className={`overflow-hidden rounded-[32px] border p-6 text-left transition-all ${
                  selectedDriver?.id === item.id
                    ? "border-slate-950 bg-slate-950 text-white shadow-2xl"
                    : "border-slate-100 bg-white hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                      {item.avatar ? (
                        <img
                          src={item.avatar}
                          alt={item.name || "Driver"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-black text-slate-400">
                          {String(item?.name || "D").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-base font-black tracking-tight">{item.name || "-"}</div>
                      <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {item.plateNumber || item.id || "-"}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-[10px] font-black ${
                      item.isBanned
                        ? selectedDriver?.id === item.id
                          ? "bg-rose-800 text-rose-200"
                          : "bg-rose-100 text-rose-700"
                        : item.isOnline
                        ? selectedDriver?.id === item.id
                          ? "bg-emerald-800 text-emerald-200"
                          : "bg-emerald-100 text-emerald-700"
                        : item.isVerified
                        ? selectedDriver?.id === item.id
                          ? "bg-blue-800 text-blue-200"
                          : "bg-blue-100 text-blue-700"
                        : selectedDriver?.id === item.id
                        ? "bg-amber-800 text-amber-200"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.isBanned
                      ? "BANNED"
                      : item.isOnline
                      ? "ONLINE"
                      : item.isVerified
                      ? "VERIFIED"
                      : "PENDING"}
                  </div>
                </div>

                <div
                  className={`mt-4 grid gap-2 text-sm ${
                    selectedDriver?.id === item.id ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  <div>{item.phone || "-"}</div>
                  <div className="line-clamp-2">{item.location?.address || "-"}</div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                  <span
                    className={`rounded-full px-3 py-1 font-bold ${
                      selectedDriver?.id === item.id
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.vehicleBrand || "-"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 font-bold ${
                      selectedDriver?.id === item.id
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.lastSeenVersion || "No version"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 font-bold ${
                      selectedDriver?.id === item.id
                        ? "bg-slate-800 text-slate-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.isTokenVerified ? "Token Active" : "Wait Token"}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {!loading && !filteredItems.length ? (
            <div className="pt-4 text-sm text-slate-500">Belum ada driver.</div>
          ) : null}
        </div>

      </div>

      {selectedDriver && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-slate-50 shadow-2xl">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-2xl font-black text-slate-900">
                      {selectedDriver.name || "Driver"}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                        selectedDriver.isBanned
                          ? "bg-rose-100 text-rose-700"
                          : selectedDriver.isOnline
                          ? "bg-emerald-100 text-emerald-700"
                          : selectedDriver.isVerified
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {selectedDriver.isBanned
                        ? "BANNED"
                        : selectedDriver.isOnline
                        ? "ONLINE"
                        : selectedDriver.isVerified
                        ? "VERIFIED"
                        : "PENDING"}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {selectedDriver.vehicleBrand || "Driver"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedDriver.plateNumber || selectedDriver.id || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDriver(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.65fr)_340px]">
              <div className="min-h-0 overflow-y-auto p-6">
                <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                  <div className="space-y-6">
                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-5 py-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Driver Photo
                        </div>
                      </div>

                      <div className="flex h-[280px] items-center justify-center bg-slate-100 p-6">
                        {selectedDriver.avatar ? (
                          <img
                            src={selectedDriver.avatar}
                            alt={selectedDriver.name || "Driver"}
                            className="max-h-full max-w-full rounded-2xl object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white">
                            <div className="text-center">
                              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-400">
                                {String(selectedDriver?.name || "D")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </div>
                              <div className="mt-4 text-sm font-semibold text-slate-500">
                                Belum ada foto driver
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Snapshot
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Earnings
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            Rp {selectedDriverEarnings.toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Balance
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            Rp {safeNumber(selectedDriver.balance).toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Trips
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            {selectedDriverOrders.length}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Reviews
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            {selectedDriverReviewRows.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900">Informasi Driver</h3>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Nama Driver
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            {selectedDriver.name || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Email
                          </div>
                          <div className="mt-2 break-all text-sm font-semibold text-slate-900">
                            {selectedDriver.email || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Phone
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedDriver.phone || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Vehicle
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedDriver.vehicleBrand || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Plate Number
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedDriver.plateNumber || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Operational Area
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedDriver.operationalArea || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Address
                        </div>
                        <div className="mt-2 text-sm text-slate-700">
                          {selectedDriver.location?.address || "-"}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Verification Token
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedDriver.verificationToken || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            App Version
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">
                            {selectedDriver.lastSeenVersion || "-"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900">Recent Trips</h3>

                      <div className="mt-5 space-y-3">
                        {selectedDriverOrders.length ? (
                          selectedDriverOrders.map((order: any) => (
                            <div
                              key={order.id}
                              className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-black text-slate-900">
                                    {order.customerName || order.customerId || "Anonymous"}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    #{String(order.id || "-").slice(0, 8)} • {order.status || "-"}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm font-black text-slate-900">
                                    Rp {safeNumber(order.driverEarnings).toLocaleString("id-ID")}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {formatDateTime(order.completedAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            Driver ini belum punya trip.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900">Recent Reviews</h3>

                      <div className="mt-5 space-y-3">
                        {selectedDriverReviewRows.length ? (
                          selectedDriverReviewRows.map((review: any) => (
                            <div
                              key={review.id}
                              className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-sm font-black text-slate-900">
                                    {review.customerName || review.customerId || "Anonymous"}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    Order {review.orderId || "-"}
                                  </div>
                                </div>

                                <div className="text-sm font-black text-slate-900">
                                  ⭐ {review.rating || "-"}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            Driver ini belum punya review.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="border-l border-slate-200 bg-white p-6">
                <div className="sticky top-0 space-y-5">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-black text-slate-900">Quick Actions</h3>

                    <div className="mt-5 space-y-3">
                      <button
                        type="button"
                        onClick={() =>
                          runAction({ isVerified: selectedDriver.isVerified !== true })
                        }
                        className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {selectedDriver.isVerified ? "Set Pending Verification" : "Verify Driver"}
                      </button>

                      <button
                        type="button"
                        onClick={() => runAction({ isBanned: selectedDriver.isBanned !== true })}
                        className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        {selectedDriver.isBanned ? "Unban Driver" : "Ban Driver"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-black text-slate-900">Account Summary</h3>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Status
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedDriver.isBanned
                            ? "BANNED"
                            : selectedDriver.isOnline
                            ? "ONLINE"
                            : selectedDriver.isVerified
                            ? "VERIFIED"
                            : "PENDING"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Account ID
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          {selectedDriver.id || "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Created
                        </div>
                        <div className="mt-2 text-sm text-slate-900">
                          {formatDateOnly(selectedDriver.createdAt)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Phone Verified
                        </div>
                        <div className="mt-2 text-sm text-slate-900">
                          {selectedDriver.phoneVerified ? "YES" : "NO"}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Token Verified
                        </div>
                        <div className="mt-2 text-sm text-slate-900">
                          {selectedDriver.isTokenVerified ? "YES" : "NO"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Tambah Driver Baru</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Provision akun driver baru lengkap dengan data kendaraan dan lokasi operasional
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nama lengkap"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
                />
                <input
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="Email"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
                />
              </div>

              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Password (opsional, auto jika kosong)"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
              />

              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-700">
                Jika password dikosongkan, sistem akan membuat password sementara otomatis.
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Nomor WhatsApp"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
                />
                <input
                  value={form.vehicleBrand}
                  onChange={(event) => setForm((prev) => ({ ...prev, vehicleBrand: event.target.value }))}
                  placeholder="Merk kendaraan"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
                />
              </div>

              <input
                value={form.plateNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, plateNumber: event.target.value }))}
                placeholder="Nomor plat kendaraan"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-sky-200 focus:bg-white"
              />

              <div className="rounded-2xl border border-dashed border-slate-300 p-6">
                <label className="block text-sm font-semibold text-slate-700">Driver Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="mt-4 block w-full text-sm text-slate-600"
                />
                {imagePreview ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <img
                      src={imagePreview}
                      alt="Preview avatar driver"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Upload foto driver agar akun operasional langsung lebih lengkap.
                  </p>
                )}
              </div>
            </div>

            {createdCredentials ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-sm text-emerald-800">
                <p className="font-semibold text-emerald-900">✓ Akun driver berhasil dibuat</p>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                  <div>
                    <span className="font-semibold">Email:</span> {createdCredentials.email}
                  </div>
                  <div>
                    <span className="font-semibold">Password:</span> {createdCredentials.password}
                  </div>
                  <div>
                    <span className="font-semibold">Token:</span>{" "}
                    {createdCredentials.verificationToken}
                  </div>
                </div>
              </div>
            ) : null}

            {errorText ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-700">
                ⚠ {errorText}
              </div>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-sky-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-sky-200 disabled:opacity-60"
            >
              {submitting ? "Creating Driver..." : "Create New Driver"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}