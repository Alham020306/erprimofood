import CFOFinancialDashboardPage from "../../cfo/pages/CFOFinancialDashboardPage";

export default function AdminRevenuePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
            Revenue Desk
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">
            Laporan Keuangan Komprehensif
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Income Statement, Balance Sheet, dan analisis finansial dengan data tersinkronisasi harian.
            Semua metrics real dari database Direksi dan Default.
          </p>
        </div>
      </section>

      <CFOFinancialDashboardPage />
    </div>
  );
}
