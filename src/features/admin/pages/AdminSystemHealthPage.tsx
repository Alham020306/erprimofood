import { useCTOExecutiveDashboard } from "../../cto/hooks/useCTOExecutiveDashboard";

export default function AdminSystemHealthPage() {
  const { loading, dashboard } = useCTOExecutiveDashboard();

  if (loading) return <div>Loading system health...</div>;
  if (!dashboard) return <div>No system health data</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
            System Health
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Monitoring kesehatan sistem untuk kontrol teknis dan stabilitas platform
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Padanan dari system health dan system intelligence di super admin lama,
            tetapi memakai summary CTO ERP yang sekarang lebih terstruktur dan tepat
            untuk command center teknologi.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Health Status
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {dashboard.healthStatus}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Unresolved Alerts
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {dashboard.summary.unresolvedAlerts}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Critical Alerts
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {dashboard.summary.criticalAlerts}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Total Errors
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {dashboard.summary.totalErrorCount}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Config Snapshot</h3>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>Maintenance: <b>{dashboard.configSnapshot.maintenanceMode ? "ON" : "OFF"}</b></div>
            <div>Bot Enabled: <b>{dashboard.configSnapshot.botEnabled ? "YES" : "NO"}</b></div>
            <div>Support: <b>{dashboard.configSnapshot.supportOnline ? "ONLINE" : "OFFLINE"}</b></div>
            <div>Update Version: <b>{dashboard.configSnapshot.updateVersion || "-"}</b></div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Latest Alerts</h3>
          <div className="mt-4 space-y-3">
            {dashboard.latestAlerts.slice(0, 6).map((alert: any) => (
              <div key={alert.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">
                  {alert.title || alert.type || "Alert"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {alert.severity || "-"} · {alert.status || "-"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h3 className="text-lg font-bold text-slate-900">Latest Logs</h3>
          <div className="mt-4 space-y-3">
            {dashboard.latestLogs.slice(0, 6).map((log: any) => (
              <div key={log.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">
                  {log.message || log.type || "Log"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {log.module || "-"} · {log.level || "-"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
