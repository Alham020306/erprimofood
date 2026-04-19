import { exportLedgerCsv } from "../utils/exportLedgerCsv";

type Props = {
  rows: any[];
};

export default function LedgerExportButton({ rows }: Props) {
  return (
    <button
      onClick={() => exportLedgerCsv(rows)}
      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Export CSV
    </button>
  );
}