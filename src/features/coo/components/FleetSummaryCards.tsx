const SummaryCard = ({ title, value }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
  </div>
);

type Props = {
  summary: {
    total: number;
    online: number;
    offline: number;
    unpaid: number;
  };
};

export default function FleetSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <SummaryCard title="Total Driver" value={summary.total} />
      <SummaryCard title="Online Driver" value={summary.online} />
      <SummaryCard title="Offline Driver" value={summary.offline} />
      <SummaryCard title="Unpaid Commission" value={summary.unpaid} />
    </div>
  );
}