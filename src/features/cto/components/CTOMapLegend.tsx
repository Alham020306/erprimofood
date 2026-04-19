import CTOSectionShell from "./CTOSectionShell";

export default function CTOMapLegend() {
  return (
    <CTOSectionShell
      title="Operational Map Legend"
      subtitle="Area, merchant, driver, and zone intelligence signals."
    >
      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="text-slate-300">Merchant active inside zone</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="text-slate-300">Merchant inactive/problem</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-cyan-400" />
          <span className="text-slate-300">Driver online inside zone</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-slate-400" />
          <span className="text-slate-300">Driver offline</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-orange-400" />
          <span className="text-slate-300">Outside operational zone</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-slate-300">Zone needs driver</span>
        </div>
      </div>
    </CTOSectionShell>
  );
}