type Props = {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  requestType: string;
  setRequestType: (v: string) => void;
  targetRole: string;
  setTargetRole: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  files: File[];
  setFiles: (v: File[]) => void;
  submitting: boolean;
  submit: () => Promise<void>;
};

export default function ApprovalComposerForm(props: Props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    requestType,
    setRequestType,
    targetRole,
    setTargetRole,
    priority,
    setPriority,
    amount,
    setAmount,
    notes,
    setNotes,
    files,
    setFiles,
    submitting,
    submit,
  } = props;

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Buat Pengajuan</h2>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul pengajuan"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi"
          className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="GENERAL_REQUEST">GENERAL_REQUEST</option>
            <option value="FUND_REQUEST">FUND_REQUEST</option>
            <option value="TECH_REQUEST">TECH_REQUEST</option>
            <option value="MEETING_REQUEST">MEETING_REQUEST</option>
            <option value="ACCESS_REQUEST">ACCESS_REQUEST</option>
            <option value="BUDGET_REQUEST">BUDGET_REQUEST</option>
            <option value="OPS_ESCALATION">OPS_ESCALATION</option>
            <option value="DOCUMENT_APPROVAL">DOCUMENT_APPROVAL</option>
          </select>

          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="CEO">CEO</option>
            <option value="COO">COO</option>
            <option value="CTO">CTO</option>
            <option value="CFO">CFO</option>
            <option value="CMO">CMO</option>
            <option value="HR">HR</option>
            <option value="SECRETARY">SECRETARY</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="URGENT">URGENT</option>
          </select>
        </div>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Nominal (opsional)"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan lampiran / surat"
          className="min-h-[100px] w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <div className="space-y-1 text-sm text-slate-500">
          {files.map((file) => (
            <div key={`${file.name}-${file.size}`}>{file.name}</div>
          ))}
        </div>

        <button
          disabled={submitting}
          onClick={submit}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
        >
          {submitting ? "Submitting..." : "Submit Approval"}
        </button>
      </div>
    </div>
  );
}