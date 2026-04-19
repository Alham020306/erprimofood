import CTOSectionShell from "./CTOSectionShell";

type Props = {
  rows: any[];
};

const recTone = (value: string) => {
  const v = String(value || "").toUpperCase();
  if (v === "HIGH_POTENTIAL") return "bg-cyan-500/20 text-cyan-300";
  if (v === "NEED_DRIVER_FIRST") return "bg-amber-500/20 text-amber-300";
  if (v === "NEED_MERCHANT_FIRST") return "bg-orange-500/20 text-orange-300";
  if (v === "LOW_ACTIVITY") return "bg-slate-500/20 text-slate-300";
  return "bg-emerald-500/20 text-emerald-300";
};

export default function CTOExpansionTable({ rows }: Props) {
  return (
    <CTOSectionShell
      title="Expansion Analyzer"
      subtitle="Area readiness scoring for future expansion."
    >
      {!rows.length ? (
        <p className="text-slate-400">Belum ada data ekspansi.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Area</th>
                <th>Drivers</th>
                <th>Merchants</th>
                <th>Orders</th>
                <th>Readiness</th>
                <th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr
                  key={item.area}
                  className="border-t border-cyan-500/10 hover:bg-slate-900/70"
                >
                  <td className="py-2 font-medium text-white">{item.area}</td>
                  <td className="text-slate-300">{item.drivers}</td>
                  <td className="text-slate-300">{item.activeMerchants}/{item.merchants}</td>
                  <td className="text-slate-300">{item.orders}</td>
                  <td className="text-cyan-300">{item.readiness}</td>
                  <td>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${recTone(item.recommendation)}`}>
                      {item.recommendation}
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