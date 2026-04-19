type Props = {
  merchantQuery: string;
  onMerchantQueryChange: (value: string) => void;
  merchantStatus: string;
  onMerchantStatusChange: (value: string) => void;
};

export default function OperationsMerchantFilters({
  merchantQuery,
  onMerchantQueryChange,
  merchantStatus,
  onMerchantStatusChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Cari Merchant
        </label>
        <input
          type="text"
          value={merchantQuery}
          onChange={(e) => onMerchantQueryChange(e.target.value)}
          placeholder="Nama merchant..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Status
        </label>
        <select
          value={merchantStatus}
          onChange={(e) => onMerchantStatusChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Semua</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>
    </div>
  );
}