type Props = {
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
};

export default function CFODashboardFilters({
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Dashboard Date From
        </label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Dashboard Date To
        </label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />
      </div>
    </div>
  );
}