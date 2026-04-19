import CTOSectionShell from "./CTOSectionShell";

type Props = {
  rows: any[];
  onSelect: (item: any) => void;
};

export default function CTOMerchantZoneTable({ rows, onSelect }: Props) {
  return (
    <CTOSectionShell
      title="Merchant Zones"
      subtitle="Operational merchant distribution by area."
    >
      {!rows.length ? (
        <p className="text-slate-400">Belum ada data area merchant.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Area</th>
                <th>Total</th>
                <th>Open</th>
                <th>Closed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.area}
                  onClick={() => onSelect(item)}
                  className="cursor-pointer border-t border-cyan-500/10 hover:bg-slate-900/70"
                >
                  <td className="py-2 font-medium text-white">{item.area}</td>
                  <td className="text-slate-300">{item.totalMerchants}</td>
                  <td className="text-emerald-300">{item.openMerchants}</td>
                  <td className="text-red-300">{item.closedMerchants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CTOSectionShell>
  );
}