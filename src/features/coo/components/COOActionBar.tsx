type Props = {
  merchantStatus: string;
  onMerchantStatusChange: (value: string) => void;
  driverStatus: string;
  onDriverStatusChange: (value: string) => void;
  orderSort: string;
  onOrderSortChange: (value: string) => void;
  onResetSelection: () => void;
};

export default function COOActionBar({
  merchantStatus,
  onMerchantStatusChange,
  driverStatus,
  onDriverStatusChange,
  orderSort,
  onOrderSortChange,
  onResetSelection,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Merchant
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

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Driver
        </label>
        <select
          value={driverStatus}
          onChange={(e) => onDriverStatusChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Semua</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Urutkan Order
        </label>
        <select
          value={orderSort}
          onChange={(e) => onOrderSortChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="NEWEST">Terbaru</option>
          <option value="OLDEST">Terlama</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow flex items-end">
        <button
          onClick={onResetSelection}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Reset Detail Panel
        </button>
      </div>
    </div>
  );
}