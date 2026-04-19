import { formatCurrency, formatDateOnly, formatDateTime } from "../utils/formatters";

type Props = {
  item: any | null;
};

export default function LedgerDetailPanel({ item }: Props) {
  if (!item) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">Transaction Detail</h2>
        <p className="text-slate-500">Pilih transaksi untuk melihat detail.</p>
      </div>
    );
  }

  const isIn = String(item?.type || "").toUpperCase() === "IN";

  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Transaction Detail</h2>

      <div className="space-y-2 text-sm">
        <div><span className="font-semibold">Title:</span> {item.title ?? "-"}</div>
        <div><span className="font-semibold">Date:</span> {formatDateOnly(item.date)}</div>
        <div>
          <span className="font-semibold">Type:</span>{" "}
          <span className={isIn ? "text-emerald-700" : "text-red-700"}>
            {item.type ?? "-"}
          </span>
        </div>
        <div><span className="font-semibold">Category:</span> {item.category ?? "-"}</div>
        <div><span className="font-semibold">Amount:</span> {formatCurrency(item.amount)}</div>
        <div><span className="font-semibold">Processed By:</span> {item.processedBy ?? "-"}</div>
        <div><span className="font-semibold">Description:</span> {item.description ?? "-"}</div>
        <div><span className="font-semibold">Timestamp:</span> {formatDateTime(item.timestamp)}</div>
      </div>
    </div>
  );
}