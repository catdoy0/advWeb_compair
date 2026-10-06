import CommonDashboardSidebar from "../../components/common/layout/CommonDashboardSidebar"
import { dashboardSectionsByRole } from "./DashboardNav"
import type { Role } from "../../types/auth"

interface DashboardSidebarProps {
  role: Role
  activeHref: string
  userInitials: string
  userName: string
  open: boolean;
  onClose: () => void;
  onLogout: () => void
}

export default function DashboardSidebar({
  role,
  activeHref,
  userInitials,
  userName,
  onClose,
  open,
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
      open={open}
      onClose={onClose}
      onLogout={onLogout}
    />
  )
}
