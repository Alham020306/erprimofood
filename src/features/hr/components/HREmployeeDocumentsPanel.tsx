import { useState, useCallback, useEffect } from "react";
import { FileText, Image, Upload, X, Download, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import {
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  getAllEmployeeDocuments,
  EmployeeDocument,
  EmployeeDocumentType,
} from "../services/hrStorageService";

type Props = {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
};

export default function HREmployeeDocumentsPanel({ employeeId, employeeName, onClose }: Props) {
  const [documents, setDocuments] = useState<{ surat: EmployeeDocument[]; foto: EmployeeDocument[] }>({
    surat: [],
    foto: [],
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await getAllEmployeeDocuments(employeeId);
      setDocuments(docs);
    } catch (err: any) {
      setError(err?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFileUpload = async (type: EmployeeDocumentType, file: File) => {
    try {
      setUploading(true);
      setError("");
      await uploadEmployeeDocument(employeeId, type, file);
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteEmployeeDocument(path);
      await loadDocuments();
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const DocumentSection = ({ type, title, icon: Icon, items }: {
    type: EmployeeDocumentType;
    title: string;
    icon: typeof FileText;
    items: EmployeeDocument[];
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
            <Icon size={16} className="text-emerald-600" />
          </div>
          <h4 className="font-bold text-slate-900">{title}</h4>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {items.length}
          </span>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(type, file);
              e.target.value = "";
            }}
            disabled={uploading}
          />
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            uploading ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          }`}>
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload"}
          </div>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-slate-400">No {title.toLowerCase()} uploaded</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((doc) => (
            <div
              key={doc.path}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</p>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-emerald-600"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => handleDelete(doc.path)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <FileText size={20} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Employee Documents</h3>
                <p className="text-sm text-slate-500">{employeeName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Document Status Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`flex items-center gap-2 rounded-xl border p-3 ${
                  documents.surat.length > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}>
                  {documents.surat.length > 0 ? (
                    <CheckCircle size={18} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={18} className="text-slate-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Documents</p>
                    <p className={`text-sm font-bold ${documents.surat.length > 0 ? "text-emerald-700" : "text-slate-600"}`}>
                      {documents.surat.length > 0 ? "Complete" : "Missing"}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 rounded-xl border p-3 ${
                  documents.foto.length > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
                }`}>
                  {documents.foto.length > 0 ? (
                    <CheckCircle size={18} className="text-emerald-600" />
                  ) : (
                    <AlertCircle size={18} className="text-slate-400" />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Photo</p>
                    <p className={`text-sm font-bold ${documents.foto.length > 0 ? "text-emerald-700" : "text-slate-600"}`}>
                      {documents.foto.length > 0 ? "Complete" : "Missing"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Sections */}
              <DocumentSection
                type="surat"
                title="Administrative Documents"
                icon={FileText}
                items={documents.surat}
              />
              <DocumentSection
                type="foto"
                title="Photos"
                icon={Image}
                items={documents.foto}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6">
          <p className="text-xs text-slate-400">
            Storage path: <code className="rounded bg-slate-100 px-1 py-0.5">internal/karyawan/administrasi/{employeeId}/</code>
          </p>
        </div>
      </div>
    </div>
  );
}
