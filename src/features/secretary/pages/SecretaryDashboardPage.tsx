import { useSecretaryDashboard } from "../hooks/useSecretaryDashboard";

export default function SecretaryDashboard() {
  const { loading, tasks, notifications } = useSecretaryDashboard();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Priority Tasks</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">High Priority</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {tasks.filter((item) => item.priority === "HIGH").length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {notifications.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow">
          <p className="text-sm text-slate-500">Coordination Status</p>
          <p className="mt-2 text-xl font-bold text-emerald-600">ACTIVE</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5">
        <h2 className="font-bold text-lg">Priority Tasks</h2>
        <div className="mt-4 space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="p-4 rounded-xl border flex justify-between">
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-xs text-slate-500">{t.action}</p>
              </div>
              <span className="text-xs font-bold">{t.priority}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border bg-white p-5">
          <h2 className="font-bold text-lg">Notifications</h2>
          <div className="mt-4 space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                {n.message}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <h2 className="font-bold text-lg">Governance Focus</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              Letters dan memo sekarang bisa dikelola langsung dari menu `Letters`.
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              Agenda rapat dan tindak lanjut ada di menu `Agenda`.
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              Approval inbox Secretary sekarang sudah tersambung ke workflow utama.
            </div>
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              Blueprint collection `dbCLevel` sekarang tersedia di menu `Database Sheets`.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
