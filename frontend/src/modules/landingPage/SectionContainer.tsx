import type { ReactNode } from "react"

interface SectionContainerProps {
  children: ReactNode
  className?: string
}

export default function SectionContainer({
  children,
  className = "",
}: SectionContainerProps) {
  return (
    <div
      className={`
        mx-auto
        w-full
        max-w-6xl
        xl:max-w-[calc(90vw)]
        px-5
        lg:px-8
        ${className}
      `}
    >
      {children}
    </div>
  )
}
