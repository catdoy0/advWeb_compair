import type { LucideIcon } from "lucide-react"

interface CommunicationCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function CommunicationCard({
  icon: Icon,
  title,
  description,
}: CommunicationCardProps) {
  return (
    <div>
      <Icon
        size={14}
        className="text-[#315fb1] dark:text-blue-400"
      />

      <h3 className="mt-4 text-caption font-bold text-[#19458e] dark:text-blue-200">
        {title}
      </h3>

      <p className="mt-2 text-3xs leading-4 text-[#78869a] dark:text-slate-400">
        {description}
      </p>
    </div>
  )
}
