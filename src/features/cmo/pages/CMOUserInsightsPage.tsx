import { useCMOUserInsights } from "../hooks/useCMOUserInsights";
import CMOMetricCard from "../components/CMOMetricCard";
import CMOUserInsightTable from "../components/CMOUserInsightTable";

export default function CMOUserInsightsPage() {
  const { loading, items, summary } = useCMOUserInsights();

  if (loading) return <div>Loading CMO user insights...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CMOMetricCard title="Users" value={summary.total} />
        <CMOMetricCard title="VIP" value={summary.vip} />
        <CMOMetricCard title="Loyal" value={summary.loyal} />
        <CMOMetricCard title="High Churn Risk" value={summary.highRisk} />
      </div>

      <CMOUserInsightTable rows={items} />
    </div>
  );
}