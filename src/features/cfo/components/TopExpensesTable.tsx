import { formatCurrency, formatDateOnly } from "../utils/formatters";

type Props = {
  data: any[];
  onSelect?: (item: any) => void;
};

export default function TopExpensesTable({ data, onSelect }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Top Expenses</h2>
        <p className="text-slate-500">Belum ada pengeluaran.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Top Expenses</h2>

      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect?.(item)}
            className="block w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">{item.title ?? "-"}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateOnly(item.date)}</p>
              </div>
              <span className="font-bold text-red-700">{formatCurrency(item.amount)}</span>
            </div>
            <div className="mt-3 text-sm text-slate-500">{item.category ?? "-"}</div>
          </button>
        ))}
      </div>

      <div className="hidden overflow-auto md:block">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Title</th>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect?.(item)}
                className="cursor-pointer border-t hover:bg-slate-50"
              >
                <td className="py-2 font-medium">{item.title ?? "-"}</td>
                <td>{formatDateOnly(item.date)}</td>
                <td>{item.category ?? "-"}</td>
                <td className="text-red-700">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
