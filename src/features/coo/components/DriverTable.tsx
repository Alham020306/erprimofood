type Props = {
  data: any[];
  onSelect?: (driver: any) => void;
};

export default function DriverTable({ data, onSelect }: Props) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-bold mb-4">Drivers</h2>
        <div>No drivers</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-lg font-bold mb-4">Drivers</h2>

      <table className="w-full text-sm">
        <thead className="text-left text-slate-500">
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Vehicle</th>
            <th>Unpaid</th>
          </tr>
        </thead>

        <tbody>
          {data.map((d: any) => (
            <tr
              key={d.id}
              className="border-t cursor-pointer hover:bg-slate-50"
              onClick={() => onSelect?.(d)}
            >
              <td className="py-2">{d.name}</td>
              <td>
                {d.isOnline ? (
                  <span className="text-green-600">Online</span>
                ) : (
                  <span className="text-red-400">Offline</span>
                )}
              </td>
              <td>{d.isVerified ? "Yes" : "No"}</td>
              <td>{d.vehicleBrand ?? "-"}</td>
              <td>{d.totalUnpaidCommission ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
