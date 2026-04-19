import SecretaryDatabaseSheetsPage from "../secretary/pages/SecretaryDatabaseSheetsPage";

type Props = {
  onGoLogin: () => void;
  onGoRegister: () => void;
};

export default function DirectorDatabaseSetupPage({
  onGoLogin,
  onGoRegister,
}: Props) {
  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#111827_0%,#0f172a_42%,#020617_100%)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl">
        <section className="relative overflow-hidden border-b border-white/10 px-6 py-8 md:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_30%)]" />

          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-orange-300 text-slate-950">
                  R
                </span>
                Rimo Food Direksi Setup
              </div>

              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
                Database Initialization
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white md:text-5xl">
                Siapkan database
                <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-orange-200 to-amber-200 bg-clip-text text-transparent">
                  direksi
                </span>
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
                Halaman ini dipakai untuk melakukan seed, reset, dan provision
                database ERP direksi yang baru. Idealnya dipakai setelah akun
                CTO awal tersedia, agar proses setup berikutnya lebih aman dan
                mudah dilanjutkan.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={onGoLogin}
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Ke Login
              </button>
              <button
                type="button"
                onClick={onGoRegister}
                className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/20"
              >
                Buat Akun CTO/Direksi
              </button>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100">
                Mode Setup Aktif
              </div>
            </div>
          </div>
        </section>

        <section className="p-4 md:p-6 lg:p-8">
          <SecretaryDatabaseSheetsPage />
        </section>
      </div>
    </div>
  );
}
