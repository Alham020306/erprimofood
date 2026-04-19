type Props = {
  title: string;
  value: number | string;
};

export default function CEOMetricCard({ title, value }: Props) {
  return (
    <div className="rounded-3xl border border-violet-500/20 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600/80">
        {title}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">{value}</h2>
    </div>
  );
}