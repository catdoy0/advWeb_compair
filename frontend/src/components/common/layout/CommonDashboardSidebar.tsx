import type { LucideIcon } from "lucide-react"
import { ChevronLeft, LogOut } from "lucide-react"
import { Link } from "react-router"
import Logo from "../widgets/Logo"
import CommonButton from "../widgets/CommonButton"
import UserAvatar from "../widgets/UserAvatar"

export interface DashboardSidebarItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface DashboardSidebarSection {
  label: string
  items: DashboardSidebarItem[]
}

interface CommonDashboardSidebarProps {
  sections: DashboardSidebarSection[]
  activeHref?: string

  open?: boolean
  onClose?: () => void

  user?: {
    initials: string
    name: string
  }

  onLogout?: () => void
}

export default function CommonDashboardSidebar({
  sections,
  open = false,
  onClose,
  activeHref,
  user,
  onLogout,
}: CommonDashboardSidebarProps) {
  return (
    <>
      {/* Dark overlay shown only on mobile when the sidebar is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          h-full w-56 shrink-0
          flex flex-col overflow-hidden
          bg-[#0b213d]
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="flex h-24 shrink-0 items-center px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-row items-center gap-2">
              <Logo size={32} variant="default" />
              <div>
                <p className="text-[15px] font-bold tracking-[0.2em] text-white">
                  COMPAIR
                </p>
                <p className="mt-1 text-[9px] tracking-wide text-slate-400">
                  Computer repair
                </p>
                <p className="text-[9px] tracking-wide text-slate-400">
                  operations
                </p>
              </div>
            </div>
          </div>

          <CommonButton
            onClick={onClose}
            variant="icon"
            aria-label="Close sidebar"
            className="md:hidden"
          >
            <ChevronLeft size={16} />
          </CommonButton>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4">
          {sections.map((section) => (
            <div key={section.label} className="mb-7">
              <p
                className="
                  mb-2 px-3
                  text-[9px] font-bold uppercase tracking-[0.18em]
                  text-slate-500
                "
              >
                {section.label}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = item.href === activeHref

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={`
                        flex items-center gap-3
                        rounded-md px-3 py-2.5
                        text-[13px] font-medium
                        transition-colors
                        ${
                          active
                            ? "bg-[#1d4775] text-white shadow-sm ring-1 ring-[#2863a0] border-l-2 border-[#3b82f6]"
                            : "text-slate-400 hover:bg-[#142f50] hover:text-white"
                        }
                      `}
                    >
                      <Icon size={15} strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="shrink-0 border-t border-[#1c3552] p-4">
            <div className="flex items-center gap-3">
              <UserAvatar initials={user.initials} tone="sidebar" />

              <p className="min-w-0 flex-1 truncate text-[10px] font-semibold text-white">
                {user.name}
              </p>

              {onLogout && (
                <CommonButton
                  variant="icon"
                  onClick={onLogout}
                  aria-label="Log out"
                >
                  <LogOut size={13} />
                </CommonButton>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
