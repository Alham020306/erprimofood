type Props = {
  title: string;
  rows: any[];
  type: "logs" | "alerts" | "errors";
};

const renderPrimary = (type: Props["type"], row: any) => {
  if (type === "logs") return row?.message ?? "-";
  if (type === "alerts") return row?.title ?? "-";
  return row?.message ?? "-";
};

const renderSecondary = (type: Props["type"], row: any) => {
  if (type === "logs") {
    return `${row?.module ?? "-"} • ${row?.severity ?? "INFO"}`;
  }

  if (type === "alerts") {
    return `${row?.module ?? "-"} • ${row?.severity ?? "-"}`;
  }

  return `${row?.module ?? "-"} • count ${row?.count ?? 1}`;
};

const severityTone = (severity: string) => {
  const s = String(severity || "").toUpperCase();

  if (s === "CRITICAL") return "border-red-400/30 bg-red-500/10";
  if (s === "ERROR") return "border-orange-400/30 bg-orange-500/10";
  if (s === "WARN") return "border-amber-400/30 bg-amber-500/10";
  return "border-cyan-400/20 bg-cyan-500/5";
};

export default function CTOActivityTable({ title, rows, type }: Props) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <h2 className="mb-4 text-lg font-bold text-cyan-300">{title}</h2>
        <p className="text-slate-400">Belum ada data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_24px_80px_rgba(14,165,233,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-cyan-300">{title}</h2>
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
          {rows.length} items
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className={`rounded-2xl border px-4 py-4 ${severityTone(
              row?.severity
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white">
                  {renderPrimary(type, row)}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {renderSecondary(type, row)}
                </div>
              </div>

              <div className="text-xs text-slate-500">
                {type === "errors"
                  ? row?.lastSeenAt
                    ? new Date(row.lastSeenAt).toLocaleString("id-ID")
                    : "-"
                  : row?.createdAt
                  ? new Date(row.createdAt).toLocaleString("id-ID")
                  : "-"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
