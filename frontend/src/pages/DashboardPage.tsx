import { Outlet, useLocation } from "react-router";
import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import DashboardSidebar from "../modules/dashboard/Sidebar";
import CommonDashboardHeader from "../components/common/layout/CommonDashboardHeader";
import AreYouSureModal from "../components/common/modals/AreYouSureModal";
import { dummySession } from "../dummyData";
import { getNavLabel } from "../modules/dashboard/DashboardNav";
import { useTitle } from "../hooks/useTitle";
import { useLoading } from "../context/LoadingContext";
import LoadingScreen from "../components/common/LoadingScreen";
import { listConversations } from "../api/conversations";
import { useEvents } from "../context/EventContext";

export default function DashboardPage() {
  const { isLoading } = useLoading();

  const [isAreYouSureModalOpen, setIsAreYouSureModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const { session, logout } = useAuth();
  const { pathname } = useLocation();
  const { subscribe } = useEvents();

  const currentSession = session ?? dummySession;
  const { user } = currentSession;

  useEffect(() => {
    let cancelled = false;

    async function refreshUnreadMessages() {
      try {
        const page = await listConversations();
        if (cancelled) return;
        setUnreadMessages(page.unread_total);
      } catch (error) {
        console.error("Failed to load unread message count", error);
      }
    }

    void refreshUnreadMessages();
    const unsubscribe = subscribe("new-message", () => {
      void refreshUnreadMessages();
    });
    window.addEventListener("conversations-read", refreshUnreadMessages);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("conversations-read", refreshUnreadMessages);
    };
  }, [pathname, subscribe, user.id]);

  const hasName = Boolean(user.firstName || user.lastName);
  const fullName = hasName
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : user.email;

  const initials = (
    hasName
      ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      : user.email[0] ?? "?"
  ).toUpperCase();

  const contentLabel = getNavLabel(user.role, pathname);
  useTitle("Dashboard")

  return (
    <>
      {isLoading && <LoadingScreen />}
      {/* Full-height app shell — nothing outside scrolls */}
      <div className="fixed inset-0 flex h-dvh w-full overflow-hidden bg-[#f7f9fc] dark:bg-[#0f1724]">
        {/* Sidebar: fixed column, scrolls on its own if it needs to */}
        <DashboardSidebar
          role={user.role}
          activeHref={pathname}
          userInitials={initials}
          userName={fullName}
          unreadMessages={unreadMessages}
          onLogout={() => setIsAreYouSureModalOpen(true)}
          onClose={() => setSidebarOpen(false)}
          open={sidebarOpen}
        />

        {/* Right column: header stays, only content scrolls */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f9fc] text-slate-900 dark:bg-[#0f1724] dark:text-white">
          <CommonDashboardHeader
            breadcrumbs={["Compair", contentLabel]}
            statusLabel="Live workspace"
            userInitials={initials}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="min-h-0 flex-1 overflow-y-auto bg-[#f7f9fc] dark:bg-[#0f1724]">
            <Outlet />
          </main>
        </div>
      </div>

      <AreYouSureModal
        open={isAreYouSureModalOpen}
        onClose={() => setIsAreYouSureModalOpen(false)}
        onConfirm={logout}
        title="Are you sure you want to log out?"
      />
    </>
  );
}
