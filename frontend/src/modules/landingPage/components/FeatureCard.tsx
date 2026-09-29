import type { LucideIcon } from "lucide-react"

import CommonCard from "../../../components/common/CommonCard"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <CommonCard className="p-6">
      <Icon
        size={15}
        className="text-[#285ab0] dark:text-blue-400"
      />

      <h3 className="mt-5 text-caption font-bold text-[#19458e] dark:text-blue-200">
        {title}
      </h3>

      <p className="mt-2 text-3xs leading-4 text-[#78869a] dark:text-slate-400">
        {description}
      </p>
    </CommonCard>
  )
}
