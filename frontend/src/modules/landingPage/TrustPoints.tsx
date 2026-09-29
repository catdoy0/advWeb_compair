import {
  Headphones,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

import SectionContainer from "./SectionContainer"

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Diagnosis before repair",
    description:
      "Technicians confirm the problem so you know what's wrong.",
  },
  {
    icon: Search,
    title: "Real-time stage updates",
    description:
      "Every move from request to release is logged and visible.",
  },
  {
    icon: Sparkles,
    title: "Clear, upfront",
    description:
      "See the estimated service cost before work starts.",
  },
  {
    icon: Headphones,
    title: "Receipts kept together",
    description:
      "Your repair stays attached to your account and history.",
  },
]

export default function TrustPoints() {
  return (
    <section className="border-b border-[#e5edf7] bg-white transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950">
      <SectionContainer>
        <div className="grid grid-cols-2 gap-6 py-20 pb-30 md:grid-cols-4">
          {trustPoints.map((point) => {
            const Icon = point.icon

            return (
              <div
                key={point.title}
                className="flex gap-3"
              >
                <Icon
                  size={15}
                  className="mt-0.5 shrink-0 text-[#2458ae] dark:text-blue-400"
                />

                <div>
                  <h3 className="text-2xs font-bold text-[#204b96] dark:text-blue-200">
                    {point.title}
                  </h3>

                  <p className="mt-1 text-3xs leading-4 text-[#7a8799] dark:text-slate-400">
                    {point.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </SectionContainer>
    </section>
  )
}
