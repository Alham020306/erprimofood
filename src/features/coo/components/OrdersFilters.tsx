type Props = {
  orderStatus: string;
  onOrderStatusChange: (value: string) => void;
  orderSort: string;
  onOrderSortChange: (value: string) => void;
};

export default function OrdersFilters({
  orderStatus,
  onOrderStatusChange,
  orderSort,
  onOrderSortChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}