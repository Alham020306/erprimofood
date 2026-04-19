type Props = {
  merchant: any | null;
  orders?: any[];
  reviews?: any[];
  menus?: any[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function MerchantDetailPanel({
  merchant,
  orders = [],
  reviews = [],
  menus = [],
}: Props) {
  if (!merchant) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold mb-3">Merchant Detail</h2>
        <p className="text-slate-500">Pilih merchant untuk melihat detail.</p>
      </div>
    );
  }

  const isOpen = merchant?.isOpen ?? true;
  const isBanned = merchant?.isBanned === true;
  const merchantId = merchant?.id ?? merchant?.ownerId;
  const merchantOrders = orders.filter(
    (order: any) => String(order?.restaurantId || "") === String(merchantId || "")
  );
  const completedOrders = merchantOrders.filter(
    (order: any) => String(order?.status || "").toUpperCase() === "COMPLETED"
  );
  const cancelledOrders = merchantOrders.filter(
    (order: any) => String(order?.status || "").toUpperCase() === "CANCELLED"
  );
  const merchantReviews = reviews.filter(
    (review: any) => String(review?.restaurantId || "") === String(merchantId || "")
  );
  const merchantMenus = menus.filter(
    (menu: any) => String(menu?.restaurantId || "") === String(merchantId || "")
  );
  const totalRevenue = completedOrders.reduce(
    (sum: number, order: any) => sum + Number(order?.total || 0),
    0
  );
  const averageRating =
    merchantReviews.length > 0
      ? (
          merchantReviews.reduce(
            (sum: number, review: any) => sum + Number(review?.rating || 0),
            0
          ) / merchantReviews.length
        ).toFixed(1)
      : merchant?.rating ?? "-";
  const latestReview = [...merchantReviews].sort(
    (a: any, b: any) => Number(b?.createdAt || 0) - Number(a?.createdAt || 0)
  )[0];
  const availableMenus = merchantMenus.filter((menu: any) => menu?.isAvailable !== false).length;
  const promoMenus = merchantMenus.filter((menu: any) => menu?.isPromo === true).length;

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="text-lg font-bold mb-4">Merchant Detail</h2>

      {merchant.image ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200">
          <img
            src={merchant.image}
            alt={merchant.name ?? "Merchant image"}
            className="h-44 w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Revenue
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Review Score
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{averageRating}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Completed
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{completedOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Cancelled
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">{cancelledOrders.length}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div><span className="font-semibold">Nama:</span> {merchant.name ?? "-"}</div>
        <div><span className="font-semibold">Account ID:</span> {merchant.ownerId ?? merchant.id ?? "-"}</div>
        <div><span className="font-semibold">Email:</span> {merchant.email ?? "-"}</div>
        <div><span className="font-semibold">Phone:</span> {merchant.phone ?? "-"}</div>
        <div><span className="font-semibold">Address:</span> {merchant.address ?? "-"}</div>
        <div><span className="font-semibold">Verified:</span> {merchant.isVerified ? "Yes" : "No"}</div>
        <div><span className="font-semibold">Token Verified:</span> {merchant.isTokenVerified ? "Yes" : "No"}</div>
        <div>
          <span className="font-semibold">Status:</span>{" "}
          {isBanned ? "Banned" : isOpen ? "Open" : "Closed"}
        </div>
        <div><span className="font-semibold">Rating:</span> {merchant.rating ?? "-"}</div>
        <div><span className="font-semibold">Total Orders:</span> {merchant.totalOrders ?? 0}</div>
        <div><span className="font-semibold">Balance:</span> {merchant.balance ?? 0}</div>
        <div><span className="font-semibold">Unpaid Commission:</span> {merchant.totalUnpaidCommission ?? 0}</div>
        <div><span className="font-semibold">Radius:</span> {merchant.serviceRadiusKm ?? "-"} km</div>
        <div><span className="font-semibold">Open Time:</span> {merchant.schedule?.openTime ?? "-"}</div>
        <div><span className="font-semibold">Close Time:</span> {merchant.schedule?.closeTime ?? "-"}</div>
        <div><span className="font-semibold">Bank:</span> {merchant.bankInfo?.bankName ?? "-"}</div>
        <div><span className="font-semibold">Account:</span> {merchant.bankInfo?.accountNumber ?? "-"}</div>
        <div><span className="font-semibold">Menus:</span> {merchantMenus.length}</div>
        <div><span className="font-semibold">Available Menus:</span> {availableMenus}</div>
        <div><span className="font-semibold">Promo Menus:</span> {promoMenus}</div>
        <div><span className="font-semibold">Reviews:</span> {merchantReviews.length}</div>
        <div>
          <span className="font-semibold">Latest Review:</span>{" "}
          {latestReview?.comment || latestReview?.customerName || "-"}
        </div>
      </div>
    </div>
  );
}
