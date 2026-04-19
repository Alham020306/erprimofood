import CTOSectionShell from "./CTOSectionShell";
import CTODriverInfoCard from "./CTODriverInfoCard";
import CTOMerchantInfoCard from "./CTOMerchantInfoCard";

type Props = {
  selectedMarker: any | null;
};

const SimpleField = ({
  label,
  value,
}: {
  label: string;
  value: any;
}) => (
  <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-3">
    <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
      {label}
    </div>
    <div className="mt-1 text-sm font-semibold text-slate-200">
      {value ?? "-"}
    </div>
  </div>
);

export default function CTOMapInsightPanel({ selectedMarker }: Props) {
  if (!selectedMarker) {
    return (
      <CTOSectionShell
        title="Selected Signal Insight"
        subtitle="Detail for selected operational object."
      >
        <p className="text-slate-400">
          Klik marker merchant, marker driver, atau zone point untuk melihat detail.
        </p>
      </CTOSectionShell>
    );
  }

  if (selectedMarker.type === "DRIVER") {
    return <CTODriverInfoCard driver={selectedMarker} />;
  }

  if (selectedMarker.type === "MERCHANT") {
    return <CTOMerchantInfoCard merchant={selectedMarker} />;
  }

  return (
    <CTOSectionShell
      title="Zone / Area Insight"
      subtitle="Operational area signal summary."
    >
      <div className="mb-4 rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-4">
        <div className="text-xs font-bold uppercase tracking-widest text-cyan-300">
          Selected Area
        </div>
        <div className="mt-2 text-lg font-bold text-white">
          {selectedMarker.area ?? selectedMarker.name ?? "-"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SimpleField
          label="Type"
          value={selectedMarker.type ?? "UNKNOWN"}
        />
        <SimpleField
          label="Status"
          value={selectedMarker.status ?? "-"}
        />
        <SimpleField
          label="Merchants"
          value={`${selectedMarker.openMerchants ?? 0}/${selectedMarker.totalMerchants ?? 0}`}
        />
        <SimpleField
          label="Drivers"
          value={`${selectedMarker.onlineDrivers ?? 0}/${selectedMarker.totalDrivers ?? 0}`}
        />
        <SimpleField
          label="Orders"
          value={selectedMarker.totalOrders ?? 0}
        />
        {"points" in selectedMarker ? (
          <SimpleField label="Polygon Points" value={selectedMarker.points} />
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
            Restaurants In Selected Area
          </div>
          <div className="mt-3 space-y-3">
            {(selectedMarker.merchants || []).length > 0 ? (
              selectedMarker.merchants.slice(0, 8).map((merchant: any) => (
                <div
                  key={merchant.id}
                  className="rounded-2xl border border-cyan-500/10 bg-slate-950/70 px-4 py-3"
                >
                  <div className="text-sm font-semibold text-white">{merchant.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{merchant.address}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                    <span>{merchant.phone}</span>
                    <span
                      className={
                        merchant.isOperational ? "text-emerald-300" : "text-amber-300"
                      }
                    >
                      {merchant.isOperational ? "Operational" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Belum ada restoran yang terdeteksi di area ini.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
            Drivers In Selected Area
          </div>
          <div className="mt-3 space-y-3">
            {(selectedMarker.drivers || []).length > 0 ? (
              selectedMarker.drivers.slice(0, 8).map((driver: any) => (
                <div
                  key={driver.id}
                  className="rounded-2xl border border-cyan-500/10 bg-slate-950/70 px-4 py-3"
                >
                  <div className="text-sm font-semibold text-white">{driver.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{driver.phone}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                    <span>{driver.freshness || "-"}</span>
                    <span className={driver.isOnline ? "text-cyan-300" : "text-slate-400"}>
                      {driver.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Belum ada driver yang terdeteksi di area ini.
              </p>
            )}
          </div>
        </div>
      </div>
    </CTOSectionShell>
  );
}
