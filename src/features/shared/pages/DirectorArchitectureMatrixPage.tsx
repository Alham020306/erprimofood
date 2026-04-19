type MatrixRow = {
  role: string;
  module: string;
  source: string;
  collections: string[];
  databaseTarget: "dbMain" | "direksi" | "Hybrid";
  mode: "SUMMARY" | "REALTIME SUBSET" | "HYBRID" | "ON-DEMAND" | "DETAIL REALTIME";
  status: "OPTIMAL" | "WAJAR" | "HYBRID";
  costPosture: "HEMAT" | "SEIMBANG" | "INVESTIGATIF";
  implementation: "DONE" | "PARTIAL" | "NEXT";
  purpose: string;
};

const matrixRows: MatrixRow[] = [
  { role: "CEO", module: "Dashboard", source: "direksi / executive_overview", collections: ["executive_overview/main"], databaseTarget: "direksi", mode: "SUMMARY", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Executive summary, alerts, role reports, dan keputusan tanpa fanout operasional besar." },
  { role: "COO", module: "Dashboard", source: "direksi / coo_operational_summary + dbMain subset", collections: ["coo_operational_summary/live", "users", "restaurants", "orders"], databaseTarget: "Hybrid", mode: "HYBRID", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "KPI operasional cepat, tabel inti tetap hidup, detail merchant/driver lazy saat dipilih." },
  { role: "COO", module: "Merchant / Driver Detail", source: "dbMain per entitas", collections: ["orders", "reviews", "driver_reviews", "menus"], databaseTarget: "dbMain", mode: "ON-DEMAND", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Investigasi operasional akurat tanpa membuka semua review/menu dari awal." },
  { role: "ADMIN", module: "Dashboard", source: "direksi / coo_operational_summary + dbMain subset", collections: ["coo_operational_summary/live", "users", "orders", "reviews", "driver_reviews", "system/support"], databaseTarget: "Hybrid", mode: "HYBRID", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Meniru super admin lama: support, friction watch, latest orders, update users, review monitor." },
  { role: "ADMIN", module: "Orders / Activity", source: "dbMain / orders", collections: ["orders"], databaseTarget: "dbMain", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Console operasional fokus ke stream order yang benar-benar dipakai." },
  { role: "ADMIN", module: "Merchant / Driver Management", source: "dbMain operasional", collections: ["users", "restaurants", "orders", "reviews", "driver_reviews"], databaseTarget: "dbMain", mode: "DETAIL REALTIME", status: "WAJAR", costPosture: "INVESTIGATIF", implementation: "DONE", purpose: "Halaman kerja operator yang memang perlu konteks detail seperti super admin lama." },
  { role: "CFO", module: "Dashboard", source: "direksi / cfo_financial_summary", collections: ["cfo_financial_summary/current"], databaseTarget: "direksi", mode: "SUMMARY", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Landing finansial hemat read untuk KPI, exposure, dan finance alerts." },
  { role: "CFO", module: "Reports", source: "dbMain / operational_ledger + detail finance", collections: ["operational_ledger", "orders", "users", "restaurants"], databaseTarget: "Hybrid", mode: "HYBRID", status: "WAJAR", costPosture: "INVESTIGATIF", implementation: "DONE", purpose: "Chart, ledger detail, dan export memang tetap layak lebih berat." },
  { role: "CTO", module: "Dashboard", source: "direksi / cto_system_summary + recent feeds", collections: ["cto_system_summary/current", "system_logs", "system_alerts", "system_errors", "system_backups", "system/config", "system/support"], databaseTarget: "Hybrid", mode: "HYBRID", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Health board utama ringan dengan log/alert/error feed terkini." },
  { role: "CTO", module: "Update Center", source: "direksi summary + dbMain users subset + system/config", collections: ["cto_system_summary/current", "users", "system/config"], databaseTarget: "Hybrid", mode: "HYBRID", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Monitoring version/adoption tanpa graph CTO penuh." },
  { role: "CTO", module: "Alerts / Logs", source: "direksi / system_alerts, system_errors, system_logs", collections: ["system_alerts", "system_errors", "system_logs"], databaseTarget: "direksi", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Investigasi insiden teknis fokus ke feed yang relevan saja." },
  { role: "CTO", module: "Driver Monitor", source: "dbMain / users(driver)", collections: ["users"], databaseTarget: "dbMain", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Pantau freshness, risk, dan signal driver tanpa data CTO lain." },
  { role: "CTO", module: "Merchant Zones", source: "dbMain / restaurants", collections: ["restaurants"], databaseTarget: "dbMain", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Zone capacity dan merchant health cukup dari subset merchant." },
  { role: "CTO", module: "Expansion Analyzer", source: "dbMain / users + restaurants + orders", collections: ["users", "restaurants", "orders"], databaseTarget: "dbMain", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Analisa readiness ekspansi tetap akurat tanpa narik seluruh graph CTO." },
  { role: "CTO", module: "Map Monitor", source: "dbMain / users + restaurants + orders + system/config", collections: ["users", "restaurants", "orders", "system/config"], databaseTarget: "Hybrid", mode: "HYBRID", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Peta operasional tetap kaya, tapi tidak lagi ikut data CTO yang tidak dipakai." },
  { role: "CTO", module: "Config Control", source: "direksi summary/config live + raw fetch saat refresh/export", collections: ["cto_system_summary/current", "sync_state/current", "system/config", "system/support", "database summaries"], databaseTarget: "Hybrid", mode: "ON-DEMAND", status: "OPTIMAL", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Kontrol sistem tetap kuat, raw besar hanya diambil saat perlu." },
  { role: "CMO", module: "Dashboard", source: "direksi / cmo_growth_summary", collections: ["cmo_growth_summary/current"], databaseTarget: "direksi", mode: "SUMMARY", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Growth, merchandising, dan campaign ROI dari cache direksi." },
  { role: "CMO", module: "User Insights", source: "dbMain / users + orders", collections: ["users", "orders"], databaseTarget: "dbMain", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Segmentasi user cukup dari customer/order, tidak perlu hook CTO penuh." },
  { role: "HR", module: "Dashboard", source: "direksi / hr_people_summary", collections: ["hr_people_summary/current"], databaseTarget: "direksi", mode: "SUMMARY", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "People overview dan workforce demand berbasis snapshot direksi." },
  { role: "SECRETARY", module: "Dashboard", source: "dbMain / users + orders", collections: ["users", "orders"], databaseTarget: "dbMain", mode: "REALTIME SUBSET", status: "OPTIMAL", costPosture: "HEMAT", implementation: "DONE", purpose: "Task dan governance notification dibentuk dari subset operasional yang dipakai." },
  { role: "SECRETARY", module: "Agenda / Letters / Approval", source: "direksi governance collections", collections: ["meeting_requests", "meeting_agendas", "meeting_action_items", "letters", "approval_requests", "notifications"], databaseTarget: "direksi", mode: "REALTIME SUBSET", status: "WAJAR", costPosture: "SEIMBANG", implementation: "DONE", purpose: "Workflow governance memang wajar tetap realtime." },
];

const modeTone: Record<MatrixRow["mode"], string> = {
  SUMMARY: "bg-emerald-100 text-emerald-700",
  "REALTIME SUBSET": "bg-cyan-100 text-cyan-700",
  HYBRID: "bg-amber-100 text-amber-700",
  "ON-DEMAND": "bg-violet-100 text-violet-700",
  "DETAIL REALTIME": "bg-slate-200 text-slate-700",
};

const statusTone: Record<MatrixRow["status"], string> = {
  OPTIMAL: "bg-emerald-100 text-emerald-700",
  WAJAR: "bg-amber-100 text-amber-700",
  HYBRID: "bg-sky-100 text-sky-700",
};

const costTone: Record<MatrixRow["costPosture"], string> = {
  HEMAT: "bg-emerald-100 text-emerald-700",
  SEIMBANG: "bg-cyan-100 text-cyan-700",
  INVESTIGATIF: "bg-amber-100 text-amber-700",
};

const implementationTone: Record<MatrixRow["implementation"], string> = {
  DONE: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  NEXT: "bg-slate-200 text-slate-700",
};

const summaryCards = [
  { title: "Summary-First", value: matrixRows.filter((i) => i.mode === "SUMMARY").length, description: "Landing eksekutif yang membaca cache singleton di direksi." },
  { title: "Realtime Subset", value: matrixRows.filter((i) => i.mode === "REALTIME SUBSET").length, description: "Listener hidup yang dibatasi hanya ke collection relevan." },
  { title: "Hybrid / On-Demand", value: matrixRows.filter((i) => i.mode === "HYBRID" || i.mode === "ON-DEMAND").length, description: "Akurat, tapi beban data dipindah ke mode manual atau campuran." },
  { title: "Optimal Modules", value: matrixRows.filter((i) => i.status === "OPTIMAL").length, description: "Modul yang sudah seimbang antara akurasi, kecepatan, dan biaya read." },
  { title: "Done", value: matrixRows.filter((i) => i.implementation === "DONE").length, description: "Modul yang sudah mengikuti rancangan optimasi terbaru." },
];

const roleGroups = Array.from(new Set(matrixRows.map((item) => item.role)));

export default function DirectorArchitectureMatrixPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-6 shadow-sm">
        <div className="max-w-4xl">
          <div className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-white">
            ERP Architecture Matrix
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Pemetaan formal sumber data, mode akses, dan status optimasi per role
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Matrix ini menjadi acuan teknis ERP `Rimo Food Direksi`: mana modul
            yang sudah summary-first, mana yang tetap realtime, mana yang hybrid,
            dan mana yang sengaja dipindah ke on-demand agar read tetap terkendali.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-3xl bg-white p-5 shadow">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{card.title}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.description}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl bg-white p-5 shadow">
        <h3 className="text-lg font-bold text-slate-900">Arsitektur Inti</h3>
        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 px-4 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">dbMain</div>
            <div className="mt-2 text-sm text-slate-700">Source of truth operasional utama. Struktur intinya tetap dijaga.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">direksi</div>
            <div className="mt-2 text-sm text-slate-700">Executive layer untuk governance, approvals, meetings, summaries, sync state, dan cache lintas divisi.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 px-4 py-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">On-Demand Reads</div>
            <div className="mt-2 text-sm text-slate-700">Dipakai untuk refresh summary, export snapshot, dan detail investigasi agar read besar tidak hidup terus.</div>
          </div>
        </div>
      </section>

      {roleGroups.map((role) => {
        const rows = matrixRows.filter((item) => item.role === role);
        return (
          <section key={role} className="rounded-3xl bg-white p-5 shadow">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{role}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Ringkasan mode data dan status optimasi untuk workspace {role.toLowerCase()}.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                {rows.length} modules
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full min-w-[1320px] text-sm">
                <thead className="border-b text-left text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Module</th>
                    <th className="py-3 pr-4 font-semibold">Source</th>
                    <th className="py-3 pr-4 font-semibold">Collections</th>
                    <th className="py-3 pr-4 font-semibold">Target</th>
                    <th className="py-3 pr-4 font-semibold">Mode</th>
                    <th className="py-3 pr-4 font-semibold">Cost</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Impl</th>
                    <th className="py-3 font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={`${row.role}-${row.module}`} className="border-b last:border-b-0">
                      <td className="py-4 pr-4 align-top font-semibold text-slate-900">{row.module}</td>
                      <td className="py-4 pr-4 align-top text-slate-600">{row.source}</td>
                      <td className="py-4 pr-4 align-top text-slate-600">
                        <div className="flex flex-wrap gap-2">
                          {row.collections.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">
                          {row.databaseTarget}
                        </span>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${modeTone[row.mode]}`}>{row.mode}</span>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${costTone[row.costPosture]}`}>{row.costPosture}</span>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${statusTone[row.status]}`}>{row.status}</span>
                      </td>
                      <td className="py-4 pr-4 align-top">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${implementationTone[row.implementation]}`}>{row.implementation}</span>
                      </td>
                      <td className="py-4 align-top text-slate-600">{row.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
