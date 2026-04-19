const SummaryCard = ({ title, value }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
  </div>
);

type Props = {
  summary: {
    total: number;
    open: number;
    closed: number;
    banned: number;
  };
};

export default function OperationsSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <SummaryCard title="Total Merchant" value={summary.total} />
      <SummaryCard title="Open Merchant" value={summary.open} />
      <SummaryCard title="Closed Merchant" value={summary.closed} />
      <SummaryCard title="Banned Merchant" value={summary.banned} />
    </div>
  );
}