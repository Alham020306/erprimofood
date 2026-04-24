import { useCFOLedger } from "../hooks/useCFOLedger";
import { useCFOTransactionComposer } from "../hooks/useCFOTransactionComposer";
import FinanceMetricCard from "../components/FinanceMetricCard";
import CFOFilters from "../components/CFOFilters";
import LedgerTable from "../components/LedgerTable";
import LedgerDetailPanel from "../components/LedgerDetailPanel";
import LedgerExportButton from "../components/LedgerExportButton";
import CFOTransactionComposer from "../components/CFOTransactionComposer";
import { formatCurrency, formatNumber } from "../utils/formatters";

type Props = {
  user: any;
};

export default function CFOLedgerPage({ user }: Props) {
  const {
    loading,
    ledger,
    categories,
    summary,
    typeFilter,
    setTypeFilter,
    categoryFilter,
    setCategoryFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    selectedTransaction,
    setSelectedTransaction,
  } = useCFOLedger();

  const composer = useCFOTransactionComposer({ user });

  if (loading) return <div>Loading CFO ledger...</div>;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-emerald-500/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.16),_transparent_26%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.35)]">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              Ledger Control
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-white">Financial Ledger</h1>
            <p className="mt-2 text-sm text-slate-300">
              Catat, filter, dan audit seluruh pergerakan finansial CFO.
            </p>
          </div>
          <LedgerExportButton rows={ledger} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <FinanceMetricCard title="Transactions" value={formatNumber(summary.total)} />
        <FinanceMetricCard title="Cash In" value={formatCurrency(summary.cashIn)} />
        <FinanceMetricCard title="Cash Out" value={formatCurrency(summary.cashOut)} />
        <FinanceMetricCard title="Net" value={formatCurrency(summary.net)} />
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            New Entry
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900">Compose Transaction</h2>
        </div>
        <CFOTransactionComposer
          title={composer.title}
          setTitle={composer.setTitle}
          type={composer.type}
          setType={composer.setType}
          category={composer.category}
          setCategory={composer.setCategory}
          amount={composer.amount}
          setAmount={composer.setAmount}
          date={composer.date}
          setDate={composer.setDate}
          description={composer.description}
          setDescription={composer.setDescription}
          submitting={composer.submitting}
          submit={composer.submit}
        />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Filters
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900">Ledger Query</h2>
        </div>
        <CFOFilters
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
            Ledger Workspace
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-900">Entries & Detail Panel</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <LedgerTable data={ledger} onSelect={setSelectedTransaction} />
          <LedgerDetailPanel item={selectedTransaction} />
        </div>
      </section>
    </div>
  );
}
