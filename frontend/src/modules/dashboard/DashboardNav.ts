import {
    Archive,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Monitor,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import type { DashboardSidebarSection } from "../../components/common/layout/CommonDashboardSidebar"
import type { Role } from "../../types/auth"

const customerSections: DashboardSidebarSection[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "?type=overview", icon: LayoutDashboard },
      { label: "Messages", href: "?type=messages", icon: MessageCircle },
      { label: "Appointments", href: "?type=appointments", icon: CalendarDays },
      { label: "My Devices", href: "?type=mydevices", icon: Monitor },
    ],
  },
  {
    label: "Manage",
    items: [{ label: "Profile", href: "?type=profile", icon: UserRound }],
  },
]


const superAdminSections: DashboardSidebarSection[] = [
  {
    label: "Main",
    items: [
      { label: "Adminstration", href: "?type=adminstration", icon: ShieldCheck },
      { label: "Settings", href: "?type=settings", icon: Settings },
      { label: "Profile", href: "?type=profile", icon: UserRound },
    ],
  },
  {
    label: "System",
    items: [{ label: "Archive", href: "?type=archive", icon: Archive}],
  },
]

/**
 * One nav config per role. Customer is the real one; everyone else is
 * temporarily pointed at the same sections just so the app doesn't crash
 * for those roles — replace each with real nav items once we know what
 * Technician/Staff/Admin/Super Admin should actually see.
 *
 * tldr: for rbac
 */
export const dashboardSectionsByRole: Record<Role, DashboardSidebarSection[]> = {
  CUSTOMER: customerSections,
  TECHNICIAN: customerSections, // TODO
  STAFF: customerSections, // TODO
  ADMIN: customerSections, // TODO
  SUPER_ADMIN: superAdminSections,
}
