import FinanceMetricCard from "./FinanceMetricCard";
import { formatCurrency } from "../utils/formatters";

type Props = {
  summary: {
    totalRestaurantBalance: number;
    totalDriverBalance: number;
    unpaidRestaurantCommission: number;
    unpaidDriverCommission: number;
  };
};

export default function SettlementSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <FinanceMetricCard
        title="Restaurant Balance"
        value={formatCurrency(summary.totalRestaurantBalance)}
      />
      <FinanceMetricCard
        title="Driver Balance"
        value={formatCurrency(summary.totalDriverBalance)}
      />
      <FinanceMetricCard
        title="Unpaid Restaurant Commission"
        value={formatCurrency(summary.unpaidRestaurantCommission)}
      />
      <FinanceMetricCard
        title="Unpaid Driver Commission"
        value={formatCurrency(summary.unpaidDriverCommission)}
      />
    </div>
  );
}