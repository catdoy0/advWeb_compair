import {
  MessageSquare,
  Phone,
} from "lucide-react"

import Logo from "../../../components/common/widgets/Logo"
import SectionContainer from "../SectionContainer"

const serviceLinks = [
  "Repair requests",
  "Appointments",
  "Status tracking",
  "Service history",
]

const companyLinks = [
  "How it works",
  "Why Compair",
  "Contact support",
]

function FooterLinks({
  title,
  links,
}: {
  title: string
  links: string[]
}) {
  return (
    <div>
      <h3 className="text-3xs font-bold text-[#244c91] dark:text-blue-200">
        {title}
      </h3>

      <div className="mt-3 space-y-2">
        {links.map((link) => (
          <a
            key={link}
            href="#"
            className="
              block
              text-3xs
              text-[#718198] dark:text-slate-400
              hover:text-[#194b9d] dark:hover:text-blue-300
            "
          >
            {link}
          </a>
        ))}
      </div>
    </div>
  )
}

export default function Footer() {
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
                Compair HQ, Caloocan City
              </p>

              <p className="flex items-center gap-2">
                <MessageSquare size={10} />
                hello@compair.local
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
