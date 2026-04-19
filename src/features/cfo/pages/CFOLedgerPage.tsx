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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <FinanceMetricCard title="Transactions" value={formatNumber(summary.total)} />
        <FinanceMetricCard title="Cash In" value={formatCurrency(summary.cashIn)} />
        <FinanceMetricCard title="Cash Out" value={formatCurrency(summary.cashOut)} />
        <FinanceMetricCard title="Net" value={formatCurrency(summary.net)} />
      </div>

      <div className="flex justify-end">
        <LedgerExportButton rows={ledger} />
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

      <div className="grid gap-4 xl:grid-cols-2">
        <LedgerTable data={ledger} onSelect={setSelectedTransaction} />
        <LedgerDetailPanel item={selectedTransaction} />
      </div>
    </div>
  );
}