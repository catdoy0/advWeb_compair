import {
  CalendarDays,
  CircleCheck,
  ClipboardCheck,
  FileText,
  Flag,
  Laptop,
} from "lucide-react"

import SectionContainer from "./SectionContainer"
import FeatureCard from "./components/FeatureCard"

const features = [
  {
    icon: FileText,
    title: "Repair requests & diagnosis",
    description:
      "Get the problem information you need to submit a request, a technician confirms the diagnosis and notes are always visible.",
  },
  {
    icon: Laptop,
    title: "Device registration",
    description:
      "Keep every laptop, desktop, or peripheral on file — type, brand, serial, and the repair history tied to it.",
  },
  {
    icon: CalendarDays,
    title: "Appointment booking",
    description:
      "Pick an open date and time slot for drop-off, and edit or cancel it yourself if your plans change.",
  },
  {
    icon: CircleCheck,
    title: "Live status tracking",
    description:
      "Follow the repair through diagnostics, engineering, parts, completed, and released — updated as it moves.",
  },
  {
    icon: Flag,
    title: "Transparent cost estimates",
    description:
      "Estimated and final repair costs are recorded on the request, so there are no surprises at pickup.",
  },
  {
    icon: ClipboardCheck,
    title: "Service history",
    description:
      "Every past repair stays attached to your account and to the specific device it belonged to.",
  },
]

export default function FeaturesSection() {
  return (
    <section className="bg-[#eef6ff] py-14 transition-colors duration-300 dark:bg-slate-900 md:h-screen md:py-0">
      <SectionContainer className="flex flex-col justify-center md:h-full">
        <div className="mx-auto max-w-[590px] text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[#123d85] dark:text-blue-200">
            What Compair handles for you
          </h2>

          <p className="mt-2 text-2xs leading-4 text-[#74839a] dark:text-slate-400">
            One account covers the whole repair process, from the
            first report to the day you pick your device back up.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}
        </div>
      </SectionContainer>
    </section>
  )
}
