import { formatCurrency } from "../utils/formatters";

type Props = {
  data: { period: string; cashIn: number; cashOut: number; net: number }[];
};

export default function ReportsBreakdownTable({ data }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Reports Breakdown</h2>
        <p className="text-slate-500">Belum ada data report.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Reports Breakdown</h2>

      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <div key={item.period} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{item.period}</p>
            <div className="mt-3 grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Cash In</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(item.cashIn)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Cash Out</span>
                <span className="font-semibold text-red-700">{formatCurrency(item.cashOut)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Net</span>
                <span className={`font-semibold ${item.net >= 0 ? "text-blue-700" : "text-red-700"}`}>
                  {formatCurrency(item.net)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-auto md:block">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Period</th>
              <th>Cash In</th>
              <th>Cash Out</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.period} className="border-t">
                <td className="py-2 font-medium">{item.period}</td>
                <td className="text-emerald-700">{formatCurrency(item.cashIn)}</td>
                <td className="text-red-700">{formatCurrency(item.cashOut)}</td>
                <td className={item.net >= 0 ? "text-blue-700" : "text-red-700"}>
                  {formatCurrency(item.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
