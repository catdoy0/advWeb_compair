import CommonDashboardSidebar from "../../components/common/layout/CommonDashboardSidebar"
import { dashboardSectionsByRole } from "./DashboardNav"
import type { Role } from "../../types/auth"

interface DashboardSidebarProps {
  role: Role
  activeType: string
  userInitials: string
  userName: string
  onLogout: () => void
}

export default function DashboardSidebar({
  role,
  activeType,
  userInitials,
  userName,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <CommonDashboardSidebar
      sections={dashboardSectionsByRole[role]}
      activeHref={`?type=${activeType}`}
      user={{
        initials: userInitials,
        name: userName,
      }}
      onLogout={onLogout}
    />
  )
}
