type Props = {
  data: any[];
  onSelect?: (approval: any) => void;
};

export default function ApprovalsTable({ data, onSelect }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow">
        <h2 className="mb-4 text-lg font-bold">Approvals</h2>
        <div>No approvals</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-4 text-lg font-bold">Approvals</h2>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item: any) => (
              <tr
                key={item.id}
                className="cursor-pointer border-t hover:bg-slate-50"
                onClick={() => onSelect?.(item)}
              >
                <td className="py-2 font-medium">{item.title ?? "-"}</td>
                <td>{item.requestType ?? "-"}</td>
                <td>{item.currentStatus ?? "-"}</td>
                <td>{item.priority ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}