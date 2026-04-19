type Props = {
  rows: any[];
};

export default function CEOAlertPanel({ rows }: Props) {
  return (
    <div className="rounded-3xl border border-violet-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Critical Alerts</h2>
      <div className="mt-4 space-y-3">
        {rows.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-500">{item.message}</div>
              </div>
              <div className="text-xs font-bold text-violet-600">
                {item.severity}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}