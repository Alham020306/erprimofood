type Props = {
  orders: any[];
};

export default function LiveOpsFeed({ orders }: Props) {
  const recent = [...orders]
    .sort((a: any, b: any) => Number(b?.timestamp || 0) - Number(a?.timestamp || 0))
    .slice(0, 10);

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Recent Order Feed</h2>

      {!recent.length ? (
        <div>No live order feed</div>
      ) : (
        <div className="space-y-3">
          {recent.map((order: any) => (
            <div
              key={order.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  {order.id ?? "-"}
                </span>
                <span className="text-xs text-slate-500">
                  {order.status ?? "NO STATUS"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {order.customerName ?? order.customerId ?? "-"} •{" "}
                {order.restaurantName ?? order.restaurantId ?? "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}