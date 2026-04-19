const SummaryCard = ({ title, value }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="mt-2 text-3xl font-bold text-slate-900">
      {title === "Total Value" ? `Rp ${Number(value || 0).toLocaleString("id-ID")}` : value}
    </h2>
  </div>
);

type Props = {
  summary: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  };
};

export default function OrdersSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <SummaryCard title="Total Orders" value={summary.total} />
      <SummaryCard title="Pending" value={summary.pending} />
      <SummaryCard title="Completed" value={summary.completed} />
      <SummaryCard title="Cancelled" value={summary.cancelled} />
      <SummaryCard title="Total Value" value={summary.totalValue} />
    </div>
  );
}
