import { useCFOReports } from "../hooks/useCFOReports";
import CashflowLineChart from "../components/CashflowLineChart";
import CategoryBarChart from "../components/CategoryBarChart";
import ReportsSummaryCards from "../components/ReportsSummaryCards";
import ReportsBreakdownTable from "../components/ReportsBreakdownTable";
import { exportFinancialWorkbook } from "../utils/exportFinancialWorkbook";

export default function CFOReportsPage() {
  const {
    loading,
    categoryBreakdown,
    monthlyStyleSummary,
    reportSummary,
    latestTransactions,
  } = useCFOReports();

  if (loading) return <div>Loading CFO reports...</div>;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_26%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              Financial Intelligence
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white">Automated Financial Reports</h1>
            <p className="mt-2 text-sm text-slate-300">
            CFO dapat menghasilkan laporan keuangan otomatis dan mengunduhnya ke format Excel.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              exportFinancialWorkbook({
                summary: reportSummary,
                monthlyStyleSummary,
                categoryBreakdown,
                latestTransactions,
              })
            }
            className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Download Financial Excel
          </button>
        </div>
      </section>

      <ReportsSummaryCards monthlyStyleSummary={monthlyStyleSummary} />

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Visual Reports
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900">Cashflow & Category Breakdown</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <CashflowLineChart
            data={monthlyStyleSummary.map((item) => ({
              date: item.period,
              cashIn: item.cashIn,
              cashOut: item.cashOut,
              net: item.net,
            }))}
          />
          <CategoryBarChart data={categoryBreakdown} />
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Monthly Summary
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900">Period Breakdown</h2>
        </div>
        <ReportsBreakdownTable data={monthlyStyleSummary} />
      </section>
    </div>
  );
}
