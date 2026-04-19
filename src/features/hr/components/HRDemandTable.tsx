type Props = {
  rows: any[];
};

export default function HRDemandTable({ rows }: Props) {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Workforce Demand</h2>
      <p className="mt-1 text-sm text-slate-500">
        Area-based driver staffing recommendation.
      </p>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Area</th>
              <th>Drivers</th>
              <th>Verified</th>
              <th>Online</th>
              <th>Orders</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.area} className="border-t border-slate-100">
                <td className="py-2 font-semibold text-slate-900">{item.area}</td>
                <td>{item.drivers}</td>
                <td>{item.verifiedDrivers}</td>
                <td>{item.onlineDrivers}</td>
                <td>{item.orders}</td>
                <td>{item.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}