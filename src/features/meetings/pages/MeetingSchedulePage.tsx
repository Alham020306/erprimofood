import { UserRole } from "../../../core/types/roles";
import { useMeetingSchedule } from "../hooks/useMeetingSchedule";

type Props = {
  user: any;
};

const Metric = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

export default function MeetingSchedulePage({ user }: Props) {
  const {
    agendas,
    myRequests,
    loading,
    requestForm,
    setRequestForm,
    requestSubmitting,
    submitRequest,
  } = useMeetingSchedule({ user });

  if (loading) return <div>Loading meeting schedule...</div>;

  const isSecretary = user?.primaryRole === UserRole.SECRETARY;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric title="Scheduled Meetings" value={agendas.length} />
        <Metric
          title="Upcoming This Week"
          value={agendas.filter((item) => item.status === "SCHEDULED").length}
        />
        <Metric title="My Requests" value={myRequests.length} />
        <Metric
          title="Awaiting Secretary"
          value={myRequests.filter((item) => item.status === "PENDING").length}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr,1fr]">
        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Director Meeting Schedule</h2>
          <p className="mt-1 text-sm text-slate-500">
            Semua direksi bisa melihat schedule meeting yang dibuat oleh Secretary.
          </p>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Meeting</th>
                  <th>Slot</th>
                  <th>Requested By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {agendas.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="py-3">
                      <div className="font-medium">{item.title || "-"}</div>
                      <div className="text-xs text-slate-500">{item.location || "-"}</div>
                    </td>
                    <td>
                      {item.meetingDate || "-"} {item.meetingTime || ""}
                    </td>
                    <td>
                      {item.requestedByName || "-"}
                      <div className="text-xs text-slate-500">{item.requestedByRole || "-"}</div>
                    </td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">
            {isSecretary ? "Secretary Intake" : "Request Meeting"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isSecretary
              ? "Pengajuan meeting dari direksi akan muncul di menu Agenda untuk dijadwalkan."
              : "Direksi lain bisa mengajukan meeting ke Secretary dengan preferensi waktu dan peserta."}
          </p>

          {isSecretary ? (
            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div>Secretary menjadi scheduler utama untuk seluruh meeting direksi.</div>
              <div>Gunakan menu `Agenda` untuk review request, menjadwalkan slot, dan membuat action item.</div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                value={requestForm.title}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Meeting title"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <textarea
                value={requestForm.purpose}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, purpose: event.target.value }))
                }
                placeholder="Purpose / discussion points"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="date"
                  value={requestForm.preferredDate}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      preferredDate: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
                <input
                  type="time"
                  value={requestForm.preferredTime}
                  onChange={(event) =>
                    setRequestForm((prev) => ({
                      ...prev,
                      preferredTime: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>
              <input
                value={requestForm.participants}
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    participants: event.target.value,
                  }))
                }
                placeholder="Participants roles, comma separated"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
              <button
                type="button"
                onClick={submitRequest}
                disabled={requestSubmitting}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {requestSubmitting ? "Submitting..." : "Submit to Secretary"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900">My Meeting Requests</h2>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Title</th>
                <th>Preferred Slot</th>
                <th>Status</th>
                <th>Linked Agenda</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="py-3 font-medium">{item.title || "-"}</td>
                  <td>
                    {item.preferredDate || "-"} {item.preferredTime || ""}
                  </td>
                  <td>{item.status || "-"}</td>
                  <td>{item.linkedAgendaId || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
