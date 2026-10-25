import {
  MessageSquare,
  Phone,
} from "lucide-react"
import { useEffect, useState } from "react"

import Logo from "../../../components/common/widgets/Logo"
import SectionContainer from "../SectionContainer"
import { getStoreSettings } from "../../../api/auth"
import type { StoreSettings } from "../../../types/auth"

const serviceLinks = [
  { label: "Repair requests", href: "#service-repair-requests" },
  { label: "Appointments", href: "#service-appointments" },
  { label: "Status tracking", href: "#service-status-tracking" },
  { label: "Service history", href: "#service-history" },
]

const companyLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Compair", href: "#why-compair" },
]

function FooterLinks({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="text-3xs font-bold text-[#244c91] dark:text-blue-200">
        {title}
      </h3>

      <div className="mt-3 space-y-2">
        {links.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="
              block
              text-3xs
              text-[#718198] dark:text-slate-400
              hover:text-[#194b9d] dark:hover:text-blue-300
            "
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}

export default function Footer() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)

  useEffect(() => {
    getStoreSettings().then(setStoreSettings)
  }, [])

  return (
    <footer className="bg-white transition-colors duration-300 dark:bg-slate-950">
      <SectionContainer>
        <div className="grid gap-8 py-8 sm:grid-cols-4">
          <div>
            <Logo size={50} />

            <p className="mt-3 max-w-[280px] text-3xs leading-4 text-[#7a8798] dark:text-slate-400">
              Computer and device repair, tracked from drop-off
              to pickup, in one account.
            </p>
          </div>

          <FooterLinks
            title="Services"
            links={serviceLinks}
          />

          <FooterLinks
            title="Company"
            links={companyLinks}
          />

          <div>
            <h3 className="text-3xs font-bold text-[#244c91] dark:text-blue-200">
              Contact
            </h3>

            <div className="mt-3 space-y-2 text-3xs text-[#718198] dark:text-slate-400">
              <p className="flex items-center gap-2">
                <Phone size={10} />
                {storeSettings?.number}
              </p>

              <p className="flex items-center gap-2">
                <MessageSquare size={10} />
                {storeSettings?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#e3eaf3] py-5 text-center text-micro text-[#8894a5] dark:border-slate-800 dark:text-slate-500">
          © 2026 Compair. All rights reserved.
        </div>
      </SectionContainer>
    </footer>
  )
}
