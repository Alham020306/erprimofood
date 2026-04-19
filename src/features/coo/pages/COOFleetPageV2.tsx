import { useState } from "react";
import { useCOOUnifiedDashboard } from "../hooks/useCOOUnifiedDashboard";
import { 
  Truck, 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Package,
  Calendar,
  Wallet,
  Activity,
  Clock
} from "lucide-react";
import { formatNumber, formatCurrency, formatDate } from "../utils/formatters";

interface Props {
  user?: any;
}

const StatusBadge = ({ isOnline, isBanned, hasOrder }: { isOnline?: boolean; isBanned?: boolean; hasOrder?: boolean }) => {
  if (isBanned) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
        <XCircle size={12} /> Banned
      </span>
    );
  }
  if (hasOrder) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
        <Package size={12} /> Mengantar
      </span>
    );
  }
  if (isOnline) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
        <CheckCircle size={12} /> Online
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
      <Clock size={12} /> Offline
      </span>
    );
};

export default function COOFleetPageV2({ user }: Props) {
  const { loading, metrics, raw } = useCOOUnifiedDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "OFFLINE" | "BUSY" | "BANNED">("ALL");
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-100"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const drivers = raw?.users?.filter((u: any) => 
    String(u.role || "").toUpperCase() === "DRIVER"
  ) || [];

  const filteredDrivers = drivers.filter((d: any) => {
    const matchesSearch = String(d.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         String(d.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         String(d.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "BANNED") return matchesSearch && d.isBanned;
    if (statusFilter === "ONLINE") return matchesSearch && d.isOnline && !d.currentOrderId && !d.isBanned;
    if (statusFilter === "OFFLINE") return matchesSearch && !d.isOnline && !d.isBanned;
    if (statusFilter === "BUSY") return matchesSearch && d.currentOrderId && !d.isBanned;
    return matchesSearch;
  });

  const summary = {
    total: drivers.length,
    online: drivers.filter((d: any) => d.isOnline && !d.isBanned).length,
    offline: drivers.filter((d: any) => !d.isOnline && !d.isBanned).length,
    busy: drivers.filter((d: any) => d.currentOrderId && !d.isBanned).length,
    banned: drivers.filter((d: any) => d.isBanned).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Truck size={24} className="text-sky-600" />
              Fleet Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitoring armada driver real-time
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">{user?.name || "COO"}</p>
            <p className="text-xs text-slate-500">Read-only Access</p>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total Driver</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.total)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Online</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.online)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Sedang Mengantar</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.busy)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Package size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Offline</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.offline)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Clock size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["ALL", "ONLINE", "BUSY", "OFFLINE", "BANNED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  statusFilter === status
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status === "ALL" && "Semua"}
                {status === "ONLINE" && "Online"}
                {status === "BUSY" && "Mengantar"}
                {status === "OFFLINE" && "Offline"}
                {status === "BANNED" && "Banned"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDrivers.map((driver: any) => (
          <div
            key={driver.id}
            onClick={() => setSelectedDriver(driver)}
            className={`rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedDriver?.id === driver.id
                ? "border-sky-500 bg-sky-50"
                : "border-slate-200 bg-white hover:border-sky-300"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600">
                <Truck size={24} />
              </div>
              <StatusBadge 
                isOnline={driver.isOnline} 
                isBanned={driver.isBanned}
                hasOrder={!!driver.currentOrderId}
              />
            </div>

            <h3 className="font-bold text-slate-900 mb-1">{driver.name || driver.fullName || "Unknown"}</h3>
            <p className="text-sm text-slate-500 mb-3">{driver.vehicleType || "Motorcycle"} • {driver.licensePlate || "-"}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} />
                <span>{driver.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Star size={14} className="text-amber-500" />
                <span>{driver.rating || 0} ({driver.totalReviews || 0} reviews)</span>
              </div>
              {driver.currentLocation && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin size={14} />
                  <span className="truncate">
                    {driver.currentLocation.lat?.toFixed(4)}, {driver.currentLocation.lng?.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-900">{driver.totalDeliveries || 0}</p>
                <p className="text-slate-500">Deliveries</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-900">
                  {formatCurrency(driver.balance || 0)}
                </p>
                <p className="text-slate-500">Balance</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                    <Truck size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedDriver.name || selectedDriver.fullName}</h2>
                    <p className="text-slate-500">{selectedDriver.vehicleType} • {selectedDriver.licensePlate}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge 
                        isOnline={selectedDriver.isOnline} 
                        isBanned={selectedDriver.isBanned}
                        hasOrder={!!selectedDriver.currentOrderId}
                      />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Deliveries</p>
                  <p className="text-xl font-bold text-slate-900">{selectedDriver.totalDeliveries || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Rating</p>
                  <p className="text-xl font-bold text-slate-900">{selectedDriver.rating || 0} ⭐</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Reviews</p>
                  <p className="text-xl font-bold text-slate-900">{selectedDriver.totalReviews || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Balance</p>
                  <p className="text-xl font-bold text-emerald-600">{formatCurrency(selectedDriver.balance || 0)}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Phone size={18} className="text-sky-500" />
                  <span className="text-slate-700">{selectedDriver.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Activity size={18} className="text-sky-500" />
                  <span className="text-slate-700">Status: {selectedDriver.isOnline ? "Online" : "Offline"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Navigation size={18} className="text-sky-500" />
                  <span className="text-slate-700">
                    {selectedDriver.currentOrderId ? `Mengantar: ${selectedDriver.currentOrderId.slice(0, 8)}...` : "Tidak ada order aktif"}
                  </span>
                </div>
                {selectedDriver.currentLocation && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <MapPin size={18} className="text-sky-500" />
                    <span className="text-slate-700 text-xs">
                      {selectedDriver.currentLocation.lat?.toFixed(6)}, {selectedDriver.currentLocation.lng?.toFixed(6)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Wallet size={18} className="text-sky-500" />
                  <span className="text-slate-700">Unpaid: {formatCurrency(selectedDriver.totalUnpaidCommission || 0)}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Calendar size={18} className="text-sky-500" />
                  <span className="text-slate-700">Bergabung: {selectedDriver.createdAt ? formatDate(selectedDriver.createdAt) : "-"}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-sky-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-sky-800">Mode Read-Only</p>
            <p className="text-xs text-sky-600 mt-1">
              COO hanya dapat melihat data driver dan lokasi real-time. Untuk mengubah status driver, hubungi Admin atau CTO.
              Lokasi diperbarui secara real-time saat driver aktif.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
