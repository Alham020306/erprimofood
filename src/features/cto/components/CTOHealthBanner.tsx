type Props = {
  healthStatus: "HEALTHY" | "RISK" | "UNSTABLE" | "CRITICAL" | string;
  latencyMs?: number | null;
  networkStatus?: string;
  uptimeLabel?: string;
  incidentCount?: number;
};

const getTone = (status: string) => {
  switch (status) {
    case "HEALTHY":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";
    case "RISK":
      return "border-amber-400/30 bg-amber-500/10 text-amber-300";
    case "UNSTABLE":
      return "border-orange-400/30 bg-orange-500/10 text-orange-300";
    case "CRITICAL":
      return "border-red-400/30 bg-red-500/10 text-red-300";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }
};

const getLabel = (status: string) => {
  switch (status) {
    case "HEALTHY":
      return "All core systems operating within normal parameters.";
    case "RISK":
      return "Potential operational / technical risks detected.";
    case "UNSTABLE":
      return "System stability degraded. Monitoring required.";
    case "CRITICAL":
      return "Critical system state detected. Immediate attention required.";
    default:
      return "System state unavailable.";
  }
};

export default function CTOHealthBanner({
  healthStatus,
  latencyMs = null,
  networkStatus = "UNKNOWN",
  uptimeLabel = "Realtime",
  incidentCount = 0,
}: Props) {
  return (
    <div
      className={`rounded-[30px] border px-6 py-6 shadow-[0_24px_90px_rgba(14,165,233,0.14)] ${getTone(
        healthStatus
      )}`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] opacity-80">
            System Core
          </p>
          <h2 className="mt-1 text-2xl font-bold">Health Status: {healthStatus}</h2>
          <p className="mt-1 text-sm opacity-90">{getLabel(healthStatus)}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.22em] opacity-80">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            latency
            <div className="mt-1 text-sm font-bold normal-case opacity-100">
              {latencyMs !== null ? `${latencyMs} ms` : "n/a"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            uptime
            <div className="mt-1 text-sm font-bold normal-case opacity-100">
              {uptimeLabel}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            incident
            <div className="mt-1 text-sm font-bold normal-case opacity-100">
              {incidentCount} • {networkStatus}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
