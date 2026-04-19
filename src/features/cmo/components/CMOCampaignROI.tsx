type Props = {
  rows: any[];
};

export default function CMOCampaignROI({ rows }: Props) {
  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Campaign ROI</h2>
      <p className="mt-1 text-sm text-slate-500">
        Basic attributable revenue and campaign return signal.
      </p>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Campaign</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>ROI</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-2 font-semibold text-slate-900">{item.title}</td>
                <td>{item.status}</td>
                <td>Rp {Number(item.budget || 0).toLocaleString("id-ID")}</td>
                <td>{item.attributedOrders || 0}</td>
                <td>Rp {Number(item.attributedRevenue || 0).toLocaleString("id-ID")}</td>
                <td
                  className={
                    Number(item.roi || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                  }
                >
                  {item.roi || 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}