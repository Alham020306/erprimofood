import { useEffect, useState } from "react";
import { Bell, LogOut, Menu, Sparkles } from "lucide-react";
import { UserRole } from "../../core/types/roles";
import { roleThemes } from "./roleTheme";

type Props = {
  title: string;
  userName: string;
  roleName: UserRole;
  onLogout: () => void;
  onOpenMenu?: () => void;
};

export default function Topbar({
  title,
  userName,
  roleName,
  onLogout,
  onOpenMenu,
}: Props) {
  const theme = roleThemes[roleName];
  const [now, setNow] = useState(() =>
    new Date().toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(
        new Date().toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      );
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <header
      className={`border-b px-4 py-4 sm:px-6 ${theme.topbar} ${theme.topbarBorder}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className={`inline-flex rounded-2xl border p-3 text-slate-500 transition hover:text-slate-900 lg:hidden ${theme.panel}`}
          >
            <Menu className="h-4 w-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${theme.topbarAccent}`} />
            <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${theme.accentText}`}>
              {theme.roleLabel}
            </p>
            </div>
            <h1 className="mt-2 text-xl font-bold text-white/95 md:text-2xl md:text-slate-900">
              {title}
            </h1>
            <p className="text-xs text-slate-400 md:text-slate-500">{theme.headline}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <div className={`hidden rounded-2xl border px-4 py-3 xl:block ${theme.panel}`}>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="h-4 w-4" />
              Live session
            </div>
            <div className="mt-1 text-sm font-semibold text-white md:text-slate-900">
              {now}
            </div>
          </div>

          <button
            type="button"
            className={`rounded-2xl border p-3 ${theme.panel} text-slate-500 transition hover:text-slate-900`}
          >
            <Bell className="h-4 w-4" />
          </button>

          <div className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 sm:flex-none ${theme.panel}`}>
            <p className="text-right text-sm font-semibold text-white/95 md:text-slate-900">
              {userName}
            </p>
            <p className={`text-right text-[11px] uppercase tracking-[0.22em] ${theme.sidebarMuted}`}>
              {roleName}
            </p>
          </div>

          <button
            onClick={onLogout}
            className={`flex items-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white shadow-lg ${theme.topbarAccent}`}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
