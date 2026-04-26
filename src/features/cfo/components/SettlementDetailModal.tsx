import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import {
  X,
  CheckCircle,
  AlertCircle,
  Package,
  Eye,
  CreditCard,
  User,
  Store,
  Truck,
  Clock3,
} from "lucide-react";
import { dbCLevel } from "../../../core/firebase/firebaseCLevel";
import { formatCurrency } from "../utils/formatters";

type Order = {
  id: string;
  orderId: string;
  amount: number;
  total?: number;
  orderTotal?: number;
  deliveryFee?: number;
  createdAt?: number;
  status?: string;
  paidAt?: any;
};

type SyncOrder = {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  restaurantName?: string;
  restaurantId?: string;
  driverName?: string;
  driverPhone?: string;
  driverVehicle?: string;
  driverPlate?: string;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  deliveryFee?: number;
  originalDeliveryFee?: number;
  voucherSubsidy?: number;
  adminCommission?: number;
  restaurantEarnings?: number;
  restoEarnings?: number;
  driverEarnings?: number;
  status?: string;
  timestamp?: number;
  acceptedAt?: number;
  pickedUpAt?: number;
  completedAt?: number;
  updatedAt?: number;
  itemPreview?: Array<{ name?: string; quantity?: number; price?: number }>;
  proofOfTransfer?: string | null;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  };
};

type EntitySummary = {
  entityId: string;
  entityName: string;
  commissionRate: number;
  totalUnpaid: number;
  totalPaid: number;
  unpaidCount: number;
  paidCount: number;
  orders: Order[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entity: EntitySummary | null;
  entityType: "RESTAURANT" | "DRIVER";
  commissionRates: {
    RESTAURANT: number;
    DRIVER: number;
  };
};

const formatOrderId = (id: string) => {
  if (!id) return "-";
  return id.substring(0, 8).toUpperCase();
};

const formatDate = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDateTime = (value?: number) =>
  value ? new Date(Number(value)).toLocaleString("id-ID") : "-";

const formatMoney = (value: any) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

function SyncOrderPreviewModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [syncOrder, setSyncOrder] = useState<SyncOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(dbCLevel, "sync_orders", orderId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setSyncOrder(null);
          setLoading(false);
          return;
        }

        setSyncOrder({
          id: snapshot.id,
          ...(snapshot.data() as Omit<SyncOrder, "id">),
        });
        setLoading(false);
      },
      () => {
        setSyncOrder(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const subtotal = Math.max(
    0,
    Number(syncOrder?.total || 0) - Number(syncOrder?.deliveryFee || 0)
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[28px] bg-slate-50 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Sync Transaction Detail
              </p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">
                Order #{String(syncOrder?.orderNumber || orderId).slice(0, 10)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Detail transaksi dibaca dari `direksi/sync_orders`.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500">
              Memuat detail transaksi...
            </div>
          ) : !syncOrder ? (
            <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500">
              Detail order belum tersedia di data sinkronisasi.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-500">
                    Total Order
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {formatMoney(syncOrder.total)}
                  </div>
                </div>
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">
                    Delivery Fee
                  </div>
                  <div className="mt-2 text-2xl font-black text-slate-900">
                    {formatMoney(syncOrder.deliveryFee)}
                  </div>
                </div>
                <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                    Payment
                  </div>
                  <div className="mt-2 text-lg font-black text-slate-900">
                    {syncOrder.paymentMethod || "-"}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {syncOrder.paymentStatus || "-"}
                  </div>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">
                    Status
                  </div>
                  <div className="mt-2 text-lg font-black text-slate-900">
                    {syncOrder.status || "-"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <User size={14} /> Customer
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-semibold text-slate-900">{syncOrder.customerName || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">{syncOrder.customerPhone || "-"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Address</div>
                      <div className="mt-2">{syncOrder.customerAddress || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Store size={14} /> Merchant
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-semibold text-slate-900">{syncOrder.restaurantName || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500 break-all">{syncOrder.restaurantId || "-"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Subtotal</div>
                      <div className="mt-2 font-semibold text-slate-900">{formatMoney(subtotal)}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Truck size={14} /> Driver
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="font-semibold text-slate-900">{syncOrder.driverName || "-"}</div>
                      <div className="mt-1 text-xs text-slate-500">{syncOrder.driverPhone || "-"}</div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Vehicle</div>
                      <div className="mt-2">
                        {[syncOrder.driverVehicle, syncOrder.driverPlate].filter(Boolean).join(" | ") || "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <CreditCard size={14} /> Payment Breakdown
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Subtotal", value: formatMoney(subtotal) },
                      { label: "Delivery Fee", value: formatMoney(syncOrder.deliveryFee) },
                      { label: "Original Delivery Fee", value: formatMoney(syncOrder.originalDeliveryFee) },
                      { label: "Voucher Subsidy", value: formatMoney(syncOrder.voucherSubsidy) },
                      { label: "Admin Commission", value: formatMoney(syncOrder.adminCommission) },
                      {
                        label: "Resto Earnings",
                        value: formatMoney(syncOrder.restaurantEarnings || syncOrder.restoEarnings),
                      },
                      { label: "Driver Earnings", value: formatMoney(syncOrder.driverEarnings) },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <span className="text-slate-600">{row.label}</span>
                        <span className="font-semibold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Clock3 size={14} /> Timeline & Transfer
                  </div>
                  <div className="mt-4 space-y-3">
                    {[
                      { label: "Created", value: formatDateTime(syncOrder.timestamp) },
                      { label: "Accepted", value: formatDateTime(syncOrder.acceptedAt) },
                      { label: "Picked Up", value: formatDateTime(syncOrder.pickedUpAt) },
                      { label: "Completed", value: formatDateTime(syncOrder.completedAt) },
                      { label: "Updated", value: formatDateTime(syncOrder.updatedAt) },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <span className="text-slate-600">{row.label}</span>
                        <span className="font-semibold text-slate-900">{row.value}</span>
                      </div>
                    ))}

                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        Bank Details
                      </div>
                      <div className="mt-3 space-y-1">
                        <div>{syncOrder.bankDetails?.bankName || "-"}</div>
                        <div>{syncOrder.bankDetails?.accountName || "-"}</div>
                        <div>{syncOrder.bankDetails?.accountNumber || "-"}</div>
                      </div>
                    </div>

                    {syncOrder.proofOfTransfer ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <img
                          src={syncOrder.proofOfTransfer}
                          alt="Proof of transfer"
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Tidak ada bukti transfer pada data sinkronisasi ini.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Order Items
                </div>
                <div className="mt-4 space-y-3">
                  {Array.isArray(syncOrder.itemPreview) && syncOrder.itemPreview.length ? (
                    syncOrder.itemPreview.map((item, index) => (
                      <div
                        key={`${item.name || "item"}-${index}`}
                        className="flex items-start justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">{item.name || "Item"}</div>
                          <div className="mt-1 text-xs text-slate-500">Qty {Number(item.quantity || 0)}</div>
                        </div>
                        <div className="font-semibold text-slate-900">{formatMoney(item.price)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Belum ada item yang tersedia di order sinkronisasi ini.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettlementDetailModal({
  isOpen,
  onClose,
  entity,
  entityType,
  commissionRates,
}: Props) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedOrderId(null);
    }
  }, [isOpen]);

  const sortByLatestDate = (a: Order, b: Order) =>
    Number(b.createdAt || 0) - Number(a.createdAt || 0);

  const unpaidOrders = useMemo(
    () => (entity?.orders || []).filter((o) => o.status !== "PAID").sort(sortByLatestDate),
    [entity]
  );
  const paidOrders = useMemo(
    () => (entity?.orders || []).filter((o) => o.status === "PAID").sort(sortByLatestDate),
    [entity]
  );

  if (!isOpen || !entity) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 border-b border-slate-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Detail Komisi - {entity.entityName}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {entityType === "RESTAURANT" ? "Restoran" : "Driver"} | {entity.orders.length} order
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 transition-colors hover:bg-slate-100"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-b border-slate-100 p-6">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-bold uppercase text-rose-600">Belum Dibayar</p>
              <p className="mt-1 text-xl font-black text-rose-700">{formatCurrency(entity.totalUnpaid)}</p>
              <p className="mt-1 text-xs text-rose-500">{entity.unpaidCount} order</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-bold uppercase text-emerald-600">Terbayar</p>
              <p className="mt-1 text-xl font-black text-emerald-700">{formatCurrency(entity.totalPaid)}</p>
              <p className="mt-1 text-xs text-emerald-500">{entity.paidCount} order</p>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-xs font-bold uppercase text-indigo-600">Total Komisi</p>
              <p className="mt-1 text-xl font-black text-indigo-700">
                {formatCurrency(entity.totalUnpaid + entity.totalPaid)}
              </p>
              <p className="mt-1 text-xs text-indigo-500">{entity.orders.length} order</p>
            </div>
          </div>

          {unpaidOrders.length > 0 && (
            <div className="border-b border-slate-100 p-6">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-rose-600">
                <AlertCircle size={16} /> Order Belum Dibayar ({unpaidOrders.length})
              </h4>
              <div className="overflow-hidden rounded-xl border border-rose-200">
                <table className="w-full text-sm">
                  <thead className="bg-rose-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-rose-700">Order ID</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-rose-700">Komisi</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-rose-700">Status</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-rose-700">Tanggal</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-rose-700">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidOrders.slice(0, 50).map((order) => (
                      <tr key={order.id} className="border-t border-rose-100 hover:bg-rose-50/50">
                        <td className="px-3 py-3 font-mono text-xs text-slate-700">
                          {formatOrderId(order.orderId || order.id)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-rose-600">
                          {formatCurrency(order.amount || 0)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">
                            <AlertCircle size={10} /> BELUM
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-slate-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(order.orderId)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            <Eye size={13} /> Lihat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {paidOrders.length > 0 && (
            <div className="p-6">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase text-emerald-600">
                <CheckCircle size={16} /> Order Terbayar ({paidOrders.length})
              </h4>
              <div className="overflow-hidden rounded-xl border border-emerald-200">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-emerald-700">Order ID</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-emerald-700">Komisi</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-emerald-700">Status</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-emerald-700">Tanggal</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-emerald-700">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidOrders.slice(0, 20).map((order) => (
                      <tr key={order.id} className="border-t border-emerald-100 hover:bg-emerald-50/50">
                        <td className="px-3 py-3 font-mono text-xs text-slate-700">
                          {formatOrderId(order.orderId || order.id)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-600">
                          {formatCurrency(order.amount || 0)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
                            <CheckCircle size={10} /> LUNAS
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-slate-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(order.orderId)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                          >
                            <Eye size={13} /> Lihat
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Total {entity.orders.length} order</span>
              <span>
                Komisi{" "}
                {`${Math.round(
                  (entity.commissionRate ||
                    (entityType === "RESTAURANT"
                      ? commissionRates.RESTAURANT
                      : commissionRates.DRIVER)) * 100
                )}%`}{" "}
                {entityType === "RESTAURANT" ? "dari restaurant" : "dari driver"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {selectedOrderId ? (
        <SyncOrderPreviewModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      ) : null}
    </>
  );
}
