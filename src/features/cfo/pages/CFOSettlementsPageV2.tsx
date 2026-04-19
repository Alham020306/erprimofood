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
      {/* Header */}
      <section className="rounded-[28px] border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <PieChart size={24} className="text-indigo-600" />
              Settlement Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola komisi dan pembayaran ke restaurant & driver
            </p>
          </div>
          <button
            onClick={exportToJSON}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
          >
            <Download size={16} /> Export JSON
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <SettlementSummaryCardsV2 summary={summary} />

      {/* Entity Type Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: "RESTAURANT", label: "Restaurant", icon: Building, count: restaurantSummaries.length },
          { key: "DRIVER", label: "Driver", icon: Truck, count: driverSummaries.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setEntityType(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium ${
              entityType === tab.key
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-600 hover:text-slate-900"
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
