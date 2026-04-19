import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: "emerald" | "blue" | "amber" | "rose" | "slate";
};

const toneMap = {
  emerald: "border-emerald-500/20 text-emerald-600/80",
  blue: "border-blue-500/20 text-blue-600/80",
  amber: "border-amber-500/20 text-amber-600/80",
  rose: "border-rose-500/20 text-rose-600/80",
  slate: "border-slate-500/20 text-slate-600/80",
};

const iconBgMap = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function HRMetricCard({ title, value, icon: Icon, tone = "emerald" }: Props) {
  return (
    <div className={`rounded-3xl border ${toneMap[tone]} bg-white p-5 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.2em]">
          {title}
        </p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBgMap[tone]}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <h2 className="mt-3 text-3xl font-bold text-slate-900">{value}</h2>
    </div>
  );
}