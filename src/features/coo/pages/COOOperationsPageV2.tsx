import { useState } from "react";
import { useCOOUnifiedDashboard } from "../hooks/useCOOUnifiedDashboard";
import { 
  Store, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Package,
  Calendar
} from "lucide-react";
import { formatNumber, formatDate } from "../utils/formatters";

interface Props {
  user?: any;
}

const StatusBadge = ({ isOpen, isBanned }: { isOpen?: boolean; isBanned?: boolean }) => {
  if (isBanned) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
        <XCircle size={12} /> Banned
      </span>
    );
  }
  if (isOpen) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
        <CheckCircle size={12} /> Buka
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 flex items-center gap-1">
      <Clock size={12} /> Tutup
    </span>
  );
};

export default function COOOperationsPageV2({ user }: Props) {
  const { loading, metrics, raw } = useCOOUnifiedDashboard();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED" | "BANNED">("ALL");
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

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

  const merchants = raw?.restaurants || [];
  
  const filteredMerchants = merchants.filter((m: any) => {
    const matchesSearch = String(m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         String(m.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "ALL") return matchesSearch;
    if (statusFilter === "BANNED") return matchesSearch && m.isBanned;
    if (statusFilter === "OPEN") return matchesSearch && m.isOpen && !m.isBanned;
    if (statusFilter === "CLOSED") return matchesSearch && !m.isOpen && !m.isBanned;
    return matchesSearch;
  });

  const summary = {
    total: merchants.length,
    open: merchants.filter((m: any) => m.isOpen && !m.isBanned).length,
    closed: merchants.filter((m: any) => !m.isOpen && !m.isBanned).length,
    banned: merchants.filter((m: any) => m.isBanned).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Store size={24} className="text-emerald-600" />
              Merchant Operations
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monitoring dan analisis performa merchant
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
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total Merchant</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.total)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Store size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Sedang Buka</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.open)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Sedang Tutup</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.closed)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Banned</p>
              <h3 className="text-3xl font-black mt-1">{formatNumber(summary.banned)}</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <XCircle size={24} />
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
              placeholder="Cari merchant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "OPEN", "CLOSED", "BANNED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  statusFilter === status
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {status === "ALL" && "Semua"}
                {status === "OPEN" && "Buka"}
                {status === "CLOSED" && "Tutup"}
                {status === "BANNED" && "Banned"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Merchant Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMerchants.map((merchant: any) => (
          <div
            key={merchant.id}
            onClick={() => setSelectedMerchant(merchant)}
            className={`rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedMerchant?.id === merchant.id
                ? "border-emerald-500 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Store size={24} />
              </div>
              <StatusBadge isOpen={merchant.isOpen} isBanned={merchant.isBanned} />
            </div>

            <h3 className="font-bold text-slate-900 mb-1">{merchant.name}</h3>
            <p className="text-sm text-slate-500 mb-3">{merchant.category || "No category"}</p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin size={14} />
                <span className="truncate">{merchant.address || "No address"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} />
                <span>{merchant.phone || "No phone"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Star size={14} className="text-amber-500" />
                <span>{merchant.rating || 0} ({merchant.totalReviews || 0} reviews)</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-900">{merchant.totalOrders || 0}</p>
                <p className="text-slate-500">Orders</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-slate-50">
                <p className="font-bold text-slate-900">
                  {merchant.createdAt ? formatDate(merchant.createdAt) : "-"}
                </p>
                <p className="text-slate-500">Joined</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedMerchant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Store size={32} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedMerchant.name}</h2>
                    <p className="text-slate-500">{selectedMerchant.category}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge isOpen={selectedMerchant.isOpen} isBanned={selectedMerchant.isBanned} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMerchant(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Orders</p>
                  <p className="text-xl font-bold text-slate-900">{selectedMerchant.totalOrders || 0}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Rating</p>
                  <p className="text-xl font-bold text-slate-900">{selectedMerchant.rating || 0} ⭐</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 text-center">
                  <p className="text-xs text-slate-500 mb-1">Reviews</p>
                  <p className="text-xl font-bold text-slate-900">{selectedMerchant.totalReviews || 0}</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <MapPin size={18} className="text-emerald-500" />
                  <span className="text-slate-700">{selectedMerchant.address || "No address"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Phone size={18} className="text-emerald-500" />
                  <span className="text-slate-700">{selectedMerchant.phone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Package size={18} className="text-emerald-500" />
                  <span className="text-slate-700">{selectedMerchant.menuCount || 0} menu items</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <Calendar size={18} className="text-emerald-500" />
                  <span className="text-slate-700">Bergabung: {selectedMerchant.createdAt ? formatDate(selectedMerchant.createdAt) : "-"}</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setSelectedMerchant(null)}
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
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-emerald-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Mode Read-Only</p>
            <p className="text-xs text-emerald-600 mt-1">
              COO hanya dapat melihat data merchant. Untuk mengubah status, hubungi Admin atau CTO.
              Data diperbarui secara real-time dari database utama.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
