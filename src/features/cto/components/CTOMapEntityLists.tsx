type Props = {
  merchants: any[];
  drivers: any[];
  onSelect: (item: any) => void;
};

export default function CTOMapEntityLists({
  merchants,
  drivers,
  onSelect,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-cyan-300">Merchant List</h2>
          <p className="mt-1 text-sm text-slate-400">
            Klik untuk buka detail merchant.
          </p>
        </div>

        <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
          {merchants.length === 0 ? (
            <p className="text-slate-400">Belum ada merchant marker.</p>
          ) : (
            merchants.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-3 text-left transition hover:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {item.name ?? "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.area ?? "-"}
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      item.insideZone
                        ? item.isOperational
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                        : "bg-orange-500/20 text-orange-300"
                    }`}
                  >
                    {!item.insideZone
                      ? "OUT ZONE"
                      : item.isOperational
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-cyan-300">Driver List</h2>
          <p className="mt-1 text-sm text-slate-400">
            Klik untuk buka detail driver.
          </p>
        </div>

        <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
          {drivers.length === 0 ? (
            <p className="text-slate-400">Belum ada driver terdeteksi.</p>
          ) : (
            drivers.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-3 text-left transition hover:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {item.name ?? "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {item.area ?? "-"}
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      !item.hasLocation
                        ? "bg-red-500/20 text-red-300"
                        : !item.insideZone
                        ? "bg-orange-500/20 text-orange-300"
                        : item.isOnline
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {!item.hasLocation
                      ? "NO GPS"
                      : !item.insideZone
                      ? "OUT ZONE"
                      : item.isOnline
                      ? item.freshness || "ONLINE"
                      : "OFFLINE"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}