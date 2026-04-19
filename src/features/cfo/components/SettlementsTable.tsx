import { formatCurrency } from "../utils/formatters";

type Props = {
  data: any[];
  onSelect?: (item: any) => void;
};

export default function SettlementsTable({ data, onSelect }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Settlements</h2>
        <p className="text-slate-500">Belum ada data.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Settlements</h2>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th>Balance</th>
              <th>Unpaid Commission</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelect?.(item)}
                className="cursor-pointer border-t hover:bg-slate-50"
              >
                <td className="py-2 font-medium">{item.name ?? "-"}</td>
                <td>{formatCurrency(item.balance)}</td>
                <td className="text-amber-700">
                  {formatCurrency(item.totalUnpaidCommission)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}