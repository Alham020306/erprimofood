import { useState } from "react";
import { useCFOSettlementsV2 } from "../hooks/useCFOSettlementsV2";
import SettlementSummaryCardsV2 from "../components/SettlementSummaryCardsV2";
import SettlementsTableV2 from "../components/SettlementsTableV2";
import SettlementDetailModal from "../components/SettlementDetailModal";
import SettlementConfirmModal from "../components/SettlementConfirmModal";
import { Download, Building, Truck, PieChart, AlertCircle } from "lucide-react";

interface Props {
  user: any;
}

export default function CFOSettlementsPageV2({ user }: Props) {
  const {
    loading,
    processing,
    entityType,
    setEntityType,
    currentList,
    summary,
    restaurantSummaries,
    driverSummaries,
    markAsPaid,
    commissionRates,
  } = useCFOSettlementsV2();

  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [entityToPay, setEntityToPay] = useState<any | null>(null);

  const handleViewDetail = (entity: any) => {
    setSelectedEntity(entity);
    setDetailModalOpen(true);
  };

  const handleMarkPaidClick = (entityId: string) => {
    const entity = currentList.find((e) => e.entityId === entityId);
    if (entity) {
      setEntityToPay(entity);
      setConfirmModalOpen(true);
    }
  };

  const handleConfirmPaid = async () => {
    if (!entityToPay) return;

    const success = await markAsPaid(entityToPay.entityId, entityType);
    if (success) {
      alert("✅ Pembayaran berhasil ditandai lunas!");
    } else {
      alert("❌ Gagal memproses pembayaran. Silakan coba lagi.");
    }
    setConfirmModalOpen(false);
    setEntityToPay(null);
  };

  const exportToJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      exportedBy: user?.name || user?.email || "Unknown",
      summary,
      commissionRates,
      restaurants: restaurantSummaries.map((r) => ({
        id: r.entityId,
        name: r.entityName,
        totalUnpaid: r.totalUnpaid,
        totalPaid: r.totalPaid,
        unpaidCount: r.unpaidCount,
        isBanned: r.isBanned,
      })),
      drivers: driverSummaries.map((d) => ({
        id: d.entityId,
        name: d.entityName,
        totalUnpaid: d.totalUnpaid,
        totalPaid: d.totalPaid,
        unpaidCount: d.unpaidCount,
        isBanned: d.isBanned,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CFO_Settlements_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 rounded-2xl bg-slate-100"></div>
            <div className="h-32 rounded-2xl bg-slate-100"></div>
            <div className="h-32 rounded-2xl bg-slate-100"></div>
          </div>
          <div className="h-96 rounded-2xl bg-slate-100"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_26%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative z-10">
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              Settlement Desk
            </div>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black tracking-tight text-white">
              <PieChart size={24} className="text-emerald-300" />
              Settlement Management
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Kelola komisi dan pembayaran ke restaurant & driver
            </p>
          </div>
          <button
            onClick={exportToJSON}
            className="relative z-10 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
          >
            <Download size={16} /> Export JSON
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <SettlementSummaryCardsV2 summary={summary} commissionRates={commissionRates} />

      {/* Entity Type Tabs */}
      <div className="flex gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { key: "RESTAURANT", label: "Restaurant", icon: Building, count: restaurantSummaries.length },
          { key: "DRIVER", label: "Driver", icon: Truck, count: driverSummaries.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setEntityType(tab.key as any)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              entityType === tab.key
                ? "bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500 text-white shadow-lg"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alert if there are unpaid settlements */}
      {summary.totalUnpaid > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-800">Perhatian</p>
            <p className="text-xs text-amber-700">
              Terdapat {formatCurrency(summary.totalUnpaid)} yang belum dibayar ke {" "}
              {entityType === "RESTAURANT" ? "restoran" : "driver"}.
            </p>
          </div>
        </div>
      )}

      {/* Settlements Table */}
      <SettlementsTableV2
        data={currentList}
        entityType={entityType}
        onSelect={handleViewDetail}
        onMarkPaid={handleMarkPaidClick}
      />

      {/* Detail Modal */}
      <SettlementDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEntity(null);
        }}
        entity={selectedEntity}
        entityType={entityType}
        commissionRates={commissionRates}
      />

      {/* Confirm Modal */}
      <SettlementConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setEntityToPay(null);
        }}
        onConfirm={handleConfirmPaid}
        entityName={entityToPay?.entityName}
        unpaidAmount={entityToPay?.totalUnpaid || 0}
        unpaidCount={entityToPay?.unpaidCount || 0}
        entityType={entityType}
        processing={processing}
      />
    </div>
  );
}

// Helper untuk format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
