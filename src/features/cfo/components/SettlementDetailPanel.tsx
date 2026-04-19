import { formatCurrency } from "../utils/formatters";

type Props = {
  item: any | null;
  entityType: "RESTAURANT" | "DRIVER";
};

export default function SettlementDetailPanel({ item, entityType }: Props) {
  if (!item) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Settlement Detail</h2>
        <p className="text-slate-500">Pilih data untuk melihat detail.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Settlement Detail</h2>

      <div className="space-y-2 text-sm">
        <div><span className="font-semibold">Entity Type:</span> {entityType}</div>
        <div><span className="font-semibold">Name:</span> {item.name ?? "-"}</div>
        <div><span className="font-semibold">Email:</span> {item.email ?? "-"}</div>
        <div><span className="font-semibold">Phone:</span> {item.phone ?? "-"}</div>
        <div><span className="font-semibold">Balance:</span> {formatCurrency(item.balance)}</div>
        <div>
          <span className="font-semibold">Unpaid Commission:</span>{" "}
          <span className="text-amber-700">
            {formatCurrency(item.totalUnpaidCommission)}
          </span>
        </div>
      </div>
    </div>
  );
}