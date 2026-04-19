type Props = {
  items: any[];
  onSelect: (item: any) => void;
};

export default function ApprovalInboxTable({ items, onSelect }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Approval Inbox</h2>
        <p className="text-slate-500">Belum ada approval.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Approval Inbox</h2>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Requester</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect(item)}
                className="cursor-pointer border-t hover:bg-slate-50"
              >
                <td className="py-2 font-medium">{item.title ?? "-"}</td>
                <td>{item.requestType ?? "-"}</td>
                <td>{item.status ?? "-"}</td>
                <td>{item.priority ?? "-"}</td>
                <td>{item.requestedByName ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}