import { useState } from "react"
import { Menu } from "lucide-react"
import { useNavigate } from "react-router"

import DarkModeButton from "../../../components/common/widgets/DarkModeButton"
import CommonButton from "../../../components/common/widgets/CommonButton"
import Logo from "../../../components/common/widgets/Logo"
import SectionContainer from "../SectionContainer"
import MobileSidebar from "./MobileSidebar"
import { ROUTES } from "../../../routes"

const navLinks = [
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Compair", href: "#why-compair" },
  { label: "Contact", href: "#contact" },
]

export default function Navbar() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="absolute left-0 top-0 z-50 w-full border-b border-[#e5edf7] bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-[#0a1428]">
        <SectionContainer>
          <div className="flex h-20 items-center justify-between">
            <Logo size={50} variant="darkTitle" />

            {/* Desktop nav */}
            <nav className="hidden items-center gap-8 lg:flex">
              {navLinks.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="
                  text-caption
                  font-medium
                  text-[#596b84]
                  transition-colors
                  hover:text-[#17469b]
                  dark:text-slate-300
                  dark:hover:text-blue-300
                  "
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <DarkModeButton />

              {/* Desktop actions */}
              <div className="hidden items-center gap-2 lg:flex">
                <CommonButton
                  variant="outline"
                  className="px-3 py-1.5"
                  onClick={() => navigate(ROUTES.AUTHPAGE)}
                >
                  Log in
                </CommonButton>

                <CommonButton 
                  variant="primary"
                  className="px-3 py-1.5"
                  onClick={() => navigate(`${ROUTES.AUTHPAGE}?type=signup`)}
                >
                  Sign up
                </CommonButton>
              </div>

              {/* Mobile menu trigger */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-sidebar"
                className="
                  grid
                  h-9
                  w-9
                  place-items-center
                  rounded-md
                  text-[#4368a6]
                  transition-colors
                  hover:bg-[#eef6ff]
                  dark:text-blue-300
                  dark:hover:bg-slate-800
                  lg:hidden
                "
              >
                <Menu size={18} />
              </button>
            </div>
          </div>
        </SectionContainer>
      </header>

      <MobileSidebar
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        navLinks={navLinks}
      />
    </>
  )
}
