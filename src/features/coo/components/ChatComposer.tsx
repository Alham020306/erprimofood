type Props = {
  text: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatComposer({
  text,
  onTextChange,
  onSend,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow">
      <h2 className="mb-4 text-lg font-bold">Kirim Pesan</h2>

      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Tulis pesan COO..."
          className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={onSend}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}