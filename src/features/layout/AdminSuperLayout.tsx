import { ReactNode, useMemo, useState } from "react";
import {
  Activity,
  ClipboardList,
  LogOut,
  Menu,
  MessageCircle,
  Receipt,
  Store,
  Users,
  X,
} from "lucide-react";
import { DirectorUser } from "../../core/types/auth";

type Props = {
  user: DirectorUser;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
};

type NavItem = {
  id: string;
  label: string;
  icon: typeof Activity;
  color: string;
};

const menuItems: NavItem[] = [
  { id: "dashboard", label: "Overview", icon: Activity, color: "text-indigo-500" },
  { id: "transactions", label: "Transactions", icon: Receipt, color: "text-emerald-500" },
  { id: "users", label: "Users Control", icon: Users, color: "text-blue-500" },
  { id: "activity", label: "Activity Logs", icon: Activity, color: "text-rose-500" },
  { id: "attendance", label: "Attendance", icon: Activity, color: "text-cyan-500" },
  { id: "restaurants", label: "Partner Resto", icon: Store, color: "text-violet-500" },
  { id: "support", label: "User Support", icon: MessageCircle, color: "text-yellow-600" },
];

const mobileQuickNav: NavItem[] = [
  { id: "dashboard", label: "Overview", icon: Activity, color: "text-indigo-500" },
  { id: "transactions", label: "Orders", icon: Receipt, color: "text-emerald-500" },
  { id: "users", label: "Users", icon: Users, color: "text-blue-500" },
  { id: "attendance", label: "Attendance", icon: ClipboardList, color: "text-cyan-500" },
  { id: "support", label: "Support", icon: MessageCircle, color: "text-yellow-600" },
];

const titleMap: Record<string, string> = {
  dashboard: "Overview",
  transactions: "Transactions",
  users: "Users Control",
  activity: "Activity Logs",
  attendance: "Attendance",
  restaurants: "Partner Resto",
  support: "User Support",
};

export default function AdminSuperLayout({
  user,
  activePage,
  onNavigate,
  onLogout,
  children,
}: Props) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const title = useMemo(() => titleMap[activePage] || "Overview", [activePage]);

  const mobileDrawer = (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 transition-opacity duration-500 ease-out ${
          isMobileSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={`fixed bottom-0 left-0 top-0 z-[70] flex w-[88vw] max-w-[360px] flex-col overflow-hidden rounded-r-[2.5rem] bg-slate-50 shadow-2xl transition-transform duration-500 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-6 pb-8 pt-14">
          <div className="absolute right-[-50px] top-[-50px] h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-20px] left-[-20px] h-32 w-32 rounded-full bg-black/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="h-16 w-16 rounded-full border border-white/20 bg-white/20 p-1 shadow-lg">
                <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-white/80 bg-indigo-700 text-xl font-black text-white">
                  {String(user.fullName || "A").slice(0, 1).toUpperCase()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/20 text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-black leading-none text-white">
                Hai, {user.fullName.split(" ")[0]}!
              </h2>
              <p className="text-xs text-white/70">RimoFood Super Admin Style</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 px-4 py-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full rounded-2xl border px-5 py-4 transition-all ${
                  isActive
                    ? "scale-[1.02] border-indigo-100 bg-white shadow-[0_8px_20px_-6px_rgba(99,102,241,0.15)]"
                    : "border-transparent hover:scale-[1.01] hover:bg-white/60"
                }`}
                style={{
                  opacity: isMobileSidebarOpen ? 1 : 0,
                  transform: isMobileSidebarOpen ? "translateX(0)" : "translateX(-20px)",
                  transition: `all 0.4s cubic-bezier(0.34,1.56,0.64,1) ${100 + index * 40}ms`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${
                      isActive ? "bg-indigo-50 text-indigo-600" : `bg-slate-100 ${item.color}`
                    }`}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <div className="flex-1 text-left">
                    <span className="block text-[15px] font-bold text-slate-700">
                      {item.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-100 bg-white p-6">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 py-4 text-sm font-bold text-rose-600 transition-all hover:scale-[1.02] hover:bg-rose-100"
          >
            <LogOut size={20} strokeWidth={2.5} />
            <span>Keluar Aplikasi</span>
          </button>
          <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
            RimoFood v2.5.0
          </p>
        </div>
      </aside>
    </>
  );

  return (
    <div className="relative flex h-screen overflow-hidden bg-slate-50 font-sans">
      {mobileDrawer}

      <div className="relative z-50 hidden h-screen items-center px-4 lg:flex">
        <aside className="glass-premium flex h-[92vh] w-80 flex-col overflow-hidden rounded-[3rem] border shadow-3xl">
          <div className="flex items-center gap-5 px-10 pb-10 pt-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-indigo-600 to-purple-600 text-3xl font-black text-white shadow-[0_20px_45px_rgba(99,102,241,0.35)]">
              R
            </div>
            <div>
              <h1 className="text-3xl font-black leading-none tracking-tighter text-slate-900">
                Rimo<span className="text-rimo-500">Core</span>
              </h1>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Enterprise Edition
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`animate-slide-in flex w-full items-center gap-5 rounded-2xl py-5 transition-all duration-500 ${
                    isActive
                      ? "bg-slate-950 px-8 text-white shadow-3xl"
                      : "px-8 text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className={`shrink-0 transition-transform duration-500 ${isActive ? "scale-110" : "group-hover:scale-110"} ${isActive ? "" : item.color}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                    {item.label}
                  </span>
                  {isActive ? (
                    <div className="ml-auto h-6 w-1.5 animate-pulse rounded-full bg-indigo-500 shadow-[0_0_18px_rgba(99,102,241,0.55)]" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-slate-50 p-8">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center gap-5 rounded-2xl bg-rose-500 px-8 py-5 text-white shadow-3xl transition-all duration-500 hover:bg-rose-600"
            >
              <LogOut size={22} className="shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Logout
              </span>
            </button>
          </div>
        </aside>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-xl sm:px-6 md:h-24 md:px-12">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all active:scale-95 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={24} />
            </button>

            <div className="flex flex-col">
              <h2 className="text-lg font-black capitalize leading-none tracking-tighter text-slate-900 md:text-2xl">
                {title}
              </h2>
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Admin Console
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 sm:flex">
            <div className="text-right">
              <p className="mb-1 text-[9px] font-black uppercase leading-none text-slate-400">
                Operations Admin
              </p>
              <p className="max-w-[120px] truncate text-xs font-black leading-none text-slate-900">
                {user.fullName}
              </p>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-xl border-2 border-white shadow-sm">
              <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-sm font-black text-white">
                {String(user.fullName || "A").slice(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 pb-36 sm:p-6 md:p-10 lg:pb-12 xl:p-12">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 lg:hidden">
          <nav className="grid grid-cols-5 gap-2 rounded-[2rem] border border-white/10 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-3xl">
            {mobileQuickNav.map((nav) => {
              const Icon = nav.icon;
              const active = activePage === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => onNavigate(nav.id)}
                  className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition-all duration-500 ${
                    active
                      ? "translate-y-[-6px] bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-glow"
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 3 : 2} />
                  <span className="text-[10px] font-semibold leading-tight">
                    {nav.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
