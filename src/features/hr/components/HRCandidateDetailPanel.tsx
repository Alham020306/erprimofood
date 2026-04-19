import { User, Phone, Mail, MapPin, Bike, Hash, CheckCircle, Clock, Ban } from "lucide-react";

type Props = {
  item: any | null;
};

const getStatusBadge = (item: any) => {
  if (item?.isBanned) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700">
        <Ban size={14} />
        REJECTED
      </span>
    );
  }
  if (item?.isVerified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle size={14} />
        VERIFIED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
      <Clock size={14} />
      PENDING
    </span>
  );
};

export default function HRCandidateDetailPanel({ item }: Props) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
      <div className="border-b border-slate-100 p-6">
        <h3 className="text-lg font-black text-slate-900">Candidate Details</h3>
        <p className="text-sm text-slate-500">
          {item ? "Review driver applicant information" : "Select a candidate to view details"}
        </p>
      </div>

      <div className="p-6">
        {!item ? (
          <div className="flex flex-col items-center gap-3 py-8 text-slate-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <User size={24} />
            </div>
            <p className="text-sm">No candidate selected</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Header */}
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <User size={22} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{item.name || "Unnamed"}</p>
                  <p className="text-xs text-slate-500">{item.vehicleBrand || "No Vehicle"}</p>
                </div>
              </div>
              {getStatusBadge(item)}
            </div>

            {/* Detail Grid */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <Phone size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-semibold text-slate-900">{item.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <Mail size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-semibold text-slate-900">{item.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <MapPin size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Area</p>
                  <p className="font-semibold text-slate-900">{item.area || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <Bike size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Vehicle</p>
                  <p className="font-semibold text-slate-900">{item.vehicleBrand || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <Hash size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Plate Number</p>
                  <p className="font-semibold text-slate-900">{item.plateNumber || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <Clock size={18} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Online Status</p>
                  <p className="font-semibold text-slate-900">{item.isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}