import type { ReactNode } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react"

interface CommonTopBannerProps {
  children: ReactNode
  variant?: "warning" | "error" | "info" | "success"
  icon?: ReactNode
}

const variants = {
  warning: {
    container: "bg-amber-500 text-white",
    icon: <AlertTriangle size={16} />,
  },

  error: {
    container: "bg-red-500 text-white",
    icon: <AlertCircle size={16} />,
  },

  info: {
    container: "bg-blue-500 text-white",
    icon: <Info size={16} />,
  },

  success: {
    container: "bg-emerald-500 text-white",
    icon: <CheckCircle size={16} />,
  },
}

export default function CommonTopBanner({
  children,
  variant = "info",
  icon,
}: CommonTopBannerProps) {
  const style = variants[variant]

  return (
    <div
      className={`
        flex
        min-h-10
        items-center
        justify-center
        gap-2
        px-4
        py-2
        text-sm
        font-medium
        ${style.container}
      `}
    >
      {icon ?? style.icon}

      <span>
        {children}
      </span>
    </div>
  )
}
