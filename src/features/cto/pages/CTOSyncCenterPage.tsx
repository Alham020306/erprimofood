import { useMemo, useState } from "react";
import {
  getDefaultSyncTableDefinitions,
  isDefaultLiveSyncRunning,
  runIncrementalDefaultSync,
  seedDefaultSyncTables,
  startDefaultLiveSync,
  stopDefaultLiveSync,
} from "../../secretary/services/defaultSyncService";

export default function CTOSyncCenterPage() {
  const [runningAction, setRunningAction] = useState<
    "" | "seed" | "sync" | "live"
  >("");
  const [message, setMessage] = useState("");
  const [liveEnabled, setLiveEnabled] = useState(() => isDefaultLiveSyncRunning());

  const tables = useMemo(() => getDefaultSyncTableDefinitions(), []);

  const handleSeed = async () => {
    setRunningAction("seed");
    try {
      const result = await seedDefaultSyncTables();
      setMessage(
        `Berhasil menginisialisasi ${result.tableCount} collection target sync di database direksi.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Gagal membuat collection target sync.");
    } finally {
      setRunningAction("");
    }
  };

  const handleSyncNow = async () => {
    setRunningAction("sync");
    try {
      const result = await runIncrementalDefaultSync();
      setMessage(
        result.errors.length
          ? `Sync selesai dengan kendala. Baru: ${result.created}, update: ${result.updated}, skip: ${result.skipped}.`
          : `Sync incremental selesai. Baru: ${result.created}, update: ${result.updated}, skip: ${result.skipped}.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Gagal menjalankan sync incremental.");
    } finally {
      setRunningAction("");
    }
  };

  const handleToggleLive = async () => {
    setRunningAction("live");
    try {
      if (liveEnabled) {
        await stopDefaultLiveSync();
        setLiveEnabled(false);
        setMessage("Auto sync berhasil dimatikan.");
        return;
      }

      const result = await startDefaultLiveSync();
      setLiveEnabled(true);
      setMessage(
        result.alreadyRunning
          ? `Auto sync sudah aktif dengan ${result.listenerCount} listener.`
          : `Auto sync aktif dengan ${result.listenerCount} listener incremental.`
      );
    } catch (error: any) {
      setMessage(error?.message || "Gagal mengubah status auto sync.");
    } finally {
      setRunningAction("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-500/14 bg-slate-950/85 p-6 shadow-[0_20px_70px_rgba(6,182,212,0.12)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300/80">
              Default Sync Center
            </p>
            <h1 className="mt-2 text-3xl font-black text-white">
              Sinkronisasi dbMain ke Direksi
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Halaman ini dipakai untuk menginisialisasi collection target mirror
              `sync_*`, menjalankan sync incremental, dan mengatur auto sync.
              Sinkronisasi hanya menulis data baru atau berubah, tidak rewrite penuh.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Status auto sync saat ini:{" "}
              <span className={liveEnabled ? "text-emerald-300" : "text-amber-300"}>
                {liveEnabled ? "AKTIF" : "NONAKTIF"}
              </span>
            </p>
            {message ? <p className="mt-4 text-sm text-cyan-200">{message}</p> : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSeed}
              disabled={runningAction !== ""}
              className="rounded-2xl border border-indigo-300/30 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-200 disabled:opacity-60"
            >
              {runningAction === "seed" ? "Seeding..." : "Seed Sync Tables"}
            </button>
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={runningAction !== ""}
              className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-200 disabled:opacity-60"
            >
              {runningAction === "sync" ? "Syncing..." : "Sync Default Sekarang"}
            </button>
            <button
              type="button"
              onClick={handleToggleLive}
              disabled={runningAction !== ""}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-60 ${
                liveEnabled
                  ? "border border-amber-300/30 bg-amber-500/10 text-amber-200"
                  : "border border-emerald-300/30 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {runningAction === "live"
                ? "Updating..."
                : liveEnabled
                ? "Stop Auto Sync"
                : "Start Auto Sync"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-cyan-500/14 bg-slate-950/70 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300/80">
              Target Collections
            </p>
            <h2 className="mt-2 text-xl font-black text-white">
              Collection penampung sinkronisasi
            </h2>
          </div>
          <div className="rounded-2xl border border-cyan-500/14 bg-slate-900/80 px-4 py-3 text-sm font-semibold text-white">
            {tables.length} targets
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {tables.map((table) => (
            <div
              key={table.key}
              className="rounded-[1.5rem] border border-cyan-500/10 bg-slate-900/70 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
                  {table.kind}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-300">
                  {table.source}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-white">{table.target}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{table.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
