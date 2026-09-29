import type { HTMLAttributes, ReactNode } from "react"

interface CommonCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function CommonCard({
  children,
  className = "",
  ...props
}: CommonCardProps) {
  return (
    <div
      {...props}
      className={`
        rounded-lg
        border
        border-[#dce7f5] dark:border-slate-700
        bg-white dark:bg-slate-800
        shadow-[0_2px_5px_rgba(30,65,110,0.025)]
        ${className}
      `}
    >
      {children}
    </div>
  )
}
