import { formatCurrency } from "../utils/formatters";
import { CheckCircle, AlertTriangle, Ban, Eye, CheckSquare } from "lucide-react";

type EntitySummary = {
  entityId: string;
  entityName: string;
  grossEarnings: number;
  totalUnpaid: number;
  totalPaid: number;
  unpaidCount: number;
  paidCount: number;
  oldestUnpaidDate?: number;
  isBanned: boolean;
  orders: any[];
};

type Props = {
  data: EntitySummary[];
  entityType: "RESTAURANT" | "DRIVER";
  onSelect?: (item: EntitySummary) => void;
  onMarkPaid?: (entityId: string) => void;
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SettlementsTableV2({ data, entityType, onSelect, onMarkPaid }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500">Belum ada data {entityType === "RESTAURANT" ? "restoran" : "driver"}.</p>
      </div>
    );
  }

  const entityLabel = entityType === "RESTAURANT" ? "RESTORAN" : "DRIVER";
  const entityIcon = entityType === "RESTAURANT" ? "🏪" : "🚗";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {entityIcon} Komisi {entityLabel}
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th className="text-left py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {entityLabel}
              </th>
              <th className="text-right py-3 px-4 text-xs font-bold text-sky-500 uppercase tracking-wider">
                Penghasilan Kotor
              </th>
              <th className="text-right py-3 px-4 text-xs font-bold text-rose-500 uppercase tracking-wider">
                Belum Dibayar
              </th>
              <th className="text-right py-3 px-4 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                Terbayar
              </th>
              <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-center py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((summary) => (
              <tr
                key={summary.entityId}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-900">{summary.entityName}</p>
                  {summary.oldestUnpaidDate && summary.totalUnpaid > 0 && (
                    <p className="text-xs text-rose-500 mt-1">
                      Tertua: {formatDate(summary.oldestUnpaidDate)}
                    </p>
                  )}
                  {summary.unpaidCount > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {summary.unpaidCount} transaksi belum bayar
                    </p>
                  )}
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-bold text-sky-600">
                    {formatCurrency(summary.grossEarnings)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Nilai bruto partner
                  </p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p
                    className={`font-bold ${
                      summary.totalUnpaid > 0 ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    {formatCurrency(summary.totalUnpaid)}
                  </p>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-bold text-emerald-600">
                    {formatCurrency(summary.totalPaid)}
                  </p>
                  {summary.paidCount > 0 && (
                    <p className="text-xs text-slate-400 mt-0.5">{summary.paidCount} transaksi</p>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  {summary.isBanned ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                      <Ban size={12} /> BANNED
                    </span>
                  ) : summary.totalUnpaid > 0 ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                      <AlertTriangle size={12} /> BELUM BAYAR
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                      <CheckCircle size={12} /> LUNAS
                    </span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2 justify-center">
                    {summary.totalUnpaid > 0 && !summary.isBanned && (
                      <button
                        onClick={() => onMarkPaid?.(summary.entityId)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                      >
                        <CheckSquare size={14} /> Bayar
                      </button>
                    )}
                    <button
                      onClick={() => onSelect?.(summary)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      <Eye size={14} /> Detail
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
