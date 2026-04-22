import { useEffect, useState } from "react";
import SendReportToCEO from "../shared/components/SendReportToCEO";
import { DirectorUser } from "../../core/types/auth";
import { UserRole } from "../../core/types/roles";
import DirectorLayout from "../layout/DirectorLayout";
import AdminSuperLayout from "../layout/AdminSuperLayout";
import AdminDashboardPage from "../admin/pages/AdminDashboardPage";
import AdminOrdersPage from "../admin/pages/AdminOrdersPage";
import AdminUserActivityPage from "../admin/pages/AdminUserActivityPage";
import AdminUserManagementPage from "../admin/pages/AdminUserManagementPage";
import AdminMonitoringPage from "../admin/pages/AdminMonitoringPage";
import AdminRevenuePage from "../admin/pages/AdminRevenuePage";
import AdminSupportPage from "../admin/pages/AdminSupportPage";
import AdminSystemHealthPage from "../admin/pages/AdminSystemHealthPage";
import AdminAssetsCatalogPage from "../admin/pages/AdminAssetsCatalogPage";

import COODashboardPage from "../coo/pages/COODashboardPageV2";
import COOOperationsPage from "../coo/pages/COOOperationsPageV2";
import COOFleetPage from "../coo/pages/COOFleetPageV2";
import COOOrdersPage from "../coo/pages/COOOrdersPage";
import COOChatPage from "../coo/pages/COOChatPage";
import ApprovalInboxPage from "../approval/pages/ApprovalInboxPage";
import CEODashboardPage from "../ceo/pages/CEODashboardPageV2";
import CFODashboardPage from "../cfo/pages/CFODashboardPage";
import CFOLedgerPage from "../cfo/pages/CFOLedgerPage";
import CFOSettlementsPage from "../cfo/pages/CFOSettlementsPageV2";
import CFOReportsPage from "../cfo/pages/CFOReportsPage";
import CFOFundRequestsPage from "../cfo/pages/CFOFundRequestsPage";
import CFORecruitmentPage from "../cfo/pages/CFORecruitmentPage";
import CFOSheetsPage from "../cfo/pages/CFOSheetsPage";
import CMODashboardPage from "../cmo/pages/CMODashboardPage";
import CMOCampaignPage from "../cmo/pages/CMOCampaignPage";
import CMOUserInsightsPage from "../cmo/pages/CMOUserInsightsPage";
import HRDashboardPage from "../hr/pages/HRDashboardPage";
import HRRecruitmentPage from "../hr/pages/HRRecruitmentPage";
import HREmployeesPage from "../hr/pages/HREmployeesPage";
import HRAttendancePage from "../hr/pages/HRAttendancePage";
import HRClockAttendancePage from "../hr/pages/HRClockAttendancePage";
import SecretaryDashboardPage from "../secretary/pages/SecretaryDashboardPage";
import MerchantManagementPage from "../management/pages/MerchantManagementPage";
import DriverManagementPage from "../management/pages/DriverManagementPage";
import SecretaryLettersPage from "../secretary/pages/SecretaryLettersPage";
import SecretaryAgendaPage from "../secretary/pages/SecretaryAgendaPage";
import ExecutiveControlPage from "../executive/pages/ExecutiveControlPage";
import MeetingSchedulePage from "../meetings/pages/MeetingSchedulePage";
import {
  isDefaultLiveSyncRunning,
  startDefaultLiveSync,
  stopDefaultLiveSync,
} from "../secretary/services/defaultSyncService";


type Props = {
  user: DirectorUser;
  onLogout: () => void;
};

const PlaceholderPage = ({ title }: { title: string }) => {
  return (
    <div className="rounded-3xl bg-white p-8 shadow">
      <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
      <p className="text-slate-600">Coming soon.</p>
    </div>
  );
};

export default function RoleRouter({ user, onLogout }: Props) {
  const [activePage, setActivePage] = useState(
    user.primaryRole === UserRole.CTO ? "meetings" : "dashboard"
  );
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    let startedByRouter = false;

    const ensureDefaultSync = async () => {
      if (user.primaryRole !== UserRole.CTO) return;
      if (isDefaultLiveSyncRunning()) return;

      try {
        await startDefaultLiveSync();
        startedByRouter = true;
      } catch (error) {
        console.error("Auto start default sync failed:", error);
      }
    };

    void ensureDefaultSync();

    return () => {
      if (!startedByRouter) return;
      void stopDefaultLiveSync();
    };
  }, [user.primaryRole]);

  const handleNavigate = (page: string) => {
    if (page === "report-to-ceo") {
      setShowReportModal(true);
      return;
    }
    setActivePage(page);
  };

  const renderAdmin = () => {
    switch (activePage) {
      case "dashboard":
        return <AdminDashboardPage />;
      case "monitoring":
        return <AdminMonitoringPage />;
      case "operations":
      case "restaurants":
      case "merchant-management":
        return <MerchantManagementPage user={user} />;
      case "fleet":
      case "driver-management":
        return <DriverManagementPage user={user} />;
      case "orders":
      case "transactions":
        return <AdminOrdersPage />;
      case "support":
        return <AdminSupportPage user={user} />;
      case "users":
        return <AdminUserManagementPage user={user} />;
      case "activity":
        return <AdminUserActivityPage />;
      case "attendance":
        return <HRClockAttendancePage user={user} />;
      default:
        return <AdminDashboardPage />;
    }
  };

  const renderCOO = () => {
  switch (activePage) {
    case "dashboard":
      return <COODashboardPage user={user} />;
    case "operations":
      return <COOOperationsPage />;
    case "fleet":
      return <COOFleetPage />;
    case "orders":
      return <COOOrdersPage />;
    case "meetings":
      return <MeetingSchedulePage user={user} />;
    case "approvals":
      return <ApprovalInboxPage user={user} />;
    case "chat":
      return <COOChatPage user={user} />;
    case "attendance":
      return <HRClockAttendancePage user={user} />;
    default:
      return <COODashboardPage user={user} />;
  }
};

  const renderCEO = () => {
  switch (activePage) {
    case "dashboard":
      return <CEODashboardPage user={user} />;
    case "control":
      return <ExecutiveControlPage user={user} />;
    case "operations":
    case "restaurants":
      return <COOOperationsPage user={user} />;
    case "meetings":
      return <MeetingSchedulePage user={user} />;
    case "approvals":
      return <ApprovalInboxPage user={user} />;
    case "chat":
      return <COOChatPage user={user} />;
    case "attendance":
      return <HRClockAttendancePage user={user} />;
    default:
      return <CEODashboardPage user={user} />;
  }
};

 const renderCFO = () => {
  switch (activePage) {
    case "dashboard":
      return <CFODashboardPage />;
    case "revenue":
      return <AdminRevenuePage />;
    case "orders":
      return <AdminOrdersPage />;
    case "finance":
      return <CFOLedgerPage user={user} />;
    case "reports":
      return <CFOReportsPage />;
    case "settlements":
      return <CFOSettlementsPage user={user} />;
    case "fund-management":
      return <CFOFundRequestsPage user={user} />;
    case "recruitment":
      return <CFORecruitmentPage user={user} />;
    case "sheets":
      return <CFOSheetsPage user={user} />;
    case "meetings":
      return <MeetingSchedulePage user={user} />;
    case "approvals":
      return <ApprovalInboxPage user={user} />;
    case "chat":
      return <COOChatPage user={user} />;
    case "attendance":
      return <HRClockAttendancePage user={user} />;
    default:
      return <CFODashboardPage />;
  }
};

const renderCTO = () => {
  switch (activePage) {
    case "meetings":
      return <MeetingSchedulePage user={user} />;
    case "approvals":
      return <ApprovalInboxPage user={user} />;
    case "chat":
      return <COOChatPage user={user} />;
    case "attendance":
      return <HRClockAttendancePage user={user} />;
    default:
      return <MeetingSchedulePage user={user} />;
  }
};
const renderCMO = () => {
  switch (activePage) {
    case "dashboard":
      return <CMODashboardPage user={user} />;
    case "campaigns":
      return <CMOCampaignPage user={user} />;
    case "catalog":
      return <AdminAssetsCatalogPage />;
    case "insights":
      return <CMOUserInsightsPage />;
    case "meetings":
      return <MeetingSchedulePage user={user} />;
    case "chat":
      return <COOChatPage user={user} />;
    case "attendance":
      return <HRClockAttendancePage user={user} />;
    default:
      return <CMODashboardPage user={user}/>;
  }
};

const renderHR = () => {
  switch (activePage) {
    case "dashboard":
      return <HRDashboardPage />;
    case "driver-fleet":
      return <DriverManagementPage user={user} />;
    case "employees":
      return <HREmployeesPage />;
    case "recruitment":
      return <HRRecruitmentPage user={user} />;
    case "attendance":
      return <HRClockAttendancePage user={user} />;
    case "meetings":
      return <MeetingSchedulePage user={user} />;
    case "chat":
      return <COOChatPage user={user} />;
    default:
      return <HRDashboardPage />;
  }
};

  const renderSecretary = () => {
    switch (activePage) {
      case "dashboard":
        return <SecretaryDashboardPage />;
      case "meetings":
        return <MeetingSchedulePage user={user} />;
      case "letters":
        return <SecretaryLettersPage user={user} />;
      case "agenda":
        return <SecretaryAgendaPage user={user} />;
      case "approvals":
        return <ApprovalInboxPage user={user} />;
      case "chat":
        return <COOChatPage user={user} />;
      case "attendance":
        return <HRClockAttendancePage user={user} />;
      default:
        return <SecretaryDashboardPage />;
    }
  };

  const renderContent = () => {
    switch (user.primaryRole) {
      case UserRole.ADMIN:
        return renderAdmin();
      case UserRole.COO:
        return renderCOO();
      case UserRole.CEO:
        return renderCEO();
      case UserRole.CFO:
        return renderCFO();
      case UserRole.CTO:
        return renderCTO();
      case UserRole.CMO:
        return renderCMO();
      case UserRole.HR:
        return renderHR();
      case UserRole.SECRETARY:
        return renderSecretary();
      default:
        return <PlaceholderPage title="Role tidak dikenali" />;
    }
  };

  if (user.primaryRole === UserRole.ADMIN) {
    return (
      <>
        <AdminSuperLayout
          user={user}
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        >
          {renderContent()}
        </AdminSuperLayout>
        <SendReportToCEO
          user={user}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <DirectorLayout
        user={user}
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      >
        {renderContent()}
      </DirectorLayout>
      <SendReportToCEO
        user={user}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </>
  );
}
