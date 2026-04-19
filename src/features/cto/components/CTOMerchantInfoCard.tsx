type Props = {
  merchant: any | null;
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
  if (value === "INACTIVE") return "text-red-300";
  return "text-emerald-300";
};

export default function CTOMerchantInfoCard({ merchant }: Props) {
  if (!merchant) {
    return (
      <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
        <h2 className="text-lg font-bold text-cyan-300">Merchant Detail</h2>
        <p className="mt-3 text-slate-400">
          Pilih marker merchant untuk melihat profil operasional.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/90 p-5 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-cyan-300">Merchant Detail</h2>
          <p className="mt-1 text-sm text-slate-400">{merchant.name ?? "-"}</p>
        </div>

        <div
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            merchant.isOperational
              ? "bg-emerald-500/20 text-emerald-300"
              : "bg-red-500/20 text-red-300"
          }`}
        >
          {merchant.isOperational ? "OPERATIONAL" : "INACTIVE"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="ID" value={merchant.id} />
        <Field label="Owner ID" value={merchant.ownerId} />
        <Field label="Area" value={merchant.area} />
        <Field label="Address" value={merchant.address} />
        <Field label="Phone" value={merchant.phone} />
        <Field label="Email" value={merchant.email} />
        <Field
          label="Open"
          value={merchant.isOpen ? "YES" : "NO"}
          tone={merchant.isOpen ? "text-emerald-300" : "text-red-300"}
        />
        <Field
          label="Banned"
          value={merchant.isBanned ? "YES" : "NO"}
          tone={merchant.isBanned ? "text-red-300" : "text-emerald-300"}
        />
        <Field
          label="Inside Zone"
          value={merchant.insideZone ? "YES" : "NO"}
          tone={merchant.insideZone ? "text-emerald-300" : "text-orange-300"}
        />
        <Field label="Risk" value={merchant.risk} tone={riskTone(merchant.risk)} />
        <Field
          label="Rating"
          value={merchant.rating ?? 0}
        />
        <Field
          label="Total Orders"
          value={merchant.totalOrders ?? 0}
        />
        <Field
          label="Balance"
          value={`Rp ${Number(merchant.balance || 0).toLocaleString("id-ID")}`}
        />
        <Field
          label="Unpaid Commission"
          value={`Rp ${Number(
            merchant.totalUnpaidCommission || 0
          ).toLocaleString("id-ID")}`}
        />
        <Field
          label="Created At"
          value={
            merchant.createdAt
              ? new Date(merchant.createdAt).toLocaleString("id-ID")
              : "-"
          }
        />
        <Field
          label="Coordinates"
          value={`${merchant.lat ?? 0}, ${merchant.lng ?? 0}`}
        />
      </div>
    </div>
  );
}