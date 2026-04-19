type Props = {
  title: string;
  setTitle: (value: string) => void;
  type: "IN" | "OUT";
  setType: (value: "IN" | "OUT") => void;
  category: string;
  setCategory: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  date: string;
  setDate: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  submitting: boolean;
  submit: () => Promise<void>;
};

const defaultCategories = [
  "Operasional",
  "Penjualan",
  "Pendanaan",
  "Sewa",
  "Gaji",
  "Vendor",
  "Marketing",
  "Teknologi",
  "Maintenance",
  "Transport",
  "Reimbursement",
  "Lainnya",
];

export default function CFOTransactionComposer({
  title,
  setTitle,
  type,
  setType,
  category,
  setCategory,
  amount,
  setAmount,
  date,
  setDate,
  description,
  setDescription,
  submitting,
  submit,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <h2 className="mb-4 text-lg font-bold">Input Transaksi CFO</h2>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul transaksi"
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "IN" | "OUT")}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          >
            {defaultCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Nominal"
            className="rounded-xl border border-slate-300 px-4 py-3"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi transaksi"
          className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3"
        />

        <button
          disabled={submitting}
          onClick={submit}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {submitting ? "Menyimpan..." : "Simpan Transaksi"}
        </button>
      </div>
    </div>
  );
}