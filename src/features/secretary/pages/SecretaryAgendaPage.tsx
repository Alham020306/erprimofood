import { UserRole } from "../../../core/types/roles";
import { useSecretaryAgenda } from "../hooks/useSecretaryAgenda";

type Props = {
  user: any;
};

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

export default function SecretaryAgendaPage({ user }: Props) {
  const {
    agendas,
    actionItems,
    meetingRequests,
    loading,
    summary,
    selectedAgenda,
    setSelectedAgenda,
    selectedActionItem,
    setSelectedActionItem,
    selectedRequest,
    setSelectedRequest,
    agendaForm,
    setAgendaForm,
    actionForm,
    setActionForm,
    agendaSubmitting,
    actionSubmitting,
    submitAgenda,
    submitActionItem,
    setAgendaStatus,
    setActionItemStatus,
    setRequestStatus,
    loadRequestIntoAgenda,
  } = useSecretaryAgenda({ user });

  if (loading) return <div>Loading secretary agenda...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card title="Agendas" value={summary.agendas} />
        <Card title="Scheduled" value={summary.scheduled} />
        <Card title="Finalized" value={summary.finalized} />
        <Card title="Requests" value={summary.pendingRequests} />
        <Card title="Open Actions" value={summary.openActions} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,1.6fr]">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Meeting Requests</h2>
          <p className="mt-1 text-sm text-slate-500">
            Semua pengajuan meeting dari direksi masuk ke Secretary untuk dijadwalkan.
          </p>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Requester</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {meetingRequests.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedRequest(item)}
                  >
                    <td className="py-3 font-medium">{item.title || "-"}</td>
                    <td>{item.requestedByRole || "-"}</td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Schedule Meeting</h2>
              <p className="mt-1 text-sm text-slate-500">
                Secretary menjadwalkan meeting dan sistem menyimpan siapa pengajunya.
              </p>
            </div>
            {selectedRequest ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                Request aktif: {selectedRequest.requestedByName || "-"}
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={agendaForm.title}
              onChange={(event) =>
                setAgendaForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Agenda title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                type="date"
                value={agendaForm.meetingDate}
                onChange={(event) =>
                  setAgendaForm((prev) => ({
                    ...prev,
                    meetingDate: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
              <input
                type="time"
                value={agendaForm.meetingTime}
                onChange={(event) =>
                  setAgendaForm((prev) => ({
                    ...prev,
                    meetingTime: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
            <input
              value={agendaForm.location}
              onChange={(event) =>
                setAgendaForm((prev) => ({ ...prev, location: event.target.value }))
              }
              placeholder="Location"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <input
              value={agendaForm.participants}
              onChange={(event) =>
                setAgendaForm((prev) => ({
                  ...prev,
                  participants: event.target.value,
                }))
              }
              placeholder="Participants role/uid, comma separated"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <button
              type="button"
              onClick={submitAgenda}
              disabled={agendaSubmitting}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {agendaSubmitting ? "Scheduling..." : "Schedule Meeting"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Meeting Calendar</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {agendas.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedAgenda(item)}
                  >
                    <td className="py-3 font-medium">{item.title || "-"}</td>
                    <td>
                      {item.meetingDate || "-"} {item.meetingTime || ""}
                    </td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Action Items</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Title</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {actionItems.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedActionItem(item)}
                  >
                    <td className="py-3 font-medium">{item.title || "-"}</td>
                    <td>{item.assignedToRole || "-"}</td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 space-y-3">
            <input
              value={actionForm.title}
              onChange={(event) =>
                setActionForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Action title"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <textarea
              value={actionForm.description}
              onChange={(event) =>
                setActionForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Description"
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={actionForm.assignedToRole}
                onChange={(event) =>
                  setActionForm((prev) => ({
                    ...prev,
                    assignedToRole: event.target.value,
                  }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              >
                {Object.values(UserRole).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={actionForm.dueDate}
                onChange={(event) =>
                  setActionForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
            <button
              type="button"
              onClick={submitActionItem}
              disabled={actionSubmitting}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {actionSubmitting ? "Creating..." : "Create Action Item"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Selected Request</h2>
          {!selectedRequest ? (
            <p className="mt-3 text-sm text-slate-500">
              Pilih request meeting untuk melihat pengaju dan menjadwalkannya.
            </p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Title:</span> {selectedRequest.title}
              </div>
              <div>
                <span className="font-semibold">Requested By:</span>{" "}
                {selectedRequest.requestedByName || "-"} ({selectedRequest.requestedByRole || "-"})
              </div>
              <div>
                <span className="font-semibold">Preferred Slot:</span>{" "}
                {selectedRequest.preferredDate || "-"} {selectedRequest.preferredTime || ""}
              </div>
              <div>
                <span className="font-semibold">Participants:</span>{" "}
                {Array.isArray(selectedRequest.participants)
                  ? selectedRequest.participants.join(", ")
                  : "-"}
              </div>
              <div>
                <span className="font-semibold">Purpose:</span>{" "}
                {selectedRequest.purpose || "-"}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => loadRequestIntoAgenda(selectedRequest)}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Load to Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatus("REVIEWING")}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Mark Reviewing
                </button>
                <button
                  type="button"
                  onClick={() => setRequestStatus("DECLINED")}
                  className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Decline
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Selected Agenda</h2>
          {!selectedAgenda ? (
            <p className="mt-3 text-sm text-slate-500">Pilih agenda untuk update status.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Title:</span> {selectedAgenda.title}
              </div>
              <div>
                <span className="font-semibold">Date:</span> {selectedAgenda.meetingDate}
              </div>
              <div>
                <span className="font-semibold">Time:</span> {selectedAgenda.meetingTime}
              </div>
              <div>
                <span className="font-semibold">Location:</span> {selectedAgenda.location}
              </div>
              <div>
                <span className="font-semibold">Requested By:</span>{" "}
                {selectedAgenda.requestedByName || "-"} ({selectedAgenda.requestedByRole || "-"})
              </div>
              <div>
                <span className="font-semibold">Scheduled By:</span>{" "}
                {selectedAgenda.scheduledByName || "-"}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAgendaStatus("FINALIZED")}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Finalize
                </button>
                <button
                  type="button"
                  onClick={() => setAgendaStatus("COMPLETED")}
                  className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white"
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Selected Action Item</h2>
          {!selectedActionItem ? (
            <p className="mt-3 text-sm text-slate-500">
              Pilih action item untuk update progres tindak lanjut.
            </p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="font-semibold">Title:</span> {selectedActionItem.title}
              </div>
              <div>
                <span className="font-semibold">Assigned Role:</span>{" "}
                {selectedActionItem.assignedToRole}
              </div>
              <div>
                <span className="font-semibold">Due Date:</span>{" "}
                {selectedActionItem.dueDate || "-"}
              </div>
              <div>
                <span className="font-semibold">Description:</span>{" "}
                {selectedActionItem.description || "-"}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActionItemStatus("IN_PROGRESS")}
                  className="rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Start Progress
                </button>
                <button
                  type="button"
                  onClick={() => setActionItemStatus("DONE")}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Mark Done
                </button>
                <button
                  type="button"
                  onClick={() => setActionItemStatus("OVERDUE")}
                  className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  Mark Overdue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
