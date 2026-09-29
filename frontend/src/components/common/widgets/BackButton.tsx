import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router"

interface BackButtonProps {
  /**
   * 'absolute' for a floating corner control (top-left).
   * 'inline' for standard layouts like navbars and headers.
   * Defaults to 'inline'.
   */
  variant?: "inline" | "absolute"
  hideOnDesktop?: boolean
  to?: number | string
  className?: string
}

export default function BackButton({
  variant = "inline",
  hideOnDesktop = false,
  to = -1,
  className = "",
}: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (typeof to === "number") navigate(to)
    else navigate(to)
  }

  const hide = hideOnDesktop ? "lg:hidden" : ""

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Go back"
        className={`
          mr-1
          grid
          h-7
          w-7
          place-items-center
          rounded-md
          text-[#4368a6]
          transition-colors
          hover:bg-[#eef6ff]
          focus:outline-none
          focus-visible:ring-2
          focus-visible:ring-[#2458ae]
          dark:text-blue-300
          dark:hover:bg-slate-800
          ${hide}
          ${className}
        `}
      >
        <ArrowLeft size={14} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Go back"
      className={`
        absolute
        left-6
        top-6
        rounded-full
        p-2
        text-slate-400
        transition-colors
        hover:bg-slate-100
        dark:text-slate-500
        dark:hover:bg-slate-800
        ${hide}
        ${className}
      `}
    >
      <ArrowLeft size={18} />
    </button>
  )
}
