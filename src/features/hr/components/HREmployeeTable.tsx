import { useState, useEffect, useCallback } from "react";
import { User, AlertCircle, FileText, CheckCircle2, XCircle, FolderOpen } from "lucide-react";
import { checkEmployeeHasDocuments } from "../services/hrStorageService";
import HREmployeeDocumentsPanel from "./HREmployeeDocumentsPanel";

type Props = {
  rows: any[];
};

const getStatusStyle = (status: string) => {
  const s = String(status || "").toUpperCase();
  if (s === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (s === "INACTIVE") return "bg-slate-100 text-slate-600";
  if (s === "SUSPENDED") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

type DocumentStatus = {
  hasSurat: boolean;
  hasFoto: boolean;
};

export default function HREmployeeTable({ rows }: Props) {
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, DocumentStatus>>({});
  const [loadingDocs, setLoadingDocs] = useState<Set<string>>(new Set());

  const loadDocumentStatus = useCallback(async (employeeId: string) => {
    if (!employeeId || docStatuses[employeeId]) return;

    setLoadingDocs((prev) => new Set(prev).add(employeeId));
    try {
      const status = await checkEmployeeHasDocuments(employeeId);
      setDocStatuses((prev) => ({ ...prev, [employeeId]: status }));
    } finally {
      setLoadingDocs((prev) => {
        const next = new Set(prev);
        next.delete(employeeId);
        return next;
      });
    }
  }, [docStatuses]);

  // Load document statuses for visible rows
  useEffect(() => {
    rows.forEach((row) => {
      if (row.id && !docStatuses[row.id] && !loadingDocs.has(row.id)) {
        loadDocumentStatus(row.id);
      }
    });
  }, [rows, docStatuses, loadingDocs, loadDocumentStatus]);

  const getDocStatusIcon = (employeeId: string) => {
    if (loadingDocs.has(employeeId)) {
      return <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-500" />;
    }
    const status = docStatuses[employeeId];
    if (!status) return <XCircle size={16} className="text-slate-300" />;

    const complete = status.hasSurat && status.hasFoto;
    const partial = status.hasSurat || status.hasFoto;

    if (complete) return <CheckCircle2 size={16} className="text-emerald-500" />;
    if (partial) return <FileText size={16} className="text-amber-500" />;
    return <XCircle size={16} className="text-slate-300" />;
  };

  const getDocStatusText = (employeeId: string) => {
    const status = docStatuses[employeeId];
    if (!status) return "Checking...";

    if (status.hasSurat && status.hasFoto) return "Complete";
    if (status.hasSurat) return "Docs only";
    if (status.hasFoto) return "Photo only";
    return "No docs";
  };

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <User size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Employee Directory</h3>
              <p className="text-sm text-slate-500">{rows.length} employees</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Documents
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <AlertCircle size={24} />
                      <p className="text-sm">No employees found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{item.name || "-"}</p>
                          <p className="text-xs text-slate-500">{item.email || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.department || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.role || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(item.status)}`}>
                        {item.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getDocStatusIcon(item.id)}
                        <span className="text-xs text-slate-500">{getDocStatusText(item.id)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedEmployee(item)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <FolderOpen size={14} />
                        Docs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedEmployee && (
        <HREmployeeDocumentsPanel
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name || selectedEmployee.email || "Unknown"}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
}