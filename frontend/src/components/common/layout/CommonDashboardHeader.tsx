import { Bell, Menu } from "lucide-react"

import UserAvatar from "../widgets/UserAvatar"
import DarkModeButton from "../widgets/DarkModeButton"

interface CommonDashboardHeaderProps {
  breadcrumbs: string[]
  statusLabel?: string
  userInitials?: string
  onMenuClick: () => void;
}

export default function CommonDashboardHeader({
  breadcrumbs,
  statusLabel,
  userInitials,
  onMenuClick
}: CommonDashboardHeaderProps) {

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#e5edf7] bg-white px-8 dark:border-slate-800 dark:bg-[#0f1724]">

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10"
        >
          <Menu size={20} />
        </button>
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((label, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <span key={label} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                )}
                <span
                  className={
                    isLast
                      ? "font-semibold text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500"
                  }
                >
                  {label}
                </span>
              </span>
            )
          })}
        </nav>
      </div>

      <div className=" flex items-center gap-5">
        {statusLabel && (
          <div className="max-sm:hidden flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {statusLabel}
          </div>
        )}

        <DarkModeButton/>

        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
        >
          <Bell size={17} />
        </button>

        <UserAvatar initials={userInitials || ""} />
      </div>
    </header>
  )
}
