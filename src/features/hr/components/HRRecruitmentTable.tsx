import { User, CheckCircle, Clock, AlertCircle } from "lucide-react";

type Props = {
  rows: any[];
  onSelect: (item: any) => void;
};

const getStatusStyle = (isVerified: boolean, isBanned: boolean) => {
  if (isBanned) return "bg-rose-100 text-rose-700";
  if (isVerified) return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
};

const getStatusText = (isVerified: boolean, isBanned: boolean) => {
  if (isBanned) return "REJECTED";
  if (isVerified) return "VERIFIED";
  return "PENDING";
};

export default function HRRecruitmentTable({ rows, onSelect }: Props) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <User size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Driver Candidates</h3>
            <p className="text-sm text-slate-500">{rows.length} candidates</p>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Candidate
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Area
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <AlertCircle size={24} />
                    <p className="text-sm">No candidates found</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onSelect(item)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getStatusStyle(item.isVerified, item.isBanned)}`}>
                        {item.isVerified ? <CheckCircle size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{item.name || "-"}</p>
                        <p className="text-xs text-slate-500">{item.vehicleBrand || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.phone || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.area || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getStatusStyle(item.isVerified, item.isBanned)}`}>
                      {getStatusText(item.isVerified, item.isBanned)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}