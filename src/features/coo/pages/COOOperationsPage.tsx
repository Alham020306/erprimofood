import MerchantTable from "../components/MerchantTable";
import MerchantDetailPanel from "../components/MerchantDetailPanel";
import OperationsMerchantFilters from "../components/OperationsMerchantFilters";
import OperationsSummaryCards from "../components/OperationsSummaryCards";
import { useCOOOperations } from "../hooks/useCOOOperations";

type Props = {
  onOpenMerchantOnboarding?: () => void;
};

export default function COOOperationsPage({ onOpenMerchantOnboarding }: Props) {
  const {
    loading,
    merchants,
    summary,
    merchantQuery,
    setMerchantQuery,
    merchantStatus,
    setMerchantStatus,
    selectedMerchant,
    setSelectedMerchant,
  } = useCOOOperations();

  if (loading) return <div>Loading COO operations...</div>;

  return (
    <div className="space-y-6">
      {onOpenMerchantOnboarding ? (
        <section className="rounded-[28px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                Merchant Onboarding
              </div>
              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                Buka pendaftaran mitra resto langsung dari control desk
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Gunakan onboarding merchant untuk membuat akun owner, menyimpan data restoran,
                dan menyiapkan calon mitra sebelum masuk ke operasi harian.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenMerchantOnboarding}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
            >
              Tambah Resto / Daftarkan Mitra
            </button>
          </div>
        </section>
      ) : null}

      <OperationsSummaryCards summary={summary} />

      <OperationsMerchantFilters
        merchantQuery={merchantQuery}
        onMerchantQueryChange={setMerchantQuery}
        merchantStatus={merchantStatus}
        onMerchantStatusChange={setMerchantStatus}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MerchantTable data={merchants} onSelect={setSelectedMerchant} />
        <MerchantDetailPanel merchant={selectedMerchant} />
      </div>
    </div>
  );
}
