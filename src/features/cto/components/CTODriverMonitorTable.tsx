import CTOSectionShell from "./CTOSectionShell";

type Props = {
  rows: any[];
  onSelect: (item: any) => void;
};

const riskTone = (risk: string) => {
  const value = String(risk || "").toUpperCase();
  if (value === "NO_SIGNAL") return "bg-red-500/20 text-red-300";
  if (value === "STALE") return "bg-amber-500/20 text-amber-300";
  if (value === "IDLE") return "bg-orange-500/20 text-orange-300";
  if (value === "OFFLINE") return "bg-slate-500/20 text-slate-300";
  return "bg-emerald-500/20 text-emerald-300";
};

export default function CTODriverMonitorTable({ rows, onSelect }: Props) {
  return (
    <CTOSectionShell
      title="Driver Monitor"
      subtitle="Realtime-style operational visibility for drivers."
    >
      {!rows.length ? (
        <p className="text-slate-400">Belum ada data driver.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Name</th>
                <th>Area</th>
                <th>Speed</th>
                <th>Freshness</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer border-t border-cyan-500/10 hover:bg-slate-900/70"
                >
                  <td className="py-2 font-medium text-white">{item.name ?? "-"}</td>
                  <td className="text-slate-300">{item.area ?? "-"}</td>
                  <td className="text-slate-300">{item.speed ?? 0}</td>
                  <td className="text-cyan-300">{item.freshness ?? "-"}</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskTone(item.risk)}`}>
                      {item.risk ?? "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CTOSectionShell>
  );
}