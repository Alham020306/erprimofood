import { FormEvent, useState } from "react";
import { DirectorUser } from "../../core/types/auth";
import { loginDirector } from "./useCLevelAuth";

type Props = {
  onLogin: (user: DirectorUser) => void;
  onGoRegister: () => void;
};

const highlights = [
  "Executive control untuk seluruh divisi inti.",
  "Realtime signal merchant, driver, order, dan approval.",
  "Ruang kerja aman untuk direksi Rimo Food.",
];

export default function DirectorLoginPage({
  onLogin,
  onGoRegister,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");

    try {
      const user = await loginDirector(email, password);
      onLogin(user);
    } catch (error: any) {
      setErrorText(error?.message || "Login gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#020617_100%)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl lg:min-h-[88vh] lg:flex-row">
        <section className="relative flex w-full flex-col justify-between overflow-hidden border-b border-white/10 p-8 lg:w-[52%] lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.14),_transparent_28%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-sm font-semibold text-orange-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-amber-400 text-slate-950">
                R
              </span>
              Rimo Food Executive ERP
            </div>

            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.35em] text-orange-200/80">
              C-Level Access
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl xl:text-6xl">
              Kendalikan ritme operasional
              <span className="mt-2 block bg-gradient-to-r from-orange-300 via-amber-300 to-emerald-300 bg-clip-text text-transparent">
                Rimo Food
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
              Masuk ke panel direksi untuk mengawasi operasional food delivery, approval,
              governance, finance, meeting, dan health platform dalam satu workspace.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["CEO", "COO", "CTO", "CFO", "CMO", "HR", "SECRETARY"].map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-slate-200"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="rounded-[1.8rem] border border-white/10 bg-slate-950/35 p-5 text-sm leading-7 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full items-center justify-center p-5 md:p-8 lg:w-[48%] lg:p-10">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200/80">
                  Welcome Back
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">Login Direksi</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Gunakan akun direksi Rimo Food untuk masuk ke executive control layer.
                </p>
              </div>
              <div className="rounded-3xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-right">
                <div className="text-[11px] uppercase tracking-[0.25em] text-emerald-200/80">
                  Access
                </div>
                <div className="mt-2 text-sm font-semibold text-emerald-200">Secure</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-orange-300/50 focus:ring-2 focus:ring-orange-300/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="direksi@rimofood.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
                <input
                  type="password"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-orange-300/50 focus:ring-2 focus:ring-orange-300/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password akun direksi"
                  required
                />
              </label>

              {errorText ? (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorText}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-300 via-amber-400 to-emerald-300 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_20px_40px_rgba(251,146,60,0.2)] transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk ke Panel Direksi"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
              Belum punya akun direksi awal?
              <button
                type="button"
                onClick={onGoRegister}
                className="ml-2 font-semibold text-orange-200 transition hover:text-orange-100"
              >
                Buat akun sekarang
              </button>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
}
