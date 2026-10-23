import CommonDashboardSidebar from "../../components/common/layout/CommonDashboardSidebar"
import { dashboardSectionsByRole } from "./DashboardNav"
import type { Role } from "../../types/auth"

interface DashboardSidebarProps {
  role: Role
  activeHref: string
  userInitials: string
  avatarUrl?: string | null
  userName: string
  unreadMessages: number
  open: boolean;
  onClose: () => void;
  onLogout: () => void
}

export default function DashboardSidebar({
  role,
  activeHref,
  userInitials,
  avatarUrl,
  userName,
  unreadMessages,
  onClose,
  open,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <CommonDashboardSidebar
      sections={dashboardSectionsByRole[role].map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.label === "Messages" ? { ...item, badge: unreadMessages } : item,
        ),
      }))}
      activeHref={activeHref}
      user={{
        initials: userInitials,
        avatarUrl,
        name: userName,
        role: role
      }}
      open={open}
      onClose={onClose}
      onLogout={onLogout}
    />
  )
}
