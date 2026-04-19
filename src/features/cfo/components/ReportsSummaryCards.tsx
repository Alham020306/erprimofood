import FinanceMetricCard from "./FinanceMetricCard";
import { formatCurrency, formatNumber } from "../utils/formatters";

type Props = {
  monthlyStyleSummary: { period: string; cashIn: number; cashOut: number; net: number }[];
};

export default function ReportsSummaryCards({ monthlyStyleSummary }: Props) {
  const totalPeriods = monthlyStyleSummary.length;
  const totalNet = monthlyStyleSummary.reduce((sum, item) => sum + item.net, 0);
  const totalCashIn = monthlyStyleSummary.reduce((sum, item) => sum + item.cashIn, 0);
  const totalCashOut = monthlyStyleSummary.reduce((sum, item) => sum + item.cashOut, 0);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <FinanceMetricCard title="Periods" value={formatNumber(totalPeriods)} />
      <FinanceMetricCard title="Total Cash In" value={formatCurrency(totalCashIn)} />
      <FinanceMetricCard title="Total Cash Out" value={formatCurrency(totalCashOut)} />
      <FinanceMetricCard title="Total Net" value={formatCurrency(totalNet)} />
    </div>
  );
}