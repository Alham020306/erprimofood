type Props = {
  driver: any | null;
  orders?: any[];
  reviews?: any[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function DriverDetailPanel({
  driver,
  orders = [],
  reviews = [],
}: Props) {
  if (!driver) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold mb-3">Driver Detail</h2>
        <p className="text-slate-500">Pilih driver untuk melihat detail.</p>
      </div>
    );
  }

  const driverOrders = orders.filter(
    (order: any) => String(order?.driverId || "") === String(driver?.id || "")
  );
  const completedOrders = driverOrders.filter(
    (order: any) => String(order?.status || "").toUpperCase() === "COMPLETED"
  );
  const activeOrders = driverOrders.filter((order: any) =>
    ["ACCEPTED", "ON_THE_WAY", "PICKED_UP"].includes(
      String(order?.status || "").toUpperCase()
    )
  );
  const cancelledOrders = driverOrders.filter(
    (order: any) => String(order?.status || "").toUpperCase() === "CANCELLED"
  );
  const driverReviews = reviews.filter(
    (review: any) => String(review?.driverId || "") === String(driver?.id || "")
  );
  const rating =
    driverReviews.length > 0
      ? (
          driverReviews.reduce(
            (sum: number, review: any) => sum + Number(review?.rating || 0),
            0
          ) / driverReviews.length
        ).toFixed(1)
      : "-";
  const earnings = completedOrders.reduce(
    (sum: number, order: any) => sum + Number(order?.driverEarnings || 0),
    0
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-lg font-bold mb-4">Driver Detail</h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Completed
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{completedOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Active Trips
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{activeOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Driver Earnings
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(earnings)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Review Score
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{rating}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div><span className="font-semibold">Nama:</span> {driver.name ?? "-"}</div>
        <div><span className="font-semibold">Email:</span> {driver.email ?? "-"}</div>
        <div><span className="font-semibold">Phone:</span> {driver.phone ?? "-"}</div>
        <div>
          <span className="font-semibold">Status:</span>{" "}
          {driver.isOnline ? "Online" : "Offline"}
        </div>
        <div><span className="font-semibold">Vehicle:</span> {driver.vehicleBrand ?? "-"}</div>
        <div><span className="font-semibold">Plate:</span> {driver.plateNumber ?? "-"}</div>
        <div><span className="font-semibold">Balance:</span> {driver.balance ?? 0}</div>
        <div><span className="font-semibold">Unpaid Commission:</span> {driver.totalUnpaidCommission ?? 0}</div>
        <div><span className="font-semibold">Verified:</span> {driver.isVerified ? "Yes" : "No"}</div>
        <div><span className="font-semibold">Token Verified:</span> {driver.isTokenVerified ? "Yes" : "No"}</div>
        <div><span className="font-semibold">Phone Verified:</span> {driver.phoneVerified ? "Yes" : "No"}</div>
        <div><span className="font-semibold">Banned:</span> {driver.isBanned ? "Yes" : "No"}</div>
        <div><span className="font-semibold">Cancelled Trips:</span> {cancelledOrders.length}</div>
        <div><span className="font-semibold">Driver Reviews:</span> {driverReviews.length}</div>
        <div><span className="font-semibold">Last Seen Version:</span> {driver.lastSeenVersion ?? "-"}</div>
      </div>
    </div>
  );
}
