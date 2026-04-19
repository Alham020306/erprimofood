type Props = {
  rows: any[];
};

export default function CEORoleReportBoard({ rows }: Props) {
  return (
    <div className="rounded-3xl border border-violet-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Role Reports</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {rows.map((item) => (
          <div
            key={item.role}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600/80">
              {item.role}
            </div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {item.title}
            </div>
            <div className="mt-2 text-sm text-slate-500">{item.summary}</div>
            <div className="mt-3 text-xs font-bold text-slate-700">
              {item.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}