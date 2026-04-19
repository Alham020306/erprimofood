type Props = {
  rows: any[];
};

export default function CMOChurnPanel({ rows }: Props) {
  const highRisk = rows.filter((r) => r.churnRisk === "HIGH").slice(0, 10);

  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">High Churn Risk</h2>
      <p className="mt-1 text-sm text-slate-500">
        Users who may need retention campaign.
      </p>

      <div className="mt-4 space-y-3">
        {highRisk.length === 0 ? (
          <p className="text-sm text-slate-400">No high-risk users detected.</p>
        ) : (
          highRisk.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="font-semibold text-slate-900">{item.name}</div>
              <div className="mt-1 text-xs text-slate-500">
                Last order:{" "}
                {item.lastOrderAt
                  ? new Date(item.lastOrderAt).toLocaleString("id-ID")
                  : "-"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}