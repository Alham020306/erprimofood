type Props = {
  driver: any | null;
};

const Field = ({
  label,
  value,
  tone = "text-slate-200",
}: {
  label: string;
  value: any;
  tone?: string;
}) => (
  <div className="rounded-2xl border border-cyan-500/10 bg-slate-900/60 px-4 py-3">
    <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
      {label}
    </div>
    <div className={`mt-1 text-sm font-semibold ${tone}`}>
      {value ?? "-"}
    </div>
  </div>
);

const riskTone = (risk: string) => {
  const value = String(risk || "").toUpperCase();
  if (value === "OUT_OF_ZONE") return "text-orange-300";
  if (value === "NO_SIGNAL") return "text-red-300";
  if (value === "STALE") return "text-amber-300";
  if (value === "IDLE") return "text-orange-300";
  if (value === "OFFLINE") return "text-slate-300";
  return "text-emerald-300";
};

export default function CTODriverInfoCard({ driver }: Props) {
  if (!driver) {
    return (
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <h2 className="text-lg font-bold text-cyan-300">Driver Detail</h2>
        <p className="mt-3 text-slate-400">
          Pilih marker driver untuk melihat profil operasional.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-cyan-300">Driver Detail</h2>
          <p className="mt-1 text-sm text-slate-400">{driver.name ?? "-"}</p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            driver.isOnline
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-slate-500/20 text-slate-300"
          }`}
        >
          {driver.isOnline ? "ONLINE" : "OFFLINE"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="ID" value={driver.id} />
        <Field label="Area" value={driver.area} />
        <Field label="Phone" value={driver.phone} />
        <Field label="Email" value={driver.email} />
        <Field label="Vehicle" value={driver.vehicleBrand} />
        <Field label="Plate Number" value={driver.plateNumber} />
        <Field
          label="Verified"
          value={driver.isVerified ? "YES" : "NO"}
          tone={driver.isVerified ? "text-emerald-300" : "text-amber-300"}
        />
        <Field
          label="Inside Zone"
          value={driver.insideZone ? "YES" : "NO"}
          tone={driver.insideZone ? "text-emerald-300" : "text-orange-300"}
        />
        <Field label="Speed" value={driver.speed ?? 0} />
        <Field
          label="Moving"
          value={driver.isMoving ? "YES" : "NO"}
          tone={driver.isMoving ? "text-emerald-300" : "text-slate-300"}
        />
        <Field
          label="Freshness"
          value={driver.freshness}
          tone={
            driver.freshness === "LIVE"
              ? "text-emerald-300"
              : driver.freshness === "STALE"
              ? "text-amber-300"
              : "text-red-300"
          }
        />
        <Field label="Risk" value={driver.risk} tone={riskTone(driver.risk)} />
        <Field
          label="Balance"
          value={`Rp ${Number(driver.balance || 0).toLocaleString("id-ID")}`}
        />
        <Field
          label="Unpaid Commission"
          value={`Rp ${Number(driver.totalUnpaidCommission || 0).toLocaleString(
            "id-ID"
          )}`}
        />
        <Field
          label="Updated At"
          value={
            driver.updatedAt
              ? new Date(driver.updatedAt).toLocaleString("id-ID")
              : "-"
          }
        />
        <Field
          label="Coordinates"
          value={`${driver.lat ?? 0}, ${driver.lng ?? 0}`}
        />
      </div>
    </div>
  );
}