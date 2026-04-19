type Props = {
  rows: any[];
};

export default function CMOGrowthOverview({ rows }: Props) {
  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Area Growth Signals</h2>
      <p className="mt-1 text-sm text-slate-500">
        Area-based demand and conversion signal.
      </p>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Area</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Merchants</th>
              <th>Signal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.area} className="border-t border-slate-100">
                <td className="py-2 font-semibold text-slate-900">{item.area}</td>
                <td>{item.orders}</td>
                <td>Rp {Number(item.revenue || 0).toLocaleString("id-ID")}</td>
                <td>{item.merchants}</td>
                <td>{item.signal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}