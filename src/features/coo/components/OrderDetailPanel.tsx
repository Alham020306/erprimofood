type Props = {
  order: any | null;
};

const isValidOrder = (order: any) => {
  return order && Object.keys(order).length > 0;
};

const formatMoney = (value: any) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatTime = (value: any) =>
  value ? new Date(Number(value)).toLocaleString("id-ID") : "-";

const formatCoords = (value: any) => {
  if (!value || value.lat === undefined || value.lng === undefined) return "-";
  return `${value.lat}, ${value.lng}`;
};

export default function OrderDetailPanel({ order }: Props) {
  if (!isValidOrder(order)) {
    return (
      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-lg font-bold text-slate-900">Order Detail</h2>
        <p className="mt-3 text-sm text-slate-500">
          Pilih order untuk melihat timeline, identitas customer, merchant, driver,
          pembayaran, dan bukti transaksi.
        </p>
      </div>
    );
  }

  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const subtotal = Number(order.total || 0) - Number(order.deliveryFee || 0);

  return (
    <div className="rounded-3xl bg-white p-6 shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Order Command Detail
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">
            #{String(order.id || "-").slice(0, 10)}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {order.restaurantName || order.restaurantId || "-"} to{" "}
            {order.customerName || order.customerId || "-"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Status
          </p>
          <p className="mt-2 text-sm font-bold">{order.status || "UNKNOWN"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Order Value
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatMoney(order.total ?? order.totalPrice)}
          </p>
          <p className="mt-2 text-xs text-slate-500">{itemCount} items</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Delivery Fee
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatMoney(order.deliveryFee)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Distance {order.distanceKm || "-"} km
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Payment
          </p>
          <p className="mt-2 text-xl font-bold text-slate-900">
            {order.paymentMethod || "-"}
          </p>
          <p className="mt-2 text-xs text-slate-500">{order.type || "-"}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Customer
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>{order.customerName || order.customerId || "-"}</div>
            <div>{order.customerPhone || "-"}</div>
            <div>{order.customerAddress || order.customerLocation?.address || "-"}</div>
            <div>{formatCoords(order.customerLocation)}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Merchant
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>{order.restaurantName || order.restaurantId || "-"}</div>
            <div>{order.restaurantId || "-"}</div>
            <div>{formatCoords(order.restaurantLocation)}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Driver
          </p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div>{order.driverName || order.driverId || "-"}</div>
            <div>{order.driverPhone || "-"}</div>
            <div>
              {[order.driverVehicle, order.driverPlate].filter(Boolean).join(" | ") || "-"}
            </div>
            <div>{order.driverId || "-"}</div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Payment Summary
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold">{formatMoney(order.deliveryFee)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Original Delivery Fee</span>
              <span className="font-semibold">
                {formatMoney(order.originalDeliveryFee)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voucher Subsidy</span>
              <span className="font-semibold">{formatMoney(order.voucherSubsidy)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voucher Applied</span>
              <span className="font-semibold">{order.voucherApplied ? "YES" : "NO"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voucher Code</span>
              <span className="font-semibold">{order.appliedVoucherCode || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Admin Commission</span>
              <span className="font-semibold">{formatMoney(order.adminCommission)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Resto Earnings</span>
              <span className="font-semibold">{formatMoney(order.restoEarnings)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Driver Earnings</span>
              <span className="font-semibold">{formatMoney(order.driverEarnings)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Transfer & Settlement
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Reviewed</span>
              <span className="font-semibold">{order.isReviewed ? "YES" : "NO"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Earnings Distributed</span>
              <span className="font-semibold">
                {order.earningsDistributed ? "YES" : "NO"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Voucher Claim Status</span>
              <span className="font-semibold">{order.voucherClaimStatus || "-"}</span>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Bank Details
              </p>
              <div className="mt-3 space-y-2">
                <div>{order.bankDetails?.bankName || "-"}</div>
                <div>{order.bankDetails?.accountName || "-"}</div>
                <div>{order.bankDetails?.accountNumber || "-"}</div>
              </div>
            </div>
            {order.proofOfTransfer ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <img
                  src={order.proofOfTransfer}
                  alt="Proof of transfer"
                  className="h-48 w-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Tidak ada bukti transfer yang tercatat pada order ini.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Timeline
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-900">Created:</span>{" "}
            <span className="text-slate-600">{formatTime(order.timestamp)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-900">Accepted:</span>{" "}
            <span className="text-slate-600">{formatTime(order.acceptedAt)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-900">Picked Up:</span>{" "}
            <span className="text-slate-600">{formatTime(order.pickedUpAt)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
            <span className="font-semibold text-slate-900">Completed:</span>{" "}
            <span className="text-slate-600">{formatTime(order.completedAt)}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm md:col-span-2">
            <span className="font-semibold text-slate-900">Cancelled:</span>{" "}
            <span className="text-slate-600">
              {order.cancelledAt || order.cancelledBy || order.cancellationReason
                ? `${formatTime(order.cancelledAt)} | ${
                    order.cancelledBy || "SYSTEM"
                  } | ${order.cancellationReason || "-"}`
                : "-"}
            </span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm md:col-span-2">
            <span className="font-semibold text-slate-900">Updated:</span>{" "}
            <span className="text-slate-600">{formatTime(order.updatedAt)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Order Items
        </p>
        <div className="mt-4 space-y-3">
          {itemCount ? (
            order.items.map((item: any, index: number) => (
              <div
                key={`${item.id || item.name || "item"}-${index}`}
                className="rounded-2xl bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.name || "Unnamed item"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Qty {item.quantity || 0}
                      {item.note ? ` | Note: ${item.note}` : ""}
                    </p>
                    {Array.isArray(item.packageItems) && item.packageItems.length ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Package: {item.packageItems.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatMoney(item.price)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Belum ada item yang tercatat pada order ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
