import { UserRole } from "../../core/types/roles";

export type RoleTheme = {
  shell: string;
  sidebar: string;
  sidebarBorder: string;
  sidebarMuted: string;
  topbar: string;
  topbarBorder: string;
  topbarAccent: string;
  panel: string;
  accentText: string;
  accentSoft: string;
  activeNav: string;
  idleNav: string;
  roleLabel: string;
  headline: string;
};

export const roleThemes: Record<UserRole, RoleTheme> = {
  [UserRole.ADMIN]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.14),_transparent_30%),linear-gradient(180deg,_#fffaf5_0%,_#fff7ed_45%,_#f8fafc_100%)]",
    sidebar: "bg-white/82 backdrop-blur-xl",
    sidebarBorder: "border-orange-200/70",
    sidebarMuted: "text-orange-700/80",
    topbar: "bg-white/82 backdrop-blur-xl",
    topbarBorder: "border-orange-200/70",
    topbarAccent: "from-orange-500 via-amber-500 to-red-500",
    panel: "border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(249,115,22,0.08)]",
    accentText: "text-orange-700",
    accentSoft: "bg-gradient-to-r from-orange-500/15 to-amber-500/15",
    activeNav: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "Operations Admin",
    headline: "Hands-on control for merchants, drivers, orders, and live operations",
  },
  [UserRole.CEO]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.16),_transparent_32%),linear-gradient(180deg,_#fff7ed_0%,_#fffdf8_42%,_#f8fafc_100%)]",
    sidebar: "bg-white/80 backdrop-blur-xl",
    sidebarBorder: "border-amber-200/70",
    sidebarMuted: "text-amber-700/80",
    topbar: "bg-white/80 backdrop-blur-xl",
    topbarBorder: "border-amber-200/70",
    topbarAccent: "from-amber-500 via-orange-500 to-pink-500",
    panel: "border-white/70 bg-white/78 shadow-[0_24px_80px_rgba(245,158,11,0.08)]",
    accentText: "text-amber-700",
    accentSoft: "bg-gradient-to-r from-amber-500/15 to-pink-500/15",
    activeNav: "bg-gradient-to-r from-amber-500 to-pink-500 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "Executive Oversight",
    headline: "Strategic command for board-level decisions",
  },
  [UserRole.COO]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_30%),linear-gradient(180deg,_#f7fff9_0%,_#f8fafc_48%,_#eefbf3_100%)]",
    sidebar: "bg-white/82 backdrop-blur-xl",
    sidebarBorder: "border-emerald-200/70",
    sidebarMuted: "text-emerald-700/80",
    topbar: "bg-white/82 backdrop-blur-xl",
    topbarBorder: "border-emerald-200/70",
    topbarAccent: "from-emerald-500 via-teal-500 to-lime-500",
    panel: "border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(34,197,94,0.08)]",
    accentText: "text-emerald-700",
    accentSoft: "bg-gradient-to-r from-emerald-500/15 to-lime-500/15",
    activeNav: "bg-gradient-to-r from-emerald-500 to-lime-500 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "Operational Control",
    headline: "Realtime command layer for field operations",
  },
  [UserRole.CTO]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]",
    sidebar: "bg-slate-950/82 backdrop-blur-xl",
    sidebarBorder: "border-cyan-500/20",
    sidebarMuted: "text-cyan-300/70",
    topbar: "bg-slate-950/70 backdrop-blur-xl",
    topbarBorder: "border-cyan-500/20",
    topbarAccent: "from-cyan-400 via-sky-500 to-blue-500",
    panel: "border-cyan-500/16 bg-slate-950/76 shadow-[0_24px_90px_rgba(14,165,233,0.18)]",
    accentText: "text-cyan-300",
    accentSoft: "bg-gradient-to-r from-cyan-500/12 to-blue-500/12",
    activeNav: "bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_12px_40px_rgba(34,211,238,0.25)]",
    idleNav: "bg-slate-900/70 text-slate-200 hover:bg-slate-800/85",
    roleLabel: "Systems Command",
    headline: "Control, observe, and harden the platform core",
  },
  [UserRole.CFO]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_30%),linear-gradient(180deg,_#f7fbff_0%,_#eff6ff_45%,_#f8fafc_100%)]",
    sidebar: "bg-white/82 backdrop-blur-xl",
    sidebarBorder: "border-blue-200/70",
    sidebarMuted: "text-blue-700/80",
    topbar: "bg-white/82 backdrop-blur-xl",
    topbarBorder: "border-blue-200/70",
    topbarAccent: "from-blue-500 via-indigo-500 to-sky-500",
    panel: "border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(59,130,246,0.08)]",
    accentText: "text-blue-700",
    accentSoft: "bg-gradient-to-r from-blue-500/15 to-sky-500/15",
    activeNav: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "Financial Control",
    headline: "Precision, cash visibility, and settlement discipline",
  },
  [UserRole.CMO]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(236,72,153,0.14),_transparent_30%),linear-gradient(180deg,_#fff7fb_0%,_#fdf2f8_45%,_#fffaf0_100%)]",
    sidebar: "bg-white/82 backdrop-blur-xl",
    sidebarBorder: "border-pink-200/70",
    sidebarMuted: "text-pink-700/80",
    topbar: "bg-white/82 backdrop-blur-xl",
    topbarBorder: "border-pink-200/70",
    topbarAccent: "from-pink-500 via-rose-500 to-orange-400",
    panel: "border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(236,72,153,0.08)]",
    accentText: "text-pink-700",
    accentSoft: "bg-gradient-to-r from-pink-500/15 to-orange-400/15",
    activeNav: "bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "Growth Studio",
    headline: "Campaign command and customer momentum insights",
  },
  [UserRole.HR]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_30%),linear-gradient(180deg,_#f6fffb_0%,_#ecfdf5_45%,_#f8fafc_100%)]",
    sidebar: "bg-white/82 backdrop-blur-xl",
    sidebarBorder: "border-teal-200/70",
    sidebarMuted: "text-teal-700/80",
    topbar: "bg-white/82 backdrop-blur-xl",
    topbarBorder: "border-teal-200/70",
    topbarAccent: "from-teal-500 via-emerald-500 to-cyan-500",
    panel: "border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(16,185,129,0.08)]",
    accentText: "text-teal-700",
    accentSoft: "bg-gradient-to-r from-teal-500/15 to-cyan-500/15",
    activeNav: "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "People Operations",
    headline: "Talent, workforce, and internal governance visibility",
  },
  [UserRole.SECRETARY]: {
    shell:
      "bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.12),_transparent_30%),linear-gradient(180deg,_#faf7ff_0%,_#f5f3ff_45%,_#f8fafc_100%)]",
    sidebar: "bg-white/82 backdrop-blur-xl",
    sidebarBorder: "border-violet-200/70",
    sidebarMuted: "text-violet-700/80",
    topbar: "bg-white/82 backdrop-blur-xl",
    topbarBorder: "border-violet-200/70",
    topbarAccent: "from-violet-500 via-fuchsia-500 to-indigo-500",
    panel: "border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(168,85,247,0.08)]",
    accentText: "text-violet-700",
    accentSoft: "bg-gradient-to-r from-violet-500/15 to-indigo-500/15",
    activeNav: "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg",
    idleNav: "bg-white/60 text-slate-700 hover:bg-white/90",
    roleLabel: "Governance Desk",
    headline: "Letters, agendas, and executive follow-up coordination",
  },
};
