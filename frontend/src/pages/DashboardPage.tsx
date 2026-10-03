import { useSearchParams } from "react-router";

import { useAuth } from "../context/AuthContext";
import type { Role } from "../types/auth";
import { dashboardSectionsByRole } from "../modules/dashboard/DashboardNav";
import QueryParamRedirect from "../components/common/QueryParamRedirect";
import DashboardSidebar from "../modules/dashboard/Sidebar";
import CommonDashboardHeader from "../components/common/layout/CommonDashboardHeader";
import Overview from "../modules/dashboard/content/Overview";
import AreYouSureModal from "../components/common/modals/AreYouSureModal";
import { useState } from "react";
import Messages from "../modules/dashboard/content/Messages";
import Appointments from "../modules/dashboard/content/Appointments";
import MyDevices from "../modules/dashboard/content/MyDevices";
import Profile from "../modules/dashboard/content/Profile";
import { dummySession } from "../dummyData";

import Adminstration from "../modules/dashboard/content/Adminstration";
import SettingsDashboard from "../modules/dashboard/content/Settings";



export default function DashboardPage() {
  const [isAreYouSureModalOpen, setIsAreYouSureModalOpen] = useState(false)

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "overview";
  const { session, logout } = useAuth();

 const currentSession = session ?? dummySession;

  const { user } = currentSession;
  const hasName = Boolean(user.firstName || user.lastName);
  const fullName = hasName
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : user.email;
  const initials = ( hasName ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` : user.email[0] ?? "?").toUpperCase();

  const contentLabel = getContentLabel(user.role, type);

  return (
    <QueryParamRedirect paramName="type" defaultValue="overview">
      <div className="flex min-h-screen">
        <DashboardSidebar
          role={user.role}
          activeType={type}
          userInitials={initials}
          userName={fullName}
          onLogout={() => {setIsAreYouSureModalOpen(true)}}
        />

        <div className="flex min-w-0 flex-1 flex-col dark:bg-[#0f1724] dark:text-white">
          <CommonDashboardHeader
            breadcrumbs={["Compair", contentLabel]}
            statusLabel="Live workspace"
            userInitials={initials}
          />

          <div className="flex-1">
            {type === "overview" && <Overview />}
            {type === "messages" && <Messages />}
            {type === "appointments" && <Appointments />}
            {type === "mydevices" && <MyDevices />}
            {type === "profile" && <Profile />}


            {type == "adminstration" && <Adminstration/>}
            {type == "settings" && <SettingsDashboard/>}
            
          </div>
        </div>
      </div>

      <AreYouSureModal 
        onClose={() => setIsAreYouSureModalOpen(false)}
        open={isAreYouSureModalOpen}
        onConfirm={logout}
        title="Are you sure you want to log out?"
      />

    </QueryParamRedirect>
  );
}

/**
 * Looks up the display label for the current `?type=` by searching the
 * role's sidebar config, so nav labels and breadcrumbs never drift apart.
 */
function getContentLabel(role: Role, type: string): string {
  for (const section of dashboardSectionsByRole[role]) {
    const item = section.items.find((i) => i.href === `?type=${type}`);
    if (item) return item.label;
  }
  return "Dashboard";
}
