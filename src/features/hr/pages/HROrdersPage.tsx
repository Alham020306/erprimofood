import { useEffect, useState } from "react";
import { Filter, Search } from "lucide-react";
import OrderTable from "../../coo/components/OrderTable";
import OrdersFilters from "../../coo/components/OrdersFilters";
import {
  hasGoogleMapsApiKey,
  loadGoogleMaps,
} from "../../shared/utils/googleMapsLoader";
import { useHROrders } from "../hooks/useHROrders";

const formatMoney = (value: any) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatTime = (value: any) =>
  value ? new Date(Number(value)).toLocaleString("id-ID") : "-";

const formatCoords = (value: any) => {
  if (!value || value.lat === undefined || value.lng === undefined) return "-";
  return `${value.lat}, ${value.lng}`;
};

const safeNumber = (value: any, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
    case "PENDING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const StatBlock = ({
  title,
  value,
  hint,
  dark = false,
}: {
  title: string;
  value: string;
  hint: string;
  dark?: boolean;
}) => (
  <div
    className={`relative overflow-hidden rounded-[2.5rem] p-8 shadow-xl ${
      dark ? "border border-slate-800 bg-slate-900 text-white" : "border border-slate-100 bg-white"
    }`}
  >
    <div
      className={`absolute right-0 top-0 h-32 w-32 rounded-full blur-[60px] ${
        dark ? "bg-emerald-500/20" : "bg-indigo-500/10"
      }`}
    />
    <div className="relative">
      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
        {title}
      </div>
      <div className={`mt-4 text-4xl font-black tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
        {value}
      </div>
      <div className={`mt-2 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{hint}</div>
    </div>
  </div>
);

export default function HROrdersPage() {
  const {
    loading,
    orders,
    summary,
    attentionOrders,
    searchQuery,
    setSearchQuery,
    orderStatus,
    setOrderStatus,
    orderSort,
    setOrderSort,
    selectedOrder,
    setSelectedOrder,
  } = useHROrders();

  const [activeTab, setActiveTab] = useState<"overview" | "payment" | "items" | "timeline">("overview");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const orderMapContainerId = "hr-order-detail-google-map";

  if (loading) return <div>Loading HR orders...</div>;

  const status = String(selectedOrder?.status ?? "NO STATUS").toUpperCase();
  const itemCount = Number(selectedOrder?.itemCount || selectedOrder?.items?.length || 0);
  const subtotal = Number(selectedOrder?.total || 0) - Number(selectedOrder?.deliveryFee || 0);
  const customerLat = safeNumber(selectedOrder?.customerLocation?.lat, 0);
  const customerLng = safeNumber(selectedOrder?.customerLocation?.lng, 0);
  const items = Array.isArray(selectedOrder?.items)
    ? selectedOrder.items
    : Array.isArray(selectedOrder?.itemPreview)
    ? selectedOrder.itemPreview
    : [];

  return (
    <div className="space-y-8 pb-20">
      <div className="grid gap-6 md:grid-cols-3">
        <StatBlock
          title="Total Transactions"
          value={String(summary.total || 0)}
          hint="Seluruh order sinkronisasi yang tersedia untuk tim HR."
          dark
        />
        <StatBlock
          title="Active Queue"
          value={String(summary.activeQueue || 0)}
          hint="Order aktif yang masih bergerak di operasional."
        />
        <StatBlock
          title="Attention Queue"
          value={String(attentionOrders.length)}
          hint="Order yang perlu perhatian cepat dari sisi people ops."
        />
      </div>

      <section className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-xl">
        <div className="border-b border-slate-100 p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500">
                <Filter size={20} />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                  HR Orders Mirror
                </div>
                <h2 className="mt-2 text-2xl font-black text-slate-900">
                  Filter Data
                </h2>
              </div>
            </div>

            <div className="flex w-full flex-col gap-4 xl:w-auto xl:flex-row xl:items-center">
              <div className="relative w-full xl:w-96">
                <Search
                  size={18}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari order, customer, merchant, driver..."
                  className="w-full rounded-2xl bg-slate-50 py-3.5 pl-12 pr-5 text-sm font-semibold text-slate-700 outline-none ring-2 ring-transparent transition focus:ring-slate-200"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-100 p-8">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                Priority Orders
              </div>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                Attention Queue
              </h3>
            </div>
            <div className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
              {attentionOrders.length} priority
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {attentionOrders.map((order: any) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelectedOrder(order)}
                className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {order.customerName || order.customerId || "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {order.restaurantName || order.restaurantId || "-"}
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700">
                    {order.status || "-"}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{order.driverName || "Driver belum ada"}</span>
                  <span>Rp {Number(order.total || 0).toLocaleString("id-ID")}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          <OrdersFilters
            orderStatus={orderStatus}
            onOrderStatusChange={setOrderStatus}
            orderSort={orderSort}
            onOrderSortChange={setOrderSort}
          />
          <div className="mt-4">
            <OrderTable
              data={orders}
              onSelect={setSelectedOrder}
              selectedOrderId={selectedOrder?.id || null}
            />
          </div>
        </div>
      </section>

      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Proof of transfer"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightboxSrc(null)}
            className="absolute right-6 top-6 rounded-xl bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white"
          >
            Tutup
          </button>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-slate-50 shadow-2xl">
            <div className="border-b border-slate-200 bg-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="truncate text-2xl font-black text-slate-900">
                      Order #{String(selectedOrder.orderNumber || selectedOrder.id || "-").slice(0, 10)}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getStatusTone(status)}`}>
                      {status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedOrder.restaurantName || selectedOrder.restaurantId || "-"}
                    {" -> "}
                    {selectedOrder.customerName || selectedOrder.customerId || "-"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Tutup
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              <div className="flex gap-6 border-b border-slate-200 pb-4">
                {(["overview", "payment", "items", "timeline"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm font-black uppercase tracking-[0.14em] transition ${
                      activeTab === tab
                        ? "border-b-2 border-sky-500 text-sky-600"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 grid-cols-3">
                    <div className="rounded-2xl bg-sky-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-400">Order Value</div>
                      <div className="mt-2 text-xl font-black text-slate-900">{formatMoney(selectedOrder.total)}</div>
                      <div className="mt-2 text-xs text-slate-500">{itemCount} items</div>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">Delivery Fee</div>
                      <div className="mt-2 text-xl font-black text-slate-900">{formatMoney(selectedOrder.deliveryFee)}</div>
                      <div className="mt-2 text-xs text-slate-500">{selectedOrder.distanceKm || "-"} km</div>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">Payment</div>
                      <div className="mt-2 text-xl font-black text-slate-900">{selectedOrder.paymentMethod || "-"}</div>
                      <div className="mt-2 text-xs text-slate-500">{selectedOrder.type || "-"}</div>
                    </div>
                  </div>

                  <div className="grid gap-4 grid-cols-3">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Customer</div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Name</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOrder.customerName || selectedOrder.customerId || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOrder.customerPhone || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Address</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOrder.customerAddress || selectedOrder.customerLocation?.address || "-"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Merchant</div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Name</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOrder.restaurantName || selectedOrder.restaurantId || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">ID</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900 break-all">{selectedOrder.restaurantId || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Coords</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{formatCoords(selectedOrder.restaurantLocation)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Driver</div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Name</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOrder.driverName || selectedOrder.driverId || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Phone</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{selectedOrder.driverPhone || "-"}</div>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Vehicle</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">{[selectedOrder.driverVehicle, selectedOrder.driverPlate].filter(Boolean).join(" | ") || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(customerLat !== 0 || customerLng !== 0) && (
                    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-100 px-5 py-4">
                        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery Location</div>
                      </div>
                      <div className="h-[300px] w-full">
                        {hasGoogleMapsApiKey() ? (
                          <OrderMapPreview containerId={orderMapContainerId} lat={customerLat} lng={customerLng} label={selectedOrder.customerName || "Customer"} />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-400">
                            Google Maps API key belum tersedia.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payment" && (
                <div className="mt-6 space-y-6">
                  <div className="grid gap-4 grid-cols-2">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Payment Summary</div>
                      <div className="mt-4 space-y-3">
                        {[
                          { label: "Subtotal", value: formatMoney(subtotal) },
                          { label: "Delivery Fee", value: formatMoney(selectedOrder.deliveryFee) },
                          { label: "Original Delivery Fee", value: formatMoney(selectedOrder.originalDeliveryFee) },
                          { label: "Voucher Subsidy", value: formatMoney(selectedOrder.voucherSubsidy) },
                          { label: "Voucher Applied", value: selectedOrder.voucherApplied ? "YES" : "NO" },
                          { label: "Voucher Code", value: selectedOrder.appliedVoucherCode || "-" },
                          { label: "Admin Commission", value: formatMoney(selectedOrder.adminCommission) },
                          { label: "Resto Earnings", value: formatMoney(selectedOrder.restaurantEarnings || selectedOrder.restoEarnings) },
                          { label: "Driver Earnings", value: formatMoney(selectedOrder.driverEarnings) },
                          { label: "Payment Method", value: selectedOrder.paymentMethod || "-" },
                          { label: "Payment Status", value: selectedOrder.paymentStatus || "-" },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                            <span className="text-slate-600">{row.label}</span>
                            <span className="font-semibold text-slate-900">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Transfer & Settlement</div>
                      <div className="mt-4 space-y-3">
                        {[
                          { label: "Reviewed", value: selectedOrder.isReviewed ? "YES" : "NO" },
                          { label: "Earnings Distributed", value: selectedOrder.earningsDistributed ? "YES" : "NO" },
                          { label: "Voucher Claim Status", value: selectedOrder.voucherClaimStatus || "-" },
                        ].map((row) => (
                          <div key={row.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                            <span className="text-slate-600">{row.label}</span>
                            <span className="font-semibold text-slate-900">{row.value}</span>
                          </div>
                        ))}

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Bank Details</div>
                          <div className="mt-3 space-y-2 text-sm text-slate-700">
                            <div>{selectedOrder.bankDetails?.bankName || "-"}</div>
                            <div>{selectedOrder.bankDetails?.accountName || "-"}</div>
                            <div>{selectedOrder.bankDetails?.accountNumber || "-"}</div>
                          </div>
                        </div>

                        {selectedOrder.proofOfTransfer ? (
                          <button
                            type="button"
                            onClick={() => setLightboxSrc(selectedOrder.proofOfTransfer)}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200"
                          >
                            <img
                              src={selectedOrder.proofOfTransfer}
                              alt="Proof of transfer"
                              className="h-48 w-full object-cover transition group-hover:brightness-75"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                              <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 opacity-0 transition group-hover:opacity-100">Lihat Gambar</span>
                            </div>
                          </button>
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            Tidak ada bukti transfer yang tercatat pada order sinkronisasi ini.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "items" && (
                <div className="mt-6 space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Order Items</div>
                    <div className="mt-4 space-y-3">
                      {items.length ? (
                        items.map((item: any, index: number) => (
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
                              </div>
                              <p className="text-sm font-bold text-slate-900">
                                {formatMoney(item.price)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          Belum ada item yang tercatat pada order sinkronisasi ini.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="mt-6 space-y-6">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Timeline</div>
                    <div className="mt-4 grid gap-3 grid-cols-2">
                      {[
                        { label: "Created", value: formatTime(selectedOrder.timestamp) },
                        { label: "Accepted", value: formatTime(selectedOrder.acceptedAt) },
                        { label: "Picked Up", value: formatTime(selectedOrder.pickedUpAt) },
                        { label: "Completed", value: formatTime(selectedOrder.completedAt) },
                        { label: "Updated", value: formatTime(selectedOrder.updatedAt) },
                      ].map((row) => (
                        <div key={row.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                          <span className="font-semibold text-slate-900">{row.label}:</span>{" "}
                          <span className="text-slate-600">{row.value}</span>
                        </div>
                      ))}
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm col-span-2">
                        <span className="font-semibold text-slate-900">Cancelled:</span>{" "}
                        <span className="text-slate-600">{selectedOrder.cancellationReason || "-"}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm col-span-2">
                        <span className="font-semibold text-slate-900">Cancelled By:</span>{" "}
                        <span className="text-slate-600">{selectedOrder.cancelledBy || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderMapPreview({ containerId, lat, lng, label }: { containerId: string; lat: number; lng: number; label: string }) {
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((google) => {
        if (!google || cancelled) return;
        const element = document.getElementById(containerId);
        if (!element) return;

        const map = new google.maps.Map(element, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new google.maps.Marker({
          position: { lat, lng },
          map,
          title: label,
        });
      })
      .catch(() => null);

    return () => {
      cancelled = true;
    };
  }, [containerId, lat, lng, label]);

  return <div id={containerId} className="h-full w-full" />;
}
