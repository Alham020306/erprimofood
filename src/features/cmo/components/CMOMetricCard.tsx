type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
};

export default function CMOMetricCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-3xl border border-pink-500/20 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-500/80">
        {title}
      </p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">{value}</h2>
      {subtitle ? (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}