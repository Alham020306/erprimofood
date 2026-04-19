type Props = {
  orders: any[];
  reviews: any[];
  driverReviews: any[];
};

const formatDate = (value: any) => {
  const time = Number(value || 0);
  if (!time) return "-";
  return new Date(time).toLocaleString("id-ID");
};

export default function CEOOperationsPanel({
  orders,
  reviews,
  driverReviews,
}: Props) {
  const latestOrders = [...orders]
    .sort((a, b) => Number(b.updatedAt || b.timestamp || 0) - Number(a.updatedAt || a.timestamp || 0))
    .slice(0, 5);

  const latestRestaurantReviews = [...reviews]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 3);

  const latestDriverReviews = [...driverReviews]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 3);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-3xl border bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Latest Operational Orders</h2>
        <div className="mt-4 space-y-3">
          {latestOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{order.restaurantName || "-"}</div>
                  <div className="text-xs text-slate-500">
                    {order.customerName || "-"} • {order.driverName || "-"}
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-600">{order.status || "-"}</div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {formatDate(order.updatedAt || order.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Restaurant Feedback</h2>
        <div className="mt-4 space-y-3">
          {latestRestaurantReviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="font-semibold text-slate-900">
                {review.customerName || review.customerId || "-"}
              </div>
              <div className="mt-2 text-sm text-slate-700">{review.comment || "Tanpa komentar."}</div>
              <div className="mt-2 text-xs text-slate-500">
                Order {review.orderId || "-"} • {formatDate(review.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Driver Feedback</h2>
        <div className="mt-4 space-y-3">
          {latestDriverReviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-slate-900">
                  Driver {review.driverId || "-"}
                </div>
                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {review.rating ?? "-"} / 5
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {review.customerName || review.customerId || "-"} • Order {review.orderId || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
