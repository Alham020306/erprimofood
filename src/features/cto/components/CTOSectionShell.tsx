type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function CTOSectionShell({ title, subtitle, children }: Props) {
  return (
    <div className="rounded-[28px] border border-cyan-500/20 bg-slate-950/88 p-5 shadow-[0_24px_90px_rgba(14,165,233,0.14)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
        <h2 className="text-lg font-bold text-cyan-300">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        ) : null}
        </div>
        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Live
        </div>
      </div>

      {children}
    </div>
  );
}
