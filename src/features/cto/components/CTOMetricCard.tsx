type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
};

export default function CTOMetricCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{title}</p>
      <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
      {subtitle ? (
        <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );
}