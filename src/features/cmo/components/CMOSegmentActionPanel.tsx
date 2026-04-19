type Props = {
  summary: {
    vipCount: number;
    loyalCount: number;
    activeCount: number;
    highRiskCount: number;
    vipRevenue: number;
    loyalRevenue: number;
  };
};

const ActionCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
    <div className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500/80">
      {title}
    </div>
    <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
  </div>
);

export default function CMOSegmentActionPanel({ summary }: Props) {
  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Segment Actions</h2>
      <p className="mt-1 text-sm text-slate-500">
        Recommended focus by user segment.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ActionCard
          title="VIP Users"
          value={summary.vipCount}
          subtitle={`Protect premium revenue: Rp ${Number(summary.vipRevenue).toLocaleString("id-ID")}`}
        />
        <ActionCard
          title="Loyal Users"
          value={summary.loyalCount}
          subtitle={`Upsell and frequency campaign: Rp ${Number(summary.loyalRevenue).toLocaleString("id-ID")}`}
        />
        <ActionCard
          title="Active Users"
          value={summary.activeCount}
          subtitle="Push repeat-order incentives."
        />
        <ActionCard
          title="High Churn Risk"
          value={summary.highRiskCount}
          subtitle="Run win-back or reactivation campaign."
        />
      </div>
    </div>
  );
}