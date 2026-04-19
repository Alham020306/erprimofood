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

      <div className="overflow-auto">
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