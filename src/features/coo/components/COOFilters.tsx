type Props = {
  merchantQuery: string;
  onMerchantQueryChange: (value: string) => void;
  driverQuery: string;
  onDriverQueryChange: (value: string) => void;
  orderStatus: string;
  onOrderStatusChange: (value: string) => void;
};

export default function COOFilters({
  merchantQuery,
  onMerchantQueryChange,
  driverQuery,
  onDriverQueryChange,
  orderStatus,
  onOrderStatusChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
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
          Cari Driver
        </label>
        <input
          type="text"
          value={driverQuery}
          onChange={(e) => onDriverQueryChange(e.target.value)}
          placeholder="Nama driver..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Status Order
        </label>
        <select
          value={orderStatus}
          onChange={(e) => onOrderStatusChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Semua</option>
          <option value="PENDING">PENDING</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="COOKING">COOKING</option>
          <option value="READY">READY</option>
          <option value="ON_DELIVERY">ON_DELIVERY</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>
    </div>
  );
}