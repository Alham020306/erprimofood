type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
};

export default function CTOTechMetricCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-[28px] border border-cyan-500/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-5 shadow-[0_20px_70px_rgba(59,130,246,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400/80">
        {title}
        </p>
        <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.85)]" />
      </div>
      <h2 className="mt-5 text-3xl font-bold text-white">{value}</h2>
      {subtitle ? (
        <p className="mt-3 text-xs text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}
