import { useState } from "react";

type Props = {
  approval: any | null;
  activityLogs: any[];
  onApprove: (note?: string) => Promise<void>;
  onReject: (note?: string) => Promise<void>;
  onRequestRevision: (note?: string) => Promise<void>;
};

export default function ApprovalDetailPanel({
  approval,
  activityLogs,
  onApprove,
  onReject,
  onRequestRevision,
}: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!approval) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Approval Detail</h2>
        <p className="text-slate-500">Pilih approval untuk melihat detail.</p>
      </div>
    );
  }

  const runAction = async (fn: (note?: string) => Promise<void>) => {
    setLoading(true);
    try {
      await fn(note);
      setNote("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Approval Detail</h2>

        <div className="space-y-2 text-sm">
          <div><span className="font-semibold">Title:</span> {approval.title ?? "-"}</div>
          <div><span className="font-semibold">Type:</span> {approval.requestType ?? "-"}</div>
          <div><span className="font-semibold">Status:</span> {approval.status ?? "-"}</div>
          <div><span className="font-semibold">Priority:</span> {approval.priority ?? "-"}</div>
          <div><span className="font-semibold">Requested By:</span> {approval.requestedByName ?? "-"}</div>
          <div><span className="font-semibold">Requester Role:</span> {approval.requestedByRole ?? "-"}</div>
          <div><span className="font-semibold">Target Role:</span> {approval.targetRole ?? "-"}</div>
          <div><span className="font-semibold">Amount:</span> {approval.amount ?? "-"}</div>
          <div><span className="font-semibold">Description:</span> {approval.description ?? "-"}</div>
        </div>

        <div className="mt-4">
          <h3 className="mb-2 font-semibold text-slate-900">Attachments</h3>
          {!approval.attachments?.length ? (
            <p className="text-sm text-slate-500">No attachments</p>
          ) : (
            <div className="space-y-2">
              {approval.attachments.map((file: any) => (
                <a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-slate-200 px-4 py-3 text-sm text-blue-600 hover:bg-slate-50"
                >
                  {file.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Action</h2>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tambahkan catatan..."
          className="mb-4 min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap gap-3">
          <button
            disabled={loading}
            onClick={() => runAction(onApprove)}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Approve
          </button>

          <button
            disabled={loading}
            onClick={() => runAction(onRequestRevision)}
            className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Request Revision
          </button>

          <button
            disabled={loading}
            onClick={() => runAction(onReject)}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Reject
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Activity Log</h2>

        {!activityLogs.length ? (
          <p className="text-sm text-slate-500">Belum ada log activity.</p>
        ) : (
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{log.action}</span>
                  <span className="text-xs text-slate-500">{log.actorRole}</span>
                </div>
                <div className="mt-1 text-sm text-slate-700">{log.actorName}</div>
                <div className="mt-1 text-sm text-slate-500">{log.note || "-"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}