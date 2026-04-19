import { AlertCircle, X, CheckSquare } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entityName?: string;
  unpaidAmount: number;
  unpaidCount: number;
  entityType: "RESTAURANT" | "DRIVER";
  processing?: boolean;
};

export default function SettlementConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  entityName,
  unpaidAmount,
  unpaidCount,
  entityType,
  processing = false,
}: Props) {
  if (!isOpen) return null;

  const entityLabel = entityType === "RESTAURANT" ? "Restoran" : "Driver";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Konfirmasi Pembayaran</h3>
              <p className="text-sm text-slate-500">
                Tandai komisi {entityLabel.toLowerCase()} sebagai lunas
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm text-slate-500">{entityLabel}</p>
            <p className="text-lg font-bold text-slate-900">{entityName || "Unknown"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-rose-50 p-4 border border-rose-200">
              <p className="text-xs font-bold text-rose-600 uppercase">Jumlah Belum Bayar</p>
              <p className="text-xl font-black text-rose-700 mt-1">{formatCurrency(unpaidAmount)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
              <p className="text-xs font-bold text-amber-600 uppercase">Jumlah Order</p>
              <p className="text-xl font-black text-amber-700 mt-1">{unpaidCount} order</p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Peringatan</p>
                <p className="text-xs text-amber-700 mt-1">
                  Semua komisi yang belum dibayar akan ditandai sebagai lunas. Aksi ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={processing}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckSquare size={18} /> Tandai Lunas
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
