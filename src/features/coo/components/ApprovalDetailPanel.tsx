type Props = {
  approval: any | null;
};

export default function ApprovalDetailPanel({ approval }: Props) {
  if (!approval) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-3 text-lg font-bold">Approval Detail</h2>
        <p className="text-slate-500">Pilih approval untuk melihat detail.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Approval Detail</h2>

      <div className="space-y-2 text-sm">
        <div><span className="font-semibold">Title:</span> {approval.title ?? "-"}</div>
        <div><span className="font-semibold">Type:</span> {approval.requestType ?? "-"}</div>
        <div><span className="font-semibold">Status:</span> {approval.currentStatus ?? "-"}</div>
        <div><span className="font-semibold">Priority:</span> {approval.priority ?? "-"}</div>
        <div><span className="font-semibold">Requested By:</span> {approval.requestedBy ?? "-"}</div>
        <div><span className="font-semibold">Requester Role:</span> {approval.requesterRole ?? "-"}</div>
        <div><span className="font-semibold">Division:</span> {approval.ownerDivision ?? "-"}</div>
        <div><span className="font-semibold">Amount:</span> {approval.amount ?? "-"}</div>
        <div><span className="font-semibold">Description:</span> {approval.description ?? "-"}</div>
      </div>
    </div>
  );
}