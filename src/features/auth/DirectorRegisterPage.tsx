import { FormEvent, useEffect, useState } from "react";
import { DirectorUser } from "../../core/types/auth";
import { UserRole } from "../../core/types/roles";
import {
  needsCTOApprovalForRegistration,
  registerDirector,
} from "./useCLevelAuth";

type Props = {
  onRegistered: (user: DirectorUser) => void;
  onGoLogin: () => void;
  onGoSetup: () => void;
};

const roleDescriptions: Record<UserRole, string> = {
  ADMIN: "Operator utama untuk merchant, driver, order tracking, live board, dan kontrol operasional harian.",
  CEO: "Strategi perusahaan, approvals penting, risk register, dan kontrol lintas divisi.",
  COO: "Operasional merchant, driver, order flow, dan service stability harian.",
  CFO: "Laporan keuangan, settlement, ledger, dan kontrol keuangan perusahaan.",
  CTO: "Health platform utama, sistem direksi, area operasional, backup, dan observability.",
  CMO: "Growth dashboard, campaign, commercial signal, banner, dan kualitas menu.",
  HR: "Internal users, recruitment, people control, dan tata kelola SDM perusahaan.",
  SECRETARY: "Meeting schedule, letters, agenda, dan koordinasi formal direksi.",
};

export default function DirectorRegisterPage({
  onRegistered,
  onGoLogin,
  onGoSetup,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ctoEmail, setCtoEmail] = useState("");
  const [ctoPassword, setCtoPassword] = useState("");
  const [primaryRole, setPrimaryRole] = useState<UserRole>(UserRole.COO);
  const [loading, setLoading] = useState(false);
  const [approvalCheckLoading, setApprovalCheckLoading] = useState(true);
  const [requiresCTOApproval, setRequiresCTOApproval] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadRequirement = async () => {
      try {
        const result = await needsCTOApprovalForRegistration();
        if (mounted) {
          setRequiresCTOApproval(result);
        }
      } catch {
        if (mounted) {
          setRequiresCTOApproval(false);
        }
      } finally {
        if (mounted) {
          setApprovalCheckLoading(false);
        }
      }
    };

    loadRequirement();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorText("");

    try {
      const user = await registerDirector({
        fullName,
        email,
        password,
        primaryRole,
        ctoEmail,
        ctoPassword,
      });
      onRegistered(user);
    } catch (error: any) {
      setErrorText(error?.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#111827_0%,#0f172a_50%,#020617_100%)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-[0_30px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl lg:min-h-[88vh] lg:flex-row">
        <section className="relative flex w-full flex-col justify-between overflow-hidden border-b border-white/10 p-8 lg:w-[50%] lg:border-b-0 lg:border-r lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.18),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.2),_transparent_34%)]" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-orange-300 text-slate-950">
                R
              </span>
              Rimo Food Board Registration
            </div>

            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
              Initialize Access
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-5xl xl:text-6xl">
              Siapkan akses direksi
              <span className="mt-2 block bg-gradient-to-r from-emerald-200 via-orange-200 to-amber-200 bg-clip-text text-transparent">
                Rimo Food
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
              Akun ini akan masuk ke executive ERP dan sekaligus dikenali oleh rules sistem
              utama Rimo Food sesuai role direksi yang dipilih.
            </p>
          </div>

          <div className="relative z-10 mt-10 space-y-4">
            {Object.values(UserRole).map((role) => (
              <div
                key={role}
                className={`rounded-[1.8rem] border p-5 transition ${
                  primaryRole === role
                    ? "border-orange-300/35 bg-orange-400/10"
                    : "border-white/10 bg-slate-950/35"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{role}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {roleDescriptions[role]}
                    </p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.2em] ${
                      primaryRole === role
                        ? "bg-orange-300 text-slate-950"
                        : "bg-white/10 text-slate-200"
                    }`}
                  >
                    {primaryRole === role ? "ACTIVE" : "ROLE"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex w-full items-center justify-center p-5 md:p-8 lg:w-[50%] lg:p-10">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/45 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.35)] md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
                  Director Setup
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">Register Direksi</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Buat akun direksi awal untuk menjalankan executive control layer Rimo Food.
                </p>
              </div>
              <div className="rounded-3xl border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-right">
                <div className="text-[11px] uppercase tracking-[0.25em] text-orange-200/80">
                  Primary Role
                </div>
                <div className="mt-2 text-sm font-semibold text-orange-100">{primaryRole}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Nama Lengkap</span>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama direksi"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
                <input
                  type="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
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
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Siapkan password direksi"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Role Utama</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/20"
                  value={primaryRole}
                  onChange={(e) => setPrimaryRole(e.target.value as UserRole)}
                >
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role} className="bg-slate-900 text-white">
                      {role}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm leading-6 text-slate-400">{roleDescriptions[primaryRole]}</p>
              </label>

              <div className="rounded-[1.8rem] border border-amber-300/20 bg-amber-400/10 p-4">
                {approvalCheckLoading ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-100/80">
                      Memeriksa Mode Registrasi
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Sistem sedang mengecek apakah database `direksi` sudah punya
                      akun CTO aktif.
                    </p>
                  </>
                ) : requiresCTOApproval ? (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-100/80">
                      Otorisasi CTO
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Karena akun CTO aktif sudah ada, registrasi direksi berikutnya
                      harus disetujui oleh CTO.
                    </p>

                    <div className="mt-4 space-y-4">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">
                          Email CTO
                        </span>
                        <input
                          type="email"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
                          value={ctoEmail}
                          onChange={(e) => setCtoEmail(e.target.value)}
                          placeholder="cto@rimofood.com"
                          required
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-200">
                          Password CTO
                        </span>
                        <input
                          type="password"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/20"
                          value={ctoPassword}
                          onChange={(e) => setCtoPassword(e.target.value)}
                          placeholder="Masukkan password akun CTO"
                          required
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-100/80">
                      Bootstrap Mode
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      Registrasi awal dibuka tanpa konfirmasi CTO karena belum ada
                      akun CTO aktif di database `direksi`. Setelah CTO tersedia,
                      form ini otomatis kembali meminta otorisasi CTO.
                    </p>
                  </>
                )}
              </div>

              {errorText ? (
                <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {errorText}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-300 via-lime-300 to-orange-300 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-[0_20px_40px_rgba(74,222,128,0.18)] transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Buat Akun Direksi"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-300">
              Sudah punya akun direksi?
              <button
                type="button"
                onClick={onGoLogin}
                className="ml-2 font-semibold text-emerald-200 transition hover:text-emerald-100"
              >
                Kembali ke login
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-4 text-sm text-amber-100">
              Mau langsung setup database `direksi` lebih dulu?
              <button
                type="button"
                onClick={onGoSetup}
                className="ml-2 font-semibold text-white transition hover:text-amber-50"
              >
                Buka halaman setup
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
