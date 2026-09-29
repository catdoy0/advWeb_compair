import { useEffect } from "react"
import { ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router"

import CommonButton from "../../../components/common/widgets/CommonButton"
import Logo from "../../../components/common/widgets/Logo"
import { ROUTES } from "../../../routes"

type NavLink = { label: string; href: string }

type MobileSidebarProps = {
  open: boolean
  onClose: () => void
  navLinks: NavLink[]
}

export default function MobileSidebar({
  open,
  onClose,
  navLinks,
}: MobileSidebarProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia("(min-width: 1024px)") // lg
    if (mq.matches) {
      onClose()
      return
    }
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) onClose()
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [open, onClose])


  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] lg:hidden ${ open ? "pointer-events-auto" : "pointer-events-none" }`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={`absolute right-0 top-0 flex h-full w-80 max-w-[80vw] flex-col bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-slate-950 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-25 items-center justify-between border-b border-[#e5edf7] px-5 dark:border-slate-800">
          <Logo size={44} variant="darkTitle" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {navLinks.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={onClose}
              className="
              rounded-lg px-3 py-2.5 text-sm font-medium
              text-[#596b84] transition-colors
              hover:bg-[#eef6ff] hover:text-[#17469b]
              dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300
              "
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-[#e5edf7] px-4 py-4 dark:border-slate-800">
          <CommonButton
            variant="outline"
            className="w-full justify-center py-2"
            onClick={() => {
              onClose()
              navigate(ROUTES.AUTHPAGE)
            }}
          >
            Log in
          </CommonButton>

          <CommonButton
            variant="primary"
            className="w-full justify-center py-2"
            onClick={() => navigate(`${ROUTES.AUTHPAGE}?type=signup`)}
          >
            Sign up
          </CommonButton>
        </div>
      </aside>
    </div>
  )
}
