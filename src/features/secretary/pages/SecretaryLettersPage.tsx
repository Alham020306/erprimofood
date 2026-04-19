import { useSecretaryLetters } from "../hooks/useSecretaryLetters";

type Props = {
  user: any;
};

const Card = ({ title, value }: { title: string; value: number }) => (
  <div className="rounded-2xl bg-white p-5 shadow">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

export default function SecretaryLettersPage({ user }: Props) {
  const {
    items,
    loading,
    summary,
    selectedLetter,
    setSelectedLetter,
    form,
    setForm,
    submitting,
    submit,
    setStatus,
  } = useSecretaryLetters({ user });

  if (loading) return <div>Loading secretary letters...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card title="Letters" value={summary.total} />
        <Card title="Draft" value={summary.draft} />
        <Card title="Submitted" value={summary.submitted} />
        <Card title="Archived" value={summary.archived} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow xl:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Letters Registry</h2>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">Subject</th>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t hover:bg-slate-50"
                    onClick={() => setSelectedLetter(item)}
                  >
                    <td className="py-3 font-medium">{item.subject || "-"}</td>
                    <td>{item.letterType || "-"}</td>
                    <td>{item.recipient || "-"}</td>
                    <td>{item.status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold text-slate-900">Create Letter</h2>

          <div className="mt-4 space-y-3">
            <select
              value={form.letterType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, letterType: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="INCOMING">INCOMING</option>
              <option value="OUTGOING">OUTGOING</option>
              <option value="INTERNAL_MEMO">INTERNAL_MEMO</option>
              <option value="DECREE">DECREE</option>
            </select>
            <input
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subject: event.target.value }))
              }
              placeholder="Subject"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <textarea
              value={form.summary}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, summary: event.target.value }))
              }
              placeholder="Summary"
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
            <select
              value={form.classification}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  classification: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="STRICTLY_CONFIDENTIAL">STRICTLY_CONFIDENTIAL</option>
            </select>
            <input
              value={form.recipient}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, recipient: event.target.value }))
              }
              placeholder="Recipient"
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Letter"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-slate-900">Selected Letter</h2>
        {!selectedLetter ? (
          <p className="mt-3 text-sm text-slate-500">
            Pilih surat untuk update status governance.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Subject:</span> {selectedLetter.subject}
              </div>
              <div>
                <span className="font-semibold">Type:</span> {selectedLetter.letterType}
              </div>
              <div>
                <span className="font-semibold">Recipient:</span> {selectedLetter.recipient}
              </div>
              <div>
                <span className="font-semibold">Classification:</span>{" "}
                {selectedLetter.classification}
              </div>
              <div>
                <span className="font-semibold">Summary:</span> {selectedLetter.summary}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setStatus("SUBMITTED")}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Submit Letter
              </button>
              <button
                type="button"
                onClick={() => setStatus("APPROVED")}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Approve Letter
              </button>
              <button
                type="button"
                onClick={() => setStatus("ARCHIVED")}
                className="rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white"
              >
                Archive Letter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
