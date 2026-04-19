import { Bike, CheckCircle, Clock, Ban, AlertCircle } from "lucide-react";

type Driver = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  isBanned?: boolean;
  vehicleBrand?: string;
  plateNumber?: string;
  createdAt?: number;
  lastUpdateCheck?: number;
};

type Props = {
  drivers: Driver[];
};

const getStatusIcon = (driver: Driver) => {
  if (driver.isBanned) return <Ban size={16} className="text-rose-500" />;
  if (driver.isOnline) return <Bike size={16} className="text-emerald-500" />;
  if (driver.isVerified) return <CheckCircle size={16} className="text-blue-500" />;
  return <Clock size={16} className="text-amber-500" />;
};

const getStatusText = (driver: Driver) => {
  if (driver.isBanned) return "Suspended";
  if (driver.isOnline) return "Online";
  if (driver.isVerified) return "Verified (Offline)";
  return "Pending";
};

const getStatusClass = (driver: Driver) => {
  if (driver.isBanned) return "bg-rose-100 text-rose-700";
  if (driver.isOnline) return "bg-emerald-100 text-emerald-700";
  if (driver.isVerified) return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

const formatTime = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function HRDriverFleetTable({ drivers }: Props) {
  const sortedDrivers = [...drivers].sort((a, b) => {
    // Online first, then verified, then pending, then banned
    const score = (d: Driver) => {
      if (d.isBanned) return 0;
      if (d.isOnline) return 3;
      if (d.isVerified) return 2;
      return 1;
    };
    return score(b) - score(a);
  });

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.26em] text-slate-400">
            Driver Management
          </div>
          <h3 className="mt-2 text-xl font-black text-slate-900">Driver Fleet</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span className="text-sm text-slate-500">{drivers.filter(d => d.isOnline).length} Online</span>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Driver
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Vehicle
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Last Active
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDrivers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle size={24} />
                      <p>Belum ada data driver</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusClass(driver)}`}>
                          {getStatusIcon(driver)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {driver.name || driver.email || "Unnamed Driver"}
                          </p>
                          <p className="text-xs text-slate-500">{driver.phone || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-700">
                        {driver.vehicleBrand || "-"}
                      </p>
                      <p className="text-xs text-slate-500">{driver.plateNumber || "-"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClass(driver)}`}>
                        {getStatusIcon(driver)}
                        {getStatusText(driver)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">
                        {formatTime(driver.lastUpdateCheck || driver.createdAt)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5">
          <Bike size={14} className="text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700">
            {drivers.filter(d => d.isOnline).length} Online
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5">
          <CheckCircle size={14} className="text-blue-600" />
          <span className="text-xs font-semibold text-blue-700">
            {drivers.filter(d => d.isVerified && !d.isOnline).length} Verified Offline
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5">
          <Clock size={14} className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-700">
            {drivers.filter(d => !d.isVerified && !d.isBanned).length} Pending
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5">
          <Ban size={14} className="text-rose-600" />
          <span className="text-xs font-semibold text-rose-700">
            {drivers.filter(d => d.isBanned).length} Suspended
          </span>
        </div>
      </div>
    </section>
  );
}
