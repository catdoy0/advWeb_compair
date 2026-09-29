import { MessageCircle, Package, Wrench } from "lucide-react"

import Logo from "../../../components/common/widgets/Logo"

const highlights = [
  {
    icon: MessageCircle,
    title: "Talk to the shop",
    description:
      "Keep computer repair questions and updates attached to the request.",
  },
  {
    icon: Wrench,
    title: "Know what happens next",
    description:
      "Follow every laptop or desktop from intake through release.",
  },
  {
    icon: Package,
    title: "Ready parts, ready work",
    description:
      "Keep the right parts ready for laptop and desktop repairs.",
  },
]

export default function SignInLeftPanel() {
  return (
    <div className="hidden md:hidden w-1/2 flex-col justify-between bg-[#0b1a2e] px-16 py-12 lg:flex">
      <div className="flex items-center gap-3">
        <Logo size={50} variant="title"/>
      </div>

      <div className="max-w-md">
        <p className="mb-4 text-xs font-bold tracking-widest text-blue-400">
          COMPUTER & LAPTOP REPAIR WITHOUT THE GUESSWORK
        </p>
        <h1 className="text-5xl font-extrabold leading-tight text-white">
          A clearer way to repair every computer.
        </h1>
        <p className="mt-6 max-w-md text-slate-400">
          Give customers a direct line to your computer repair shop, help
          technicians stay on top of assigned laptops and desktops, and
          keep parts ready for the work that comes next.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6 border-t border-slate-700 pt-6">
        {highlights.map((point) => {
          const Icon = point.icon

          return (
            <div key={point.title}>
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                <Icon size={16} className="text-blue-400" />
              </div>

              <h3 className="text-xs font-bold text-white">
                {point.title}
              </h3>

              <p className="mt-1 text-xs leading-4 text-slate-400">
                {point.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
