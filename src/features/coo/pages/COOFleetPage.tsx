import DriverTable from "../components/DriverTable";
import DriverDetailPanel from "../components/DriverDetailPanel";
import FleetFilters from "../components/FleetFilters";
import FleetSummaryCards from "../components/FleetSummaryCards";
import { useCOOFleet } from "../hooks/useCOOFleet";

type Props = {
  onOpenDriverOnboarding?: () => void;
};

export default function COOFleetPage({ onOpenDriverOnboarding }: Props) {
  const {
    loading,
    drivers,
    summary,
    driverQuery,
    setDriverQuery,
    driverStatus,
    setDriverStatus,
    selectedDriver,
    setSelectedDriver,
  } = useCOOFleet();

  if (loading) return <div>Loading COO fleet...</div>;

  return (
    <div className="space-y-6">
      {onOpenDriverOnboarding ? (
        <section className="rounded-[28px] border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-sky-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700">
                Driver Onboarding
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Kelola pendaftaran mitra driver dari workspace armada
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Buka form onboarding untuk membuat akun driver baru, menetapkan data kendaraan,
                dan menyiapkan proses verifikasi mitra sebelum aktif di lapangan.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenDriverOnboarding}
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500"
            >
              Tambah Driver / Daftarkan Mitra
            </button>
          </div>
        </section>
      ) : null}

      <FleetSummaryCards summary={summary} />

      <FleetFilters
        driverQuery={driverQuery}
        onDriverQueryChange={setDriverQuery}
        driverStatus={driverStatus}
        onDriverStatusChange={setDriverStatus}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <DriverTable data={drivers} onSelect={setSelectedDriver} />
        <DriverDetailPanel driver={selectedDriver} />
      </div>
    </div>
  );
}
