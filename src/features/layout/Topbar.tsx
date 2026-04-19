import { useEffect, useState } from "react";
import { Bell, LogOut, Sparkles } from "lucide-react";
import { UserRole } from "../../core/types/roles";
import { roleThemes } from "./roleTheme";

type Props = {
  title: string;
  userName: string;
  roleName: UserRole;
  onLogout: () => void;
};

export default function Topbar({
  title,
  userName,
  roleName,
  onLogout,
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
      className={`border-b px-6 py-4 ${theme.topbar} ${theme.topbarBorder}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${theme.topbarAccent}`} />
            <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${theme.accentText}`}>
              {theme.roleLabel}
            </p>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white/95 md:text-slate-900">
            {title}
          </h1>
          <p className="text-xs text-slate-400 md:text-slate-500">{theme.headline}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`hidden rounded-2xl border px-4 py-3 lg:block ${theme.panel}`}>
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

          <div className={`rounded-2xl border px-4 py-3 ${theme.panel}`}>
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
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
