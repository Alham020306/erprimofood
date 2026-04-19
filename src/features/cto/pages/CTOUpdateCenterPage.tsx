import { useCTOUpdateCenter } from "../hooks/useCTOUpdateCenter";

const MetricCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) => (
  <div className="rounded-3xl bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(14,165,233,0.12)]">
    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
      {title}
    </p>
    <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
  </div>
);

const toTimeValue = (value: any) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function CTOUpdateCenterPage() {
  const { loading, dashboard, release, updateData } = useCTOUpdateCenter();

  if (loading || !dashboard) {
    return <div>Loading CTO update center...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_24px_90px_rgba(14,165,233,0.12)]">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
            Update Center
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white">
            Monitoring rollout, adoption version, dan perangkat yang belum update
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            CTO bisa melihat target release aktif, siapa yang sudah mengadopsi,
            siapa yang tertinggal, dan kapan aplikasi terakhir melakukan update check.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard title="Target Version" value={release} subtitle="Mengikuti system/config settings.updateVersion" />
        <MetricCard title="Tracked Accounts" value={updateData.totalTrackable} subtitle="Driver dan restaurant yang punya sinyal version" />
        <MetricCard title="Adoption Rate" value={`${updateData.adoptionRate}%`} subtitle={`${updateData.adopted.length} akun sudah di target release`} />
        <MetricCard title="Outdated" value={updateData.outdated.length} subtitle="Akun yang belum berada di release target" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {updateData.roleSegments.map((segment) => (
          <section
            key={segment.role}
            className="rounded-3xl bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(14,165,233,0.12)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">{segment.role} Adoption</h3>
                <p className="text-sm text-slate-400">
                  Segmentasi update untuk akun {segment.role.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-2xl bg-cyan-500/10 px-4 py-3 text-right">
                <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300/70">
                  Adoption
                </div>
                <div className="mt-2 text-2xl font-bold text-white">
                  {segment.adoptionRate}%
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <MetricCard title="Tracked" value={segment.total} />
              <MetricCard title="Adopted" value={segment.adopted} />
              <MetricCard title="Outdated" value={segment.outdated} />
            </div>
          </section>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(14,165,233,0.12)]">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Version Adoption Breakdown</h3>
            <p className="text-sm text-slate-400">
              Distribusi versi aplikasi yang sedang dipakai akun operasional.
            </p>
          </div>

          <div className="space-y-3">
            {updateData.versionRows.map((row) => (
              <div
                key={row.version}
                className="flex items-center justify-between rounded-2xl border border-cyan-500/10 bg-slate-900/70 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{row.version}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {row.version === release ? "Target release aktif" : "Versi non-target"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-cyan-300">{row.count}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(14,165,233,0.12)]">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Latest Update Checks</h3>
            <p className="text-sm text-slate-400">
              Akun yang paling baru mengecek update atau melaporkan versi aplikasinya.
            </p>
          </div>

          <div className="space-y-3">
            {updateData.recentChecks.map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {item.name || item.email || item.id}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {item.role || "-"} • {item.lastSeenVersion || "UNKNOWN"}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {toTimeValue(item.lastUpdateCheck)
                      ? new Date(toTimeValue(item.lastUpdateCheck)).toLocaleString("id-ID")
                      : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-slate-950/70 p-5 shadow-[0_24px_90px_rgba(14,165,233,0.12)]">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white">Outdated Accounts</h3>
          <p className="text-sm text-slate-400">
            Daftar akun yang belum berada di versi target dan perlu ditindaklanjuti.
          </p>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {updateData.outdated.map((item: any) => (
            <div
              key={item.id}
              className="rounded-2xl border border-cyan-500/10 bg-slate-900/70 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {item.name || item.email || item.id}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {item.role || "-"} • current {item.lastSeenVersion || "UNKNOWN"}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  {toTimeValue(item.lastUpdateCheck)
                    ? new Date(toTimeValue(item.lastUpdateCheck)).toLocaleString("id-ID")
                    : "Belum pernah check"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
