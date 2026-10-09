import {
  Archive,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  Monitor,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserCog,
  UserRound,
  Users,
  UsersRound,
  Wrench,
} from "lucide-react";

import type { DashboardSidebarSection } from "../../components/common/layout/CommonDashboardSidebar";
import type { Role } from "../../types/auth";
import { ROUTES } from "../../routes";

const D = ROUTES.DASHBOARD;
const dashboardPath = (path: string) => `${D.ROOT}/${path}`;

const overviewItem = { label: "TODO:Overview", href: D.ROOT, icon: LayoutDashboard };
const messagesItem = { label: "Messages", href: dashboardPath(D.MESSAGES), icon: MessageCircle };
const appointmentsItem = { label: "TODO:Appointments", href: dashboardPath(D.APPOINTMENTS), icon: CalendarDays };
const myDevicesItem = { label: "TODO:My Devices", href: dashboardPath(D.MY_DEVICES), icon: Monitor };
const profileItem = { label: "Profile", href: dashboardPath(D.PROFILE), icon: UserRound };
const administrationItem = { label: "Administration", href: dashboardPath(D.ADMINISTRATION), icon: ShieldCheck };
const settingsItem = { label: "TODO:Settings", href: dashboardPath(D.SETTINGS), icon: Settings };
const archiveItem = { label: "TODO:Archive", href: dashboardPath(D.ARCHIVE), icon: Archive };

const workspaceItem = { label: "TODO:Workspace", href: dashboardPath(D.WORKSPACE), icon: LayoutDashboard };
const repairQueueItem = { label: "TODO:Repair Queue", href: dashboardPath(D.REPAIR_QUEUE), icon: Wrench };
const partsInventoryItem = { label: "TODO:Parts Inventory", href: dashboardPath(D.PARTS_INVENTORY), icon: Package };
const posItem = { label: "TODO:POS", href: dashboardPath(D.POS), icon: ShoppingCart };
const customersItem = { label: "TODO:Customers", href: dashboardPath(D.CUSTOMERS), icon: Users };
const devicesItem = { label: "TODO:Devices", href: dashboardPath(D.DEVICES), icon: Monitor };
const techniciansItem = { label: "TODO:Technicians", href: dashboardPath(D.TECHNICIANS), icon: UserCog };
const staffItem = { label: "TODO:Staff", href: dashboardPath(D.STAFF), icon: UsersRound };
const reportsItem = { label: "TODO:Reports", href: dashboardPath(D.REPORTS), icon: BarChart3 };

// const defaultSections: DashboardSidebarSection[] = [];

const customerSections: DashboardSidebarSection[] = [
  { label: "Main", items: [overviewItem, messagesItem, appointmentsItem, myDevicesItem] },
  { label: "Manage", items: [profileItem] },
];

const technicianSections: DashboardSidebarSection[] = [
  {
    label: "Workspace",
    items: [workspaceItem, repairQueueItem, messagesItem, appointmentsItem, partsInventoryItem],
  },
  { label: "Manage", items: [profileItem] },
];

const staffSections: DashboardSidebarSection[] = [
  {
    label: "Workspace",
    items: [repairQueueItem, messagesItem, posItem, appointmentsItem],
  },
  { label: "Manage", items: [profileItem] },
];

const adminSections: DashboardSidebarSection[] = [
  {
    label: "Workspace",
    items: [
      overviewItem,
      repairQueueItem,
      messagesItem,
      posItem,
      appointmentsItem,
      customersItem,
      devicesItem,
      partsInventoryItem,
    ],
  },
  {
    label: "Manage",
    items: [techniciansItem, staffItem, reportsItem, settingsItem, profileItem],
  },
];

const superAdminSections: DashboardSidebarSection[] = [
  { label: "Manage", items: [administrationItem, settingsItem, profileItem] },
  { label: "System", items: [archiveItem] },
];

/** Navigation items for each project role. Roles without a defined menu use the empty default. */
export const dashboardSectionsByRole: Record<Role, DashboardSidebarSection[]> = {
  CUSTOMER: customerSections,
  TECHNICIAN: technicianSections,
  STAFF: staffSections,
  ADMIN: adminSections, // Manager / Owner
  SUPER_ADMIN: superAdminSections,
};

/** Resolve a dashboard path to its label for the header breadcrumb. */
export function getNavLabel(role: Role, pathname: string): string {
  for (const section of dashboardSectionsByRole[role]) {
    const item = section.items.find((entry) => entry.href === pathname);
    if (item) return item.label;
  }

  return pathname === D.ROOT ? "Overview" : "Dashboard";
}
