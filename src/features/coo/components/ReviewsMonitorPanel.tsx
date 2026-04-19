type Props = {
  restaurantReviews: any[];
  driverReviews: any[];
};

const formatDate = (value: any) => {
  const time = Number(value || 0);
  if (!time) return "-";
  return new Date(time).toLocaleString("id-ID");
};

export default function ReviewsMonitorPanel({
  restaurantReviews,
  driverReviews,
}: Props) {
  const latestRestaurantReviews = [...restaurantReviews]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 5);

  const latestDriverReviews = [...driverReviews]
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
    .slice(0, 5);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900">Restaurant Reviews Monitor</h2>
        <div className="mt-4 space-y-3">
          {latestRestaurantReviews.length ? (
            latestRestaurantReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {review.restaurantId || review.restaurantName || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {review.customerName || review.customerId || "-"} • {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    Order {review.orderId || "-"}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{review.comment || "Tanpa komentar."}</p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              Belum ada review restoran terbaru.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900">Driver Reviews Monitor</h2>
        <div className="mt-4 space-y-3">
          {latestDriverReviews.length ? (
            latestDriverReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {review.driverId || "-"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {review.customerName || review.customerId || "-"} • {formatDate(review.createdAt)}
                    </div>
                  </div>
                  <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                    Rating {review.rating ?? "-"}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  Order {review.orderId || "-"} • Review driver terbaru untuk monitoring operasional.
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              Belum ada review driver terbaru.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
