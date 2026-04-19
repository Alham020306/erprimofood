type Props = {
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: string[];
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
};

export default function CFOFilters({
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Type
        </label>
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="ALL">ALL</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
        </select>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Filter Category
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="ALL">ALL</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Date From
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
          Date To
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