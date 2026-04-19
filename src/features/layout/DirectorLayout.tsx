import { ReactNode } from "react";
import { DirectorUser } from "../../core/types/auth";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { roleThemes } from "./roleTheme";

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
  sheets: "Sheets",
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

  return (
    <div className={`flex min-h-screen ${theme.shell}`}>
      <Sidebar
        role={user.primaryRole}
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          userName={user.fullName}
          roleName={user.primaryRole}
          onLogout={onLogout}
        />

        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
