import LiveOpsFeed from "../../coo/components/LiveOpsFeed";
import LiveOpsIssuesPanel from "../../coo/components/LiveOpsIssuesPanel";
import LiveOpsStatusGrid from "../../coo/components/LiveOpsStatusGrid";
import { useAdminLiveBoard } from "../hooks/useAdminLiveBoard";
import { getMerchantOperationalMessage, isMerchantOperational } from "../../shared/utils/merchantOperationalStatus";

export default function AdminLiveBoardPage() {
  const { loading, board } = useAdminLiveBoard();

  const activeUsers = (board.users || []).filter((item: any) => {
    const role = String(item?.role || "").toUpperCase();
    if (role === "DRIVER") return item?.isOnline === true;
    if (role === "RESTAURANT") return isMerchantOperational(item);
    return false;
  });
  const readyWatch = [...(board.orders || [])]
    .filter((item: any) => {
      const status = String(item?.status || "").toUpperCase();
      return status === "READY" || status === "COOKING" || status === "PENDING";
    })
    .slice(0, 8);
  const merchantWatch = [...(board.restaurants || [])]
    .sort((a: any, b: any) => Number(b?.totalOrders || 0) - Number(a?.totalOrders || 0))
    .slice(0, 6);
  const driverWatch = [...(board.drivers || [])]
    .sort((a: any, b: any) => Number(b?.isOnline === true) - Number(a?.isOnline === true))
    .slice(0, 6);

  if (loading) return <div>Loading admin live board...</div>;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-700">
              Live Monitoring
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              Pantau merchant, driver, order, dan issue lapangan seperti command center operasional
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Board ini mengikuti karakter monitoring lama: cepat melihat bottleneck order,
              ketimpangan driver, merchant yang tutup, dan feed transaksi terbaru tanpa berpindah halaman.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:min-w-[320px]">
            <div className="rounded-2xl bg-white px-4 py-4 shadow">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Active Users
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{activeUsers.length}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-4 shadow">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Active Issues
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{board.issues.length}</p>
            </div>
          </div>
        </div>
      </section>

      <LiveOpsStatusGrid stats={board.stats} />

      <div className="grid gap-4 xl:grid-cols-2">
        <LiveOpsIssuesPanel issues={board.issues} />
        <LiveOpsFeed orders={board.orders} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl bg-white p-5 shadow">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Ready Queue Watch</h3>
            <p className="text-sm text-slate-500">
              Order yang paling butuh respon cepat dari operator.
            </p>
          </div>

          <div className="space-y-3">
            {readyWatch.map((order: any) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {order.restaurantName || order.restaurantId || "-"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {order.customerName || order.customerId || "-"} ·{" "}
                      {order.driverName || "driver belum assigned"}
                    </div>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    {order.status || "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Merchant Watchlist</h3>
            <p className="text-sm text-slate-500">
              Merchant yang paling sering muncul di operasi.
            </p>
          </div>

          <div className="space-y-3">
            {merchantWatch.map((merchant: any) => (
              <div key={merchant.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {merchant.name || merchant.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {merchant.address || "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {merchant.totalOrders || 0} orders
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {getMerchantOperationalMessage(merchant).toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900">Driver Watchlist</h3>
            <p className="text-sm text-slate-500">
              Pantau armada aktif dan akun yang perlu perhatian.
            </p>
          </div>

          <div className="space-y-3">
            {driverWatch.map((driver: any) => (
              <div key={driver.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {driver.name || driver.id}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {[driver.vehicleBrand, driver.plateNumber].filter(Boolean).join(" · ") || "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {driver.isOnline ? "ONLINE" : "OFFLINE"}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {driver.isVerified ? "verified" : "pending verify"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
