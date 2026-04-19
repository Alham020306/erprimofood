type Props = {
  loading: boolean;
  documents: any[];
  typeFilter: string;
  setTypeFilter: (v: string) => void;
};

export default function DocumentsLibraryPanel({
  loading,
  documents,
  typeFilter,
  setTypeFilter,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Documents Library</h2>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-2"
        >
          <option value="ALL">ALL</option>
          <option value="LETTER">LETTER</option>
          <option value="MEMO">MEMO</option>
          <option value="PROPOSAL">PROPOSAL</option>
          <option value="REPORT">REPORT</option>
          <option value="CONTRACT">CONTRACT</option>
          <option value="ATTACHMENT">ATTACHMENT</option>
          <option value="GENERAL">GENERAL</option>
        </select>
      </div>

      {loading ? (
        <div>Loading documents...</div>
      ) : !documents.length ? (
        <div className="text-slate-500">Belum ada dokumen.</div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <a
              key={doc.id}
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50"
            >
              <div className="font-semibold text-slate-900">{doc.title}</div>
              <div className="text-sm text-slate-500">
                {doc.documentType} • {doc.fileName}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}