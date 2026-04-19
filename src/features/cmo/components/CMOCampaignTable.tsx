type Props = {
  rows: any[];
  onSetStatus: (
    campaignId: string,
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "ENDED"
  ) => void;
};

export default function CMOCampaignTable({ rows, onSetStatus }: Props) {
  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Campaigns</h2>

      <div className="mt-4 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Title</th>
              <th>Type</th>
              <th>Target</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-2 font-semibold text-slate-900">{item.title}</td>
                <td>{item.type}</td>
                <td>{item.targetArea || item.targetType}</td>
                <td>{item.status}</td>
                <td>Rp {Number(item.budget || 0).toLocaleString("id-ID")}</td>
                <td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSetStatus(item.id, "ACTIVE")}
                      className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => onSetStatus(item.id, "PAUSED")}
                      className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
                    >
                      Pause
                    </button>
                    <button
                      onClick={() => onSetStatus(item.id, "ENDED")}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      End
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}