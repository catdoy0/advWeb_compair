import CommonDashboardSidebar from "../../components/common/layout/CommonDashboardSidebar"
import { dashboardSectionsByRole } from "./DashboardNav"
import type { Role } from "../../types/auth"

interface DashboardSidebarProps {
  role: Role
  activeHref: string
  userInitials: string
  userName: string
  onLogout: () => void
}

export default function DashboardSidebar({
  role,
  activeHref,
  userInitials,
  userName,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <CommonDashboardSidebar
      sections={dashboardSectionsByRole[role]}
      activeHref={activeHref}
      user={{
        initials: userInitials,
        name: userName,
      }}
      onLogout={onLogout}
    />
  )
}
