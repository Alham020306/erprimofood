import { X, CheckCircle, AlertCircle, Package } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

type Order = {
  id: string;
  total: number;
  deliveryFee?: number;
  status: string;
  timestamp?: number;
  restoCommissionPaid?: boolean;
  driverCommissionPaid?: boolean;
  restoEarnings?: number;
  driverEarnings?: number;
};

type EntitySummary = {
  entityId: string;
  entityName: string;
  totalUnpaid: number;
  totalPaid: number;
  unpaidCount: number;
  paidCount: number;
  orders: Order[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entity: EntitySummary | null;
  entityType: "RESTAURANT" | "DRIVER";
};

const formatOrderId = (id: string) => {
  if (!id) return "-";
  return id.substring(0, 8).toUpperCase();
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SettlementDetailModal({ isOpen, onClose, entity, entityType }: Props) {
  if (!isOpen || !entity) return null;

  const calculateCommission = (order: Order, type: "RESTAURANT" | "DRIVER"): number => {
    if (type === "RESTAURANT") {
      const itemsTotal = (order.total || 0) - (order.deliveryFee || 0);
      const restoEarnings = order.restoEarnings || itemsTotal * 0.8; // 20% commission
      const commission = itemsTotal - restoEarnings;
      return Math.max(0, commission);
    } else {
      const driverEarnings = order.driverEarnings || (order.deliveryFee || 0) * 0.85; // 15% commission
      const commission = (order.deliveryFee || 0) - driverEarnings;
      return Math.max(0, commission);
    }
  };

  const unpaidOrders = entity.orders.filter((o) => {
    if (entityType === "RESTAURANT") return !o.restoCommissionPaid;
    return !o.driverCommissionPaid;
  });

  const paidOrders = entity.orders.filter((o) => {
    if (entityType === "RESTAURANT") return o.restoCommissionPaid;
    return o.driverCommissionPaid;
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Detail Komisi - {entity.entityName}
              </h3>
              <p className="text-sm text-slate-500">
                {entityType === "RESTAURANT" ? "Restoran" : "Driver"} | {entity.orders.length} order
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-slate-100">
          <div className="rounded-xl bg-rose-50 p-4 border border-rose-200">
            <p className="text-xs font-bold text-rose-600 uppercase">Belum Dibayar</p>
            <p className="text-xl font-black text-rose-700 mt-1">{formatCurrency(entity.totalUnpaid)}</p>
            <p className="text-xs text-rose-500 mt-1">{entity.unpaidCount} order</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
            <p className="text-xs font-bold text-emerald-600 uppercase">Terbayar</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(entity.totalPaid)}</p>
            <p className="text-xs text-emerald-500 mt-1">{entity.paidCount} order</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-200">
            <p className="text-xs font-bold text-indigo-600 uppercase">Total Komisi</p>
            <p className="text-xl font-black text-indigo-700 mt-1">
              {formatCurrency(entity.totalUnpaid + entity.totalPaid)}
            </p>
            <p className="text-xs text-indigo-500 mt-1">{entity.orders.length} order</p>
          </div>
        </div>

        {/* Unpaid Orders */}
        {unpaidOrders.length > 0 && (
          <div className="p-6 border-b border-slate-100">
            <h4 className="text-sm font-bold text-rose-600 uppercase mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> Order Belum Dibayar ({unpaidOrders.length})
            </h4>
            <div className="rounded-xl border border-rose-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-rose-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-bold text-rose-700">Order ID</th>
                    <th className="text-right py-2 px-3 text-xs font-bold text-rose-700">Komisi</th>
                    <th className="text-center py-2 px-3 text-xs font-bold text-rose-700">Status</th>
                    <th className="text-right py-2 px-3 text-xs font-bold text-rose-700">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidOrders.slice(0, 50).map((order) => (
                    <tr key={order.id} className="border-t border-rose-100 hover:bg-rose-50/50">
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">
                        {formatOrderId(order.id)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        {formatCurrency(calculateCommission(order, entityType))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                          <AlertCircle size={10} /> BELUM
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-500">
                        {formatDate(order.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {unpaidOrders.length > 50 && (
                <div className="py-2 px-3 bg-rose-50 text-center text-xs text-rose-600">
                  ... dan {unpaidOrders.length - 50} order lainnya
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paid Orders */}
        {paidOrders.length > 0 && (
          <div className="p-6">
            <h4 className="text-sm font-bold text-emerald-600 uppercase mb-4 flex items-center gap-2">
              <CheckCircle size={16} /> Order Terbayar ({paidOrders.length})
            </h4>
            <div className="rounded-xl border border-emerald-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-bold text-emerald-700">Order ID</th>
                    <th className="text-right py-2 px-3 text-xs font-bold text-emerald-700">Komisi</th>
                    <th className="text-center py-2 px-3 text-xs font-bold text-emerald-700">Status</th>
                    <th className="text-right py-2 px-3 text-xs font-bold text-emerald-700">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {paidOrders.slice(0, 20).map((order) => (
                    <tr key={order.id} className="border-t border-emerald-100 hover:bg-emerald-50/50">
                      <td className="py-3 px-3 font-mono text-xs text-slate-700">
                        {formatOrderId(order.id)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">
                        {formatCurrency(calculateCommission(order, entityType))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <CheckCircle size={10} /> LUNAS
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-xs text-slate-500">
                        {formatDate(order.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paidOrders.length > 20 && (
                <div className="py-2 px-3 bg-emerald-50 text-center text-xs text-emerald-600">
                  ... dan {paidOrders.length - 20} order lainnya
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Total {entity.orders.length} order</span>
            <span>
              Komisi {entityType === "RESTAURANT" ? "20% dari restaurant" : "15% dari driver"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
