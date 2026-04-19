type Props = {
  rows: { date: string; orders: number; revenue: number }[];
};

export default function CMOGrowthCharts({ rows }: Props) {
  const maxOrders = Math.max(...rows.map((r) => r.orders), 1);
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 1);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Orders 14D</h2>
        <div className="mt-4 flex h-56 items-end gap-2">
          {rows.map((row) => (
            <div key={row.date} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-pink-500/80"
                style={{
                  height: `${Math.max((row.orders / maxOrders) * 180, 8)}px`,
                }}
                title={`${row.date}: ${row.orders} orders`}
              />
              <div className="text-[10px] text-slate-400">
                {row.date.slice(5)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Revenue 14D</h2>
        <div className="mt-4 flex h-56 items-end gap-2">
          {rows.map((row) => (
            <div key={row.date} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl bg-fuchsia-500/80"
                style={{
                  height: `${Math.max((row.revenue / maxRevenue) * 180, 8)}px`,
                }}
                title={`${row.date}: Rp ${Number(row.revenue).toLocaleString("id-ID")}`}
              />
              <div className="text-[10px] text-slate-400">
                {row.date.slice(5)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}