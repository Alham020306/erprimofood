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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automated Financial Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
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
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20"
        >
          Download Financial Excel
        </button>
      </div>

      <ReportsSummaryCards monthlyStyleSummary={monthlyStyleSummary} />

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

      <ReportsBreakdownTable data={monthlyStyleSummary} />
    </div>
  );
}
