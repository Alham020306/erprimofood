type Props = {
  data: any[];
  onSelect?: (order: any) => void;
  selectedOrderId?: string | null;
};

const isValidOrder = (order: any) => {
  return order && Object.keys(order).length > 0;
};

const getStatusTone = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
    case "REJECTED":
      return "bg-rose-100 text-rose-700";
    case "READY":
    case "COOKING":
      return "bg-amber-100 text-amber-700";
    case "ON_DELIVERY":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function OrderTable({ data, onSelect, selectedOrderId }: Props) {
  const safeData = Array.isArray(data) ? data.filter(isValidOrder) : [];

  if (!safeData.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-bold mb-4">Orders</h2>
        <div>No orders</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Orders</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
          {safeData.length} records
        </span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Order</th>
              <th>Status</th>
              <th>Total</th>
              <th>Customer / Merchant</th>
              <th>Driver</th>
            </tr>
          </thead>

          <tbody>
            {safeData.slice(0, 20).map((o: any) => {
              const status = String(o.status ?? "NO STATUS").toUpperCase();
              const isSelected = selectedOrderId === o.id;

              return (
              <tr
                key={o.id}
                className={`border-t cursor-pointer transition hover:bg-slate-50 ${
                  isSelected ? "bg-orange-50/70" : ""
                }`}
                onClick={() => onSelect?.(o)}
              >
                <td className="py-3">
                  <div className="font-semibold text-slate-900">
                    #{String(o.id ?? "-").slice(0, 8)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.timestamp
                      ? new Date(Number(o.timestamp)).toLocaleString("id-ID")
                      : "-"}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                    {o.type ?? "ORDER"}
                  </div>
                </td>
                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getStatusTone(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </td>
                <td className="font-semibold text-slate-900">
                  Rp {Number(o.total ?? o.totalPrice ?? 0).toLocaleString("id-ID")}
                </td>
                <td>
                  <div className="font-medium text-slate-900">
                    {o.customerName ?? o.customerId ?? "-"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.restaurantName ?? o.restaurantId ?? "-"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {o.paymentMethod ?? "-"} · {o.distanceKm ?? "-"} km
                  </div>
                </td>
                <td>
                  <div className="font-medium text-slate-900">
                    {o.driverName ?? o.driverId ?? "-"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {o.driverPhone ?? "Kontak belum tersedia"}
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
