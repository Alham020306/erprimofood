import { useCFOProfitCalculator } from "../hooks/useCFOProfitCalculator";
import { formatCurrency } from "../utils/formatters";
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Package,
  Building,
  Truck,
  Users,
  HandCoins,
  Banknote,
  ShoppingCart,
  Receipt,
  Calculator
} from "lucide-react";

interface Props {
  user: any;
  date?: string;
}

const sourceIcons: Record<string, React.ReactNode> = {
  "KOMISI ORDER": <Package size={16} />,
  "BIAYA RESTAURANT": <Building size={16} />,
  "BIAYA DRIVER": <Truck size={16} />,
  "DANA INVESTOR": <HandCoins size={16} />,
  "PINJAMAN": <Banknote size={16} />,
  "PENJUALAN ASET": <ShoppingCart size={16} />,
  "PENDAPATAN LAYANAN": <Receipt size={16} />,
  "PENDAPATAN LAIN": <Calculator size={16} />,
  "ADJUSTMENT MANUAL": <Calculator size={16} />,
  "PEMBAYARAN DRIVER": <Truck size={16} />,
  "SETTLEMENT RESTAURANT": <Building size={16} />,
  "GAJI KARYAWAN": <Users size={16} />,
  "BIAYA OPERASIONAL": <Receipt size={16} />,
  "BIAYA MARKETING": <Receipt size={16} />,
  "BIAYA TEKNOLOGI": <Receipt size={16} />,
  "BIAYA KANTOR": <Building size={16} />,
  "PEMBAYARAN PAJAK": <Banknote size={16} />,
  "PEMBAYARAN PINJAMAN": <Banknote size={16} />,
  "DIVIDEN INVESTOR": <HandCoins size={16} />,
  "PEMBELIAN PERALATAN": <ShoppingCart size={16} />,
  "PENGELUARAN LAIN": <Calculator size={16} />,
};

export default function CFOProfitBreakdown({ user, date }: Props) {
  const calc = useCFOProfitCalculator(date);
  const restaurantRateLabel = `${Math.round(calc.commissionRates.RESTAURANT * 100)}%`;
  const driverRateLabel = `${Math.round(calc.commissionRates.DRIVER * 100)}%`;

  if (calc.loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 mx-auto rounded bg-slate-200"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 rounded-xl bg-slate-100"></div>
            <div className="h-24 rounded-xl bg-slate-100"></div>
            <div className="h-24 rounded-xl bg-slate-100"></div>
          </div>
        </div>
      </div>
    );
  }

  const cashInEntries = Object.entries(calc.cashIn.bySource)
    .filter(([_, amount]) => amount > 0)
    .sort(([,a], [,b]) => b - a);

  const cashOutEntries = Object.entries(calc.cashOut.bySource)
    .filter(([_, amount]) => amount > 0)
    .sort(([,a], [,b]) => b - a);

  return (
    <div className="space-y-6">
      {/* Commission Rates Info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Calculator size={20} className="mt-0.5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Konfigurasi Komisi
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Restaurant: {calc.commissionRates.RESTAURANT * 100}% | 
              Driver: {calc.commissionRates.DRIVER * 100}% | 
              Platform Fee: {calc.commissionRates.PLATFORM_FEE * 100}%
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ArrowDownRight size={16} />
            TOTAL CASH IN
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-800">
            {formatCurrency(calc.cashIn.total)}
          </div>
          <div className="mt-1 text-xs text-emerald-600">
            {cashInEntries.length} sumber pendapatan
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-700">
            <ArrowUpRight size={16} />
            TOTAL CASH OUT
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-800">
            {formatCurrency(calc.cashOut.total)}
          </div>
          <div className="mt-1 text-xs text-rose-600">
            {cashOutEntries.length} jenis pengeluaran
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${calc.profit.net >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}>
          <div className={`flex items-center gap-2 text-sm font-medium ${calc.profit.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            <Wallet size={16} />
            KEUNTUNGAN BERSIH
          </div>
          <div className={`mt-2 text-2xl font-bold ${calc.profit.net >= 0 ? "text-emerald-800" : "text-rose-800"}`}>
            {formatCurrency(calc.profit.net)}
          </div>
          <div className={`mt-1 text-xs ${calc.profit.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            Margin: {calc.profit.margin.toFixed(1)}% | {calc.orderCount} orders
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Cash In Breakdown */}
        <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden">
          <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <TrendingUp size={16} />
              SUMBER PENDAPATAN (CASH IN)
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-auto">
            {cashInEntries.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Tidak ada data pendapatan</p>
            ) : (
              cashInEntries.map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      {sourceIcons[source] || <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{source}</p>
                      <p className="text-xs text-slate-400">
                        {source === "KOMISI ORDER" && "Dari fee platform per order"}
                        {source === "BIAYA RESTAURANT" && `Komisi ${restaurantRateLabel} dari restaurant`}
                        {source === "BIAYA DRIVER" && `Komisi ${driverRateLabel} dari driver`}
                        {source === "DANA INVESTOR" && "Investasi masuk"}
                        {source === "PINJAMAN" && "Dana pinjaman"}
                        {source === "PENJUALAN ASET" && "Penjualan aset perusahaan"}
                        {source === "PENDAPATAN LAYANAN" && "Pendapatan dari layanan"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="bg-emerald-50 px-4 py-3 border-t border-emerald-200">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-emerald-800">TOTAL CASH IN</span>
              <span className="font-bold text-emerald-800">{formatCurrency(calc.cashIn.total)}</span>
            </div>
          </div>
        </div>

        {/* Cash Out Breakdown */}
        <div className="rounded-2xl border border-rose-200 bg-white overflow-hidden">
          <div className="bg-rose-50 px-4 py-3 border-b border-rose-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
              <TrendingDown size={16} />
              JENIS PENGELUARAN (CASH OUT)
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-auto">
            {cashOutEntries.length === 0 ? (
              <p className="text-center text-slate-400 py-8">Tidak ada data pengeluaran</p>
            ) : (
              cashOutEntries.map(([source, amount]) => (
                <div key={source} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 hover:bg-rose-50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                      {sourceIcons[source] || <ArrowUpRight size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{source}</p>
                      <p className="text-xs text-slate-400">
                        {source === "PEMBAYARAN DRIVER" && "Pembayaran ke driver"}
                        {source === "SETTLEMENT RESTAURANT" && "Pembayaran ke restaurant"}
                        {source === "GAJI KARYAWAN" && "Gaji staff & karyawan"}
                        {source === "BIAYA OPERASIONAL" && "Biaya operasional harian"}
                        {source === "BIAYA MARKETING" && "Iklan & promosi"}
                        {source === "BIAYA TEKNOLOGI" && "Infrastruktur & tools"}
                        {source === "BIAYA KANTOR" && "Sewa & utilities kantor"}
                        {source === "PEMBAYARAN PAJAK" && "Pajak & retribusi"}
                        {source === "PEMBAYARAN PINJAMAN" && "Cicilan pinjaman"}
                        {source === "DIVIDEN INVESTOR" && "Pembagian dividen"}
                        {source === "PEMBELIAN PERALATAN" && "Asset & equipment"}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-rose-700">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="bg-rose-50 px-4 py-3 border-t border-rose-200">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-rose-800">TOTAL CASH OUT</span>
              <span className="font-bold text-rose-800">{formatCurrency(calc.cashOut.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Package size={14} />
          <span>Data dari: {calc.orderCount} orders | {calc.operationalCount} operational entries | {calc.manualCount} manual entries</span>
          <span className="ml-auto">Tanggal: {calc.today}</span>
        </div>
      </div>
    </div>
  );
}
