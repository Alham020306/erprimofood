import { useEffect, useMemo, useState } from "react";
import {
  provisionMerchantAccount,
  subscribeMerchantAccounts,
  updateMerchantStatus,
} from "../services/entityManagementService";
import { collection, onSnapshot } from "firebase/firestore";
import { dbMain } from "../../../core/firebase/firebaseMain";
import {
  getMerchantOperationalMessage,
  isMerchantOperational,
} from "../../shared/utils/merchantOperationalStatus";

type Props = {
  user: any;
};

type MerchantForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  rating: string;
  lat: string;
  lng: string;
  gmapLink: string;
};

type DetailTab = "overview" | "account" | "orders" | "reviews";

const defaultForm = (): MerchantForm => ({
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  rating: "4.5",
  lat: "2.3802",
  lng: "97.9892",
  gmapLink: "",
});

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const loadGoogleMaps = (() => {
  let promise: Promise<any> | null = null;

  return () => {
    if (typeof window === "undefined") return Promise.resolve(null);
    if ((window as any).google?.maps) return Promise.resolve((window as any).google);
    if (promise) return promise;
    if (!GOOGLE_MAPS_API_KEY) return Promise.resolve(null);

    promise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-google-maps-loader="true"]'
      );

      if (existing) {
        existing.addEventListener("load", () => resolve((window as any).google));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = "true";
      script.onload = () => resolve((window as any).google);
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return promise;
  };
})();

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

const formatDate = (value: any) => {
  const number = Number(value || 0);
  return number ? new Date(number).toLocaleString("id-ID") : "-";
};

const safeNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

function MerchantLocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (point: { lat: string; lng: string }) => void;
}) {
  const containerId = "merchant-create-google-map";

  useEffect(() => {
    let cancelled = false;
    let marker: any;
    let listener: any;
    let dragListener: any;

    loadGoogleMaps()
      .then((google) => {
        if (!google || cancelled) return;

        const element = document.getElementById(containerId);
        if (!element) return;

        const position = {
          lat: safeNumber(lat, 2.3802),
          lng: safeNumber(lng, 97.9892),
        };

        const map = new google.maps.Map(element, {
          center: position,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        marker = new google.maps.Marker({
          position,
          map,
          draggable: true,
          title: "Lokasi merchant",
        });

        listener = map.addListener("click", (event: any) => {
          const point = {
            lat: Number(event.latLng.lat()).toFixed(6),
            lng: Number(event.latLng.lng()).toFixed(6),
          };
          marker.setPosition({
            lat: Number(point.lat),
            lng: Number(point.lng),
          });
          onChange(point);
        });

        dragListener = marker.addListener("dragend", (event: any) => {
          onChange({
            lat: Number(event.latLng.lat()).toFixed(6),
            lng: Number(event.latLng.lng()).toFixed(6),
          });
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
      if (listener) listener.remove();
      if (dragListener) dragListener.remove();
    };
  }, [containerId, lat, lng, onChange]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        Lokasi Merchant
      </div>
      <div className="h-72 w-full">
        {GOOGLE_MAPS_API_KEY ? (
          <div id={containerId} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
            Google Maps API key belum tersedia di ERP.
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-4 py-4 text-xs text-slate-500">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="font-bold uppercase tracking-[0.18em] text-slate-400">Latitude</div>
          <div className="mt-2 font-semibold text-slate-900">{lat}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <div className="font-bold uppercase tracking-[0.18em] text-slate-400">Longitude</div>
          <div className="mt-2 font-semibold text-slate-900">{lng}</div>
        </div>
      </div>
    </div>
  );
}

function MerchantStaticGoogleMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const containerId = `merchant-detail-google-map-${label}`;

  useEffect(() => {
    let cancelled = false;
    let marker: any;

    loadGoogleMaps()
      .then((google) => {
        if (!google || cancelled) return;
        const element = document.getElementById(containerId);
        if (!element) return;

        const center = { lat, lng };
        const map = new google.maps.Map(element, {
          center,
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        marker = new google.maps.Marker({
          position: center,
          map,
          title: label,
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
      if (marker) marker.setMap(null);
    };
  }, [containerId, label, lat, lng]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-72 items-center justify-center bg-slate-50 text-sm text-slate-500">
        Google Maps API key belum tersedia di ERP.
      </div>
    );
  }

  return <div id={containerId} className="h-72 w-full" />;
}

export default function MerchantManagementPage({ user }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "BANNED">(
    "ALL"
  );
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<null | {
    email: string;
    password: string;
    verificationToken: string;
  }>(null);
  const [form, setForm] = useState<MerchantForm>(defaultForm);

  useEffect(() => {
    const unsub = subscribeMerchantAccounts((rows) => {
      setItems(rows);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(dbMain, "orders"), (snap) => {
      setOrders(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubReviews = onSnapshot(collection(dbMain, "reviews"), (snap) => {
      setReviews(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubOrders();
      unsubReviews();
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
        item.ownerName,
        item.ownerId,
        item.email,
        item.address,
        item.phone,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase());

      const status = item.isBanned
        ? "BANNED"
        : isMerchantOperational(item)
        ? "OPEN"
        : "CLOSED";

      const matchesStatus = statusFilter === "ALL" ? true : status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const summary = useMemo(
    () => ({
      total: items.length,
      open: items.filter((item) => isMerchantOperational(item)).length,
      banned: items.filter((item) => item.isBanned === true).length,
      closed: items.filter((item) => !item.isBanned && !isMerchantOperational(item)).length,
    }),
    [items]
  );

  const selectedMerchantOrders = useMemo(() => {
    if (!selectedMerchant) return [];
    const merchantId = String(selectedMerchant.id || selectedMerchant.ownerId || "");
    return orders
      .filter((item: any) => String(item.restaurantId || "") === merchantId)
      .sort((a: any, b: any) => safeNumber(b.timestamp) - safeNumber(a.timestamp))
      .slice(0, 10);
  }, [orders, selectedMerchant]);

  const selectedMerchantReviews = useMemo(() => {
    if (!selectedMerchant) return [];
    const merchantId = String(selectedMerchant.id || selectedMerchant.ownerId || "");
    return reviews
      .filter((item: any) => String(item.restaurantId || "") === merchantId)
      .sort((a: any, b: any) => safeNumber(b.createdAt) - safeNumber(a.createdAt))
      .slice(0, 10);
  }, [reviews, selectedMerchant]);

  const selectedMerchantRevenue = useMemo(
    () =>
      selectedMerchantOrders.reduce(
        (sum: number, item: any) => sum + safeNumber(item.total),
        0
      ),
    [selectedMerchantOrders]
  );

  const submit = async () => {
    setSubmitting(true);
    setErrorText("");
    setCreatedCredentials(null);

    try {
      const { gmapLink: _ignoredMapLink, ...merchantForm } = form;
      const created = await provisionMerchantAccount({
        ...merchantForm,
        lat: Number(form.lat || 0),
        lng: Number(form.lng || 0),
        imageFile,
        actorUid: user?.uid || "",
        actorRole: user?.primaryRole || "ADMIN",
      });

      setCreatedCredentials(created);
      setIsAddModalOpen(false);
      setIsCredModalOpen(true);
      setForm(defaultForm());
      setImageFile(null);
    } catch (error: any) {
      setErrorText(error?.message || "Gagal membuat akun merchant.");
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (patch: {
    isOpen?: boolean;
    isBanned?: boolean;
    isVerified?: boolean;
  }) => {
    if (!selectedMerchant?.id) return;

    await updateMerchantStatus({
      merchantId: selectedMerchant.id,
      actorUid: user?.uid || "",
      actorRole: user?.primaryRole || "ADMIN",
      ...patch,
    });
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[40px] bg-slate-950 p-8 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-300">
              Partner Restaurant Management
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              Kontrol mitra resto dengan tampilan konsol super admin
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Kelola merchant, verifikasi akun, status operasional, dan performa bisnis
              dari satu dashboard yang rapi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl font-black text-white">{summary.open}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                Open Now
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-white">{summary.banned}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">
                Banned
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[
          ["Total Merchants", summary.total, "Seluruh mitra terdaftar"],
          ["Open Now", summary.open, "Sedang buka"],
          ["Closed", summary.closed, "Sedang tutup"],
          ["Pending", summary.total - summary.open - summary.banned, "Menunggu verifikasi"],
          ["Banned", summary.banned, "Diblokir"],
        ].map(([title, value, note]) => (
          <div key={String(title)} className="rounded-[28px] bg-white p-6 shadow">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
              {title}
            </p>
            <p className="mt-3 text-3xl font-black text-slate-900">{value as number}</p>
            <p className="mt-2 text-sm text-slate-500">{note as string}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,0.95fr]">
        <section className="rounded-[36px] bg-white p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-xl font-black text-slate-900">Restaurant Directory</h3>
            <p className="mt-2 text-sm text-slate-500">
              Kelola verifikasi, status operasional, dan data merchant.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari resto, PIC, email, alamat..."
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold outline-none focus:border-orange-200 focus:bg-white"
            />

            <div className="flex rounded-2xl bg-slate-100 p-1.5">
              {(["ALL", "OPEN", "BANNED"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black transition-all ${
                    statusFilter === value
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {value === "ALL" ? "Semua" : value === "OPEN" ? "Aktif" : value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition-all hover:scale-[1.02]"
            >
              + New Merchant
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedMerchant(item);
                  setDetailTab("overview");
                }}
                className={`overflow-hidden rounded-[30px] border text-left transition-all ${
                  selectedMerchant?.id === item.id
                    ? "border-slate-950 bg-slate-950 text-white shadow-2xl"
                    : "border-slate-100 bg-white hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"
                }`}
              >
                <div className={`h-1 w-full ${item.isBanned ? "bg-rose-500" : "bg-orange-500"}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name || "Merchant"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="text-xl font-black text-slate-400">
                            {String(item?.name || "R").slice(0, 1).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-base font-black tracking-tight">{item.name || "-"}</div>
                        <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {item.ownerId || item.id || "-"}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        item.isBanned
                          ? selectedMerchant?.id === item.id
                            ? "bg-rose-800 text-rose-200"
                            : "bg-rose-100 text-rose-700"
                          : isMerchantOperational(item)
                          ? selectedMerchant?.id === item.id
                            ? "bg-emerald-800 text-emerald-200"
                            : "bg-emerald-100 text-emerald-700"
                          : selectedMerchant?.id === item.id
                          ? "bg-amber-800 text-amber-200"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {getMerchantOperationalMessage(item)}
                    </div>
                  </div>

                  <div
                    className={`mt-4 rounded-2xl p-4 text-sm ${
                      selectedMerchant?.id === item.id
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div>{item.phone || "-"}</div>
                    <div className="mt-2 line-clamp-2">{item.address || "-"}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                    <span
                      className={`rounded-full px-3 py-1 font-bold ${
                        selectedMerchant?.id === item.id
                          ? "bg-slate-800 text-slate-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      ⭐ {item.rating || 0}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 font-bold ${
                        selectedMerchant?.id === item.id
                          ? "bg-slate-800 text-slate-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.categories?.[0] || "Umum"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {!loading && !filteredItems.length ? (
            <div className="pt-8 text-center">
              <div className="text-2xl font-black uppercase tracking-tight text-slate-900">
                No Merchants Found
              </div>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                Tidak ada merchant yang cocok dengan filter ini
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[36px] bg-white p-6 shadow-xl">
          <div className="mt-8 text-center">
            <div className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Create New Merchant
            </div>
            <p className="mt-2 text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
              Gunakan tombol + New Merchant untuk menambahkan restaurant
            </p>
          </div>
        </section>
      </div>

      {selectedMerchant && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-slate-50 shadow-2xl">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-2xl font-black text-slate-900">
                      {selectedMerchant.name || "Merchant"}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                        selectedMerchant.isBanned
                          ? "bg-rose-100 text-rose-700"
                          : isMerchantOperational(selectedMerchant)
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {getMerchantOperationalMessage(selectedMerchant)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                      {selectedMerchant.categories?.[0] || "Restaurant"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {selectedMerchant.ownerId || selectedMerchant.id || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMerchant(null)}
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
                          Merchant Photo
                        </div>
                      </div>

                      <div className="flex h-[280px] items-center justify-center bg-slate-100 p-6">
                        {selectedMerchant.image ? (
                          <img
                            src={selectedMerchant.image}
                            alt={selectedMerchant.name || "Merchant"}
                            className="max-h-full max-w-full rounded-2xl object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white">
                            <div className="text-center">
                              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl font-black text-slate-400">
                                {String(selectedMerchant?.name || "R").slice(0, 1).toUpperCase()}
                              </div>
                              <div className="mt-4 text-sm font-semibold text-slate-500">
                                Belum ada foto merchant
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
                            Revenue
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            Rp {selectedMerchantRevenue.toLocaleString("id-ID")}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Rating
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            ⭐ {selectedMerchant.rating || "4.5"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Orders
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            {selectedMerchantOrders.length}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Reviews
                          </div>
                          <div className="mt-2 text-base font-black text-slate-900">
                            {selectedMerchantReviews.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap gap-2">
                        {(["overview", "account", "orders", "reviews"] as DetailTab[]).map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setDetailTab(tab)}
                            className={`rounded-2xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] transition ${
                              detailTab === tab
                                ? "bg-slate-950 text-white"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {tab === "overview"
                              ? "Overview"
                              : tab === "account"
                              ? "Account"
                              : tab === "orders"
                              ? "Orders"
                              : "Reviews"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {detailTab === "overview" ? (
                      <div className="space-y-6">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-lg font-black text-slate-900">Informasi Merchant</h3>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Nama Merchant
                              </div>
                              <div className="mt-2 text-base font-black text-slate-900">
                                {selectedMerchant.name || "-"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Owner ID
                              </div>
                              <div className="mt-2 text-base font-black text-slate-900">
                                {selectedMerchant.ownerId || "-"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Email
                              </div>
                              <div className="mt-2 break-all text-sm font-semibold text-slate-900">
                                {selectedMerchant.email || "-"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Phone
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedMerchant.phone || "-"}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Address
                            </div>
                            <div className="mt-2 text-sm text-slate-700">
                              {selectedMerchant.address || "-"}
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Categories
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Array.isArray(selectedMerchant.categories) &&
                              selectedMerchant.categories.length > 0 ? (
                                selectedMerchant.categories.map((cat: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                                  >
                                    {cat}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">-</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <div className="mb-4">
                            <h3 className="text-lg font-black text-slate-900">Lokasi Operasional</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Lokasi merchant berdasarkan koordinat tersimpan.
                            </p>
                          </div>

                          <div className="overflow-hidden rounded-[24px] border border-slate-200">
                            <div className="h-72 w-full">
                              <MerchantStaticGoogleMap
                                lat={safeNumber(selectedMerchant.coords?.lat, 2.3802)}
                                lng={safeNumber(selectedMerchant.coords?.lng, 97.9892)}
                                label={String(selectedMerchant.id || "merchant")}
                              />
                            </div>
                          </div>

                          {selectedMerchant.coords ? (
                            <div className="mt-3 text-xs font-medium text-slate-500">
                              {safeNumber(selectedMerchant.coords.lat).toFixed(6)},{" "}
                              {safeNumber(selectedMerchant.coords.lng).toFixed(6)}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    {detailTab === "account" ? (
                      <div className="space-y-6">
                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-lg font-black text-slate-900">Account & Access</h3>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Login Email
                              </div>
                              <div className="mt-2 break-all text-sm font-semibold text-slate-900">
                                {selectedMerchant.email || "-"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Account ID
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedMerchant.ownerId || selectedMerchant.id || "-"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Verification Token
                              </div>
                              <div className="mt-2 text-base font-black text-slate-900">
                                {selectedMerchant.verificationToken || "-"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Activated At
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {formatDate(selectedMerchant.activatedAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                          <h3 className="text-lg font-black text-slate-900">Operation Status</h3>

                          <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Account Status
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedMerchant.isVerified ? "Verified" : "Unverified"}
                              </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Activation Status
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">
                                {selectedMerchant.isTokenVerified ? "Activated" : "Pending"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {detailTab === "orders" ? (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900">Recent Orders</h3>

                        <div className="mt-5 space-y-3">
                          {selectedMerchantOrders.length ? (
                            selectedMerchantOrders.map((order: any) => (
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
                                      #{String(order.id || "-").slice(0, 8)} ·{" "}
                                      {formatDate(order.timestamp)}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <div className="text-sm font-black text-slate-900">
                                      Rp {safeNumber(order.total).toLocaleString("id-ID")}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {order.status || "Unknown"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                              Merchant ini belum punya order.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {detailTab === "reviews" ? (
                      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-black text-slate-900">Customer Reviews</h3>

                        <div className="mt-5 space-y-3">
                          {selectedMerchantReviews.length ? (
                            selectedMerchantReviews.map((review: any) => (
                              <div
                                key={review.id}
                                className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="text-sm font-black text-slate-900">
                                      {review.customerName || review.customerId || "Anonymous"}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      Order #{review.orderId || "-"}
                                    </div>

                                    {review.comment ? (
                                      <div className="mt-3 text-sm text-slate-700">
                                        "{review.comment}"
                                      </div>
                                    ) : null}
                                  </div>

                                  {review.rating ? (
                                    <div className="text-sm font-black text-slate-900">
                                      {safeNumber(review.rating).toFixed(1)}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                              Merchant ini belum punya review.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
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
                        onClick={() => runAction({ isOpen: selectedMerchant.isOpen === false })}
                        className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        {selectedMerchant.isOpen === false
                          ? "Enable Manual Open"
                          : "Disable Manual Open"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          runAction({ isVerified: selectedMerchant.isVerified !== true })
                        }
                        className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        {selectedMerchant.isVerified ? "Set Unverified" : "Verify Merchant"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          runAction({ isBanned: selectedMerchant.isBanned !== true })
                        }
                        className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                      >
                        {selectedMerchant.isBanned ? "Unban Merchant" : "Ban Merchant"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-black text-slate-900">Financial Summary</h3>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Current Balance
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          Rp {safeNumber(selectedMerchant.balance).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Unpaid Commission
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">
                          Rp{" "}
                          {safeNumber(selectedMerchant.totalUnpaidCommission).toLocaleString(
                            "id-ID"
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                          Activated At
                        </div>
                        <div className="mt-2 text-sm text-slate-900">
                          {formatDate(selectedMerchant.activatedAt)}
                        </div>
                      </div>

                      {selectedMerchant.coords ? (
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            GPS Coordinates
                          </div>
                          <div className="mt-2 text-sm font-mono text-slate-900">
                            {safeNumber(selectedMerchant.coords.lat).toFixed(6)},{" "}
                            {safeNumber(selectedMerchant.coords.lng).toFixed(6)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Tambah Restaurant Baru</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Ikuti field dan alur pendaftaran seperti super admin lama.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Tutup
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-3xl bg-orange-50 px-4 py-4">
                <div className="text-sm font-black text-slate-900">Informasi Dasar</div>
                <div className="mt-1 text-xs font-semibold text-slate-500">
                  Password akan di-generate otomatis jika dikosongkan.
                </div>
              </div>

              <input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nama Restaurant"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  placeholder="Email (untuk login)"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
                <input
                  value={form.password}
                  type="text"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Password (opsional)"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <textarea
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                placeholder="Alamat Lengkap"
                className="h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="Nomor Telepon"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
                <input
                  value={form.rating}
                  type="number"
                  step="0.1"
                  max="5.0"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, rating: event.target.value }))
                  }
                  placeholder="Rating Awal"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                />
              </div>

              <div className="rounded-[28px] border border-dashed border-slate-300 p-4">
                <label className="block text-sm font-semibold text-slate-700">
                  Logo / Foto Resto
                </label>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0] || null;
                      if (nextFile && nextFile.size > 350 * 1024) {
                        setErrorText("Ukuran file terlalu besar. Maksimal 350KB.");
                        event.currentTarget.value = "";
                        return;
                      }
                      setErrorText("");
                      setImageFile(nextFile);
                    }}
                    className="block w-full text-sm text-slate-600"
                  />
                </div>
                {imagePreview ? (
                  <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
                    <img
                      src={imagePreview}
                      alt="Preview merchant"
                      className="h-44 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>

              <input
                value={form.gmapLink}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const coords = parseGoogleMapsCoords(nextValue);
                  setForm((prev) => ({
                    ...prev,
                    gmapLink: nextValue,
                    lat: coords?.lat || prev.lat,
                    lng: coords?.lng || prev.lng,
                  }));
                }}
                placeholder="Link Google Maps"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
              />

              <MerchantLocationPicker
                lat={form.lat}
                lng={form.lng}
                onChange={(point) =>
                  setForm((prev) => ({ ...prev, lat: point.lat, lng: point.lng }))
                }
              />

              {errorText ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {errorText}
                </div>
              ) : null}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 disabled:opacity-60"
              >
                {submitting ? "Membuat..." : "Buat Akun & Restaurant"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCredModalOpen && createdCredentials ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <span className="text-3xl font-black">✓</span>
            </div>
            <h3 className="mt-5 text-2xl font-black text-slate-900">Pendaftaran Berhasil</h3>
            <p className="mt-2 text-sm text-slate-500">
              Berikan detail ini kepada pemilik restoran untuk login pertama kali.
            </p>

            <div className="mt-6 space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-left">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Email Login
                </div>
                <div className="mt-2 text-lg font-black text-slate-900">
                  {createdCredentials.email}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Password Sementara
                </div>
                <div className="mt-2 font-mono text-xl font-black tracking-[0.14em] text-orange-600">
                  {createdCredentials.password}
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Token Verifikasi
                </div>
                <div className="mt-2 text-2xl font-black tracking-[0.22em] text-slate-900">
                  {createdCredentials.verificationToken}
                </div>
                <div className="mt-2 text-[11px] font-semibold text-rose-500">
                  Diperlukan saat login pertama
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCredModalOpen(false)}
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Tutup & Selesai
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}