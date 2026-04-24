import { AlertTriangle, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

interface SettlementSummary {
  totalUnpaid: number;
  totalPaid: number;
  totalCommission: number;
  restaurantUnpaid: number;
  restaurantPaid: number;
  driverUnpaid: number;
  driverPaid: number;
}

type Props = {
  summary: SettlementSummary;
  commissionRates: {
    RESTAURANT: number;
    DRIVER: number;
  };
};

export default function SettlementSummaryCardsV2({ summary, commissionRates }: Props) {
  return (
    <div className="space-y-4">
      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Unpaid */}
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-lg shadow-rose-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Belum Dibayar</p>
              <h3 className="text-2xl font-black mt-1">{formatCurrency(summary.totalUnpaid)}</h3>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div>
              <span className="opacity-70">Restoran:</span>
              <span className="font-bold ml-1">{formatCurrency(summary.restaurantUnpaid)}</span>
            </div>
            <div>
              <span className="opacity-70">Driver:</span>
              <span className="font-bold ml-1">{formatCurrency(summary.driverUnpaid)}</span>
            </div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Terbayar</p>
              <h3 className="text-2xl font-black mt-1">{formatCurrency(summary.totalPaid)}</h3>
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div>
              <span className="opacity-70">Restoran:</span>
              <span className="font-bold ml-1">{formatCurrency(summary.restaurantPaid)}</span>
            </div>
            <div>
              <span className="opacity-70">Driver:</span>
              <span className="font-bold ml-1">{formatCurrency(summary.driverPaid)}</span>
            </div>
          </div>
        </div>

        {/* Total Commission */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 text-white shadow-lg shadow-indigo-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign size={28} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider opacity-80">Total Komisi</p>
              <h3 className="text-2xl font-black mt-1">{formatCurrency(summary.totalCommission)}</h3>
            </div>
          </div>
          <div className="mt-4 text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="opacity-70" />
              <span className="opacity-70">Total pendapatan komisi platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rates Info */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-800">Konfigurasi Komisi</p>
            <p className="text-xs text-indigo-600 mt-1">
              Restoran: <span className="font-bold">{(commissionRates.RESTAURANT * 100).toFixed(0)}%</span> | Driver: <span className="font-bold">{(commissionRates.DRIVER * 100).toFixed(0)}%</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
