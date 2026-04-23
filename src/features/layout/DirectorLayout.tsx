import { ReactNode, useMemo, useState } from "react";
import { DirectorUser } from "../../core/types/auth";
import Sidebar, { getNavItemsForRole, getSidebarIcon } from "./Sidebar";
import Topbar from "./Topbar";
import { roleThemes } from "./roleTheme";
import { UserRole } from "../../core/types/roles";

type Props = {
  user: DirectorUser;
  activePage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  children: ReactNode;
};

const titleMap: Record<string, string> = {
  dashboard: "Dashboard",
  activity: "User Activity",
  control: "Control Board",
  operations: "Restaurant Management",
  "merchant-management": "Merchant Management",
  fleet: "Driver Fleet",
  "driver-management": "Driver Management",
  "driver-fleet": "Driver Fleet Overview",
  users: "User Management",
  orders: "Orders",
  monitoring: "Monitoring",
  transactions: "Transactions",
  revenue: "Revenue",
  support: "Support",
  health: "System Health",
  catalog: "Assets & Catalog",
  updates: "Update Center",
  finance: "Ledger",
  reports: "Reports",
  systems: "System Logs",
  security: "Alerts & Errors",
  campaigns: "Campaigns",
  assets: "Operational Map",
  people: "Internal Users",
  access: "System Control",
  letters: "Letters",
  agenda: "Agenda",
  meetings: "Meeting Schedule",
  approvals: "Approvals",
  chat: "Director Chat",
  settlements: "Settlements",
  insights: "User Insights",
  recruitment: "Recruitment",
  employees: "Employees",
  attendance: "Attendance",
  "report-to-ceo": "Laporan ke CEO",
  "fund-management": "Fund Management",
  ledger: "Ledger",
  sync: "Sync Center",
};

export default function DirectorLayout({
  user,
  activePage,
  onNavigate,
  onLogout,
  children,
}: Props) {
  const title = titleMap[activePage] || "Director Panel";
  const theme = roleThemes[user.primaryRole];
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mobileNavItems = useMemo(
    () => getNavItemsForRole(user.primaryRole).slice(0, 5),
    [user.primaryRole]
  );
  const showMobileBottomNav =
    user.primaryRole === UserRole.CTO || user.primaryRole === UserRole.CFO;
  const bottomNavActiveClass =
    user.primaryRole === UserRole.CFO
      ? "bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-violet-500/20 text-emerald-200"
      : "bg-cyan-500/15 text-cyan-200";
  const bottomNavIdleClass =
    user.primaryRole === UserRole.CFO
      ? "text-slate-400 hover:bg-white/5 hover:text-emerald-100"
      : "text-slate-400 hover:bg-white/5 hover:text-white";

  return (
    <div className={`flex min-h-screen ${theme.shell}`}>
      <Sidebar
        role={user.primaryRole}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-[88vw] max-w-sm overflow-hidden border-r border-white/10 bg-slate-950 shadow-2xl">
            <Sidebar
              role={user.primaryRole}
              activePage={activePage}
              onNavigate={onNavigate}
              isMobile
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          userName={user.fullName}
          roleName={user.primaryRole}
          onLogout={onLogout}
          onOpenMenu={() => setMobileSidebarOpen(true)}
        />

        <main className={`flex-1 overflow-auto p-4 sm:p-6 ${showMobileBottomNav ? "pb-28 lg:pb-6" : ""}`}>
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>

      {showMobileBottomNav ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 px-2 py-2 backdrop-blur-xl lg:hidden">
          <div className="grid grid-cols-5 gap-2">
            {mobileNavItems.map((item) => {
              const active = activePage === item.key;
              const Icon = getSidebarIcon(item.key);

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={`flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center transition ${
                    active
                      ? bottomNavActiveClass
                      : bottomNavIdleClass
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-semibold leading-tight">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
