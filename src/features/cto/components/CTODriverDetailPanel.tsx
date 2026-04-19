import CTOSectionShell from "./CTOSectionShell";

type Props = {
  item: any | null;
};

export default function CTODriverDetailPanel({ item }: Props) {
  return (
    <CTOSectionShell
      title="Driver Detail"
      subtitle="Technical and operational status for selected driver."
    >
      {!item ? (
        <p className="text-slate-400">Pilih driver untuk melihat detail.</p>
      ) : (
        <div className="space-y-2 text-sm">
          <div><span className="font-semibold text-cyan-300">Name:</span> <span className="text-slate-200">{item.name ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Area:</span> <span className="text-slate-200">{item.area ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Online:</span> <span className="text-slate-200">{item.isOnline ? "YES" : "NO"}</span></div>
          <div><span className="font-semibold text-cyan-300">Moving:</span> <span className="text-slate-200">{item.isMoving ? "YES" : "NO"}</span></div>
          <div><span className="font-semibold text-cyan-300">Speed:</span> <span className="text-slate-200">{item.speed ?? 0}</span></div>
          <div><span className="font-semibold text-cyan-300">Freshness:</span> <span className="text-slate-200">{item.freshness ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Risk:</span> <span className="text-slate-200">{item.risk ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Updated At:</span> <span className="text-slate-200">{item.updatedAt ? new Date(item.updatedAt).toLocaleString("id-ID") : "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Phone:</span> <span className="text-slate-200">{item.phone ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Vehicle:</span> <span className="text-slate-200">{item.vehicleBrand ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Plate:</span> <span className="text-slate-200">{item.plateNumber ?? "-"}</span></div>
        </div>
      )}
    </CTOSectionShell>
  );
}