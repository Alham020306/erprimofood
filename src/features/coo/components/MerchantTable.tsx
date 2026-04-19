type Props = {
  data: any[];
  onSelect?: (merchant: any) => void;
};

export default function MerchantTable({ data, onSelect }: Props) {
  if (!data.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-bold mb-4">Merchants</h2>
        <div>No merchants</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <h2 className="text-lg font-bold mb-4">Merchants</h2>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Rating</th>
              <th>Orders</th>
            </tr>
          </thead>

          <tbody>
            {data.map((r: any) => {
              const isOpen = r?.isOpen ?? true;

              return (
                <tr
                  key={r.id}
                  className="border-t cursor-pointer hover:bg-slate-50"
                  onClick={() => onSelect?.(r)}
                >
                  <td className="py-2 font-medium">{r.name}</td>
                  <td>
                    {isOpen ? (
                      <span className="text-green-600">Open</span>
                    ) : (
                      <span className="text-red-500">Closed</span>
                    )}
                  </td>
                  <td>{r?.isVerified ? "Yes" : "No"}</td>
                  <td>{r.rating ?? "-"}</td>
                  <td>{r.totalOrders ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
