import type { ComponentType } from "react";
import { UserRole } from "../../core/types/roles";
import {
  Activity,
  Briefcase,
  Building2,
  ChartColumnBig,
  CreditCard,
  FileText,
  LayoutDashboard,
  Map,
  MessageSquare,
  Send,
  Shield,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import { roleThemes } from "./roleTheme";

type Props = {
  role: UserRole;
  activePage: string;
  onNavigate: (page: string) => void;
};

type NavItem = {
  key: string;
  label: string;
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  activity: Activity,
  control: Briefcase,
  operations: Building2,
  "merchant-management": Building2,
  fleet: Users,
  "driver-management": UserCog,
  users: Users,
  orders: Activity,
  monitoring: Activity,
  transactions: CreditCard,
  revenue: ChartColumnBig,
  support: MessageSquare,
  health: Wrench,
  catalog: Building2,
  updates: Activity,
  finance: CreditCard,
  reports: ChartColumnBig,
  systems: Wrench,
  security: Shield,
  campaigns: ChartColumnBig,
  assets: Map,
  people: UserCog,
  access: Shield,
  letters: FileText,
  agenda: Briefcase,
  meetings: Briefcase,
  approvals: Shield,
  chat: MessageSquare,
  "report-to-ceo": Send,
  "fund-management": CreditCard,
  "driver-fleet": Users,
  employees: Users,
  recruitment: UserCog,
  ledger: FileText,
  settlements: CreditCard,
  sheets: FileText,
  insights: ChartColumnBig,
  attendance: Activity,
};

const navMap: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: [
    { key: "dashboard", label: "Admin Dashboard" },
    { key: "monitoring", label: "Monitoring" },
    { key: "operations", label: "Merchant Ops" },
    { key: "merchant-management", label: "Merchant Management" },
    { key: "fleet", label: "Driver Ops" },
    { key: "driver-management", label: "Driver Management" },
    { key: "users", label: "User Management" },
    { key: "orders", label: "Orders" },
    { key: "support", label: "Support" },
    { key: "attendance", label: "Attendance" },
    { key: "activity", label: "User Activity" },
  ],
  [UserRole.CEO]: [
  { key: "dashboard", label: "CEO Dashboard" },
  { key: "control", label: "Control Board" },
  { key: "operations", label: "Restaurant Management" },
  { key: "attendance", label: "Attendance" },
  { key: "meetings", label: "Meetings" },
  { key: "approvals", label: "Approvals" },
  { key: "chat", label: "Chat" },
  { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
  ],
  [UserRole.COO]: [
    { key: "dashboard", label: "Dashboard" },
    { key: "operations", label: "Operations" },
    { key: "fleet", label: "Fleet" },
    { key: "orders", label: "Orders" },
    { key: "attendance", label: "Attendance" },
    { key: "meetings", label: "Meetings" },
    { key: "approvals", label: "Approvals" },
    { key: "chat", label: "Chat" },
    { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
  ],
 [UserRole.CTO]: [
  { key: "dashboard", label: "Command Center" },
  { key: "health", label: "System Health" },
  { key: "systems", label: "System Logs" },
  { key: "security", label: "Alerts & Errors" },
  { key: "updates", label: "Update Center" },
  { key: "access", label: "System Control" },
  { key: "people", label: "Internal Users" },
  { key: "users", label: "User Management" },
  { key: "orders", label: "Orders" },
  { key: "support", label: "Support" },
  { key: "activity", label: "User Activity" },
  { key: "assets-catalog", label: "Assets Catalog" },
  { key: "fleet", label: "Driver Monitor" },
  { key: "operations", label: "Merchant Zones" },
  { key: "reports", label: "Expansion Analyzer" },
  { key: "assets", label: "Operational Map" },
  { key: "attendance", label: "Attendance" },
  { key: "meetings", label: "Meetings" },
  { key: "approvals", label: "Approvals" },
  { key: "chat", label: "Chat" },
  { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
],
  [UserRole.CFO]: [
  { key: "dashboard", label: "Dashboard" },
  { key: "revenue", label: "Revenue" },
  { key: "reports", label: "Reports" },
  { key: "fund-management", label: "Fund & Cash" },
  { key: "recruitment", label: "Recruitment" },
  { key: "orders", label: "Orders" },
  { key: "finance", label: "Ledger" },
  { key: "settlements", label: "Settlements" },
  { key: "sheets", label: "Sheets" },
  { key: "attendance", label: "Attendance" },
  { key: "meetings", label: "Meetings" },
  { key: "approvals", label: "Approvals" },
  { key: "chat", label: "Chat" },
  { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
],
[UserRole.CMO]: [
  { key: "dashboard", label: "Growth Dashboard" },
  { key: "campaigns", label: "Campaigns" },
  { key: "catalog", label: "Assets & Catalog" },
  { key: "insights", label: "User Insights" },
  { key: "attendance", label: "Attendance" },
  { key: "meetings", label: "Meetings" },
  { key: "chat", label: "Chat" },
  { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
],
[UserRole.HR]: [
  { key: "dashboard", label: "HR Dashboard" },
  { key: "driver-fleet", label: "Driver Fleet" },
  { key: "employees", label: "Employees" },
  { key: "recruitment", label: "Recruitment" },
  { key: "attendance", label: "Attendance" },
  { key: "meetings", label: "Meetings" },
  { key: "chat", label: "Chat" },
  { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
],
  [UserRole.SECRETARY]: [
    { key: "dashboard", label: "Dashboard" },
    { key: "meetings", label: "Meetings" },
    { key: "letters", label: "Letters" },
    { key: "agenda", label: "Agenda" },
    { key: "approvals", label: "Approvals" },
    { key: "report-to-ceo", label: "📤 Lapor ke CEO" },
    { key: "attendance", label: "Attendance" },
    { key: "chat", label: "Chat" },
  ],
};

export default function Sidebar({ role, activePage, onNavigate }: Props) {
  const items = navMap[role] || [];
  const theme = roleThemes[role];

  return (
    <aside
      className={`sticky top-0 h-screen w-72 self-start overflow-y-auto border-r p-4 ${theme.sidebar} ${theme.sidebarBorder}`}
    >
      <div className={`mb-6 rounded-3xl border p-4 ${theme.panel}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white/90 md:text-slate-900">
              Rimo Director
            </h2>
            <p className={`mt-1 text-xs uppercase tracking-[0.24em] ${theme.sidebarMuted}`}>
              {role}
            </p>
          </div>
          <div className={`rounded-2xl px-3 py-2 text-[11px] font-semibold ${theme.accentSoft} ${theme.accentText}`}>
            {theme.roleLabel}
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">{theme.headline}</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active = activePage === item.key;
          const Icon = iconMap[item.key] || LayoutDashboard;

          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                active ? theme.activeNav : theme.idleNav
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
