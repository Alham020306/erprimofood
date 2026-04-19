type Props = {
  issues: string[];
};

export default function LiveOpsIssuesPanel({ issues }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Live Issues</h2>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          Tidak ada issue utama saat ini
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div
              key={index}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            >
              {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}