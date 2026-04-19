type Props = {
  driverQuery: string;
  onDriverQueryChange: (value: string) => void;
  driverStatus: string;
  onDriverStatusChange: (value: string) => void;
};

export default function FleetFilters({
  driverQuery,
  onDriverQueryChange,
  driverStatus,
  onDriverStatusChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Cari Driver
        </label>
        <input
          type="text"
          value={driverQuery}
          onChange={(e) => onDriverQueryChange(e.target.value)}
          placeholder="Nama driver..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Status Driver
        </label>
        <select
          value={driverStatus}
          onChange={(e) => onDriverStatusChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">Semua</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
        </select>
      </div>
    </div>
  );
}