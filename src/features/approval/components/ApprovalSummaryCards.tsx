const Card = ({ title, value }: any) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
  </div>
);

type Props = {
  summary: {
    total: number;
    submitted: number;
    inReview: number;
    approved: number;
    rejected: number;
  };
};

export default function ApprovalSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <Card title="Total" value={summary.total} />
      <Card title="Submitted" value={summary.submitted} />
      <Card title="In Review" value={summary.inReview} />
      <Card title="Approved" value={summary.approved} />
      <Card title="Rejected" value={summary.rejected} />
    </div>
  );
}