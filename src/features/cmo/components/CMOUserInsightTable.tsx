type Props = {
  rows: any[];
};

export default function CMOUserInsightTable({ rows }: Props) {
  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">User Insights</h2>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Orders</th>
              <th>Total Spend</th>
              <th>Segment</th>
              <th>Churn Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-2 font-semibold text-slate-900">{item.name}</td>
                <td>{item.totalOrders}</td>
                <td>Rp {Number(item.totalSpend || 0).toLocaleString("id-ID")}</td>
                <td>{item.segment}</td>
                <td>{item.churnRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}