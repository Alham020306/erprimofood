import CTOSectionShell from "./CTOSectionShell";

type Props = {
  item: any | null;
};

export default function CTOMerchantDetailPanel({ item }: Props) {
  return (
    <CTOSectionShell
      title="Zone Detail"
      subtitle="Detailed merchant operational footprint for selected area."
    >
      {!item ? (
        <p className="text-slate-400">Pilih area untuk melihat detail.</p>
      ) : (
        <div className="space-y-2 text-sm">
          <div><span className="font-semibold text-cyan-300">Area:</span> <span className="text-slate-200">{item.area ?? "-"}</span></div>
          <div><span className="font-semibold text-cyan-300">Total Merchants:</span> <span className="text-slate-200">{item.totalMerchants ?? 0}</span></div>
          <div><span className="font-semibold text-cyan-300">Open Merchants:</span> <span className="text-emerald-300">{item.openMerchants ?? 0}</span></div>
          <div><span className="font-semibold text-cyan-300">Closed Merchants:</span> <span className="text-red-300">{item.closedMerchants ?? 0}</span></div>
        </div>
      )}
    </CTOSectionShell>
  );
}