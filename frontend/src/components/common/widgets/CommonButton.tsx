import type { ButtonHTMLAttributes, ReactNode } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?:
    | "none"
    | "primary"
    | "secondary"
    | "outline"
    | "gray"
    | "icon"
}

const colors = {
  none: "",
  primary: "bg-[#17499d] hover:bg-[#123d85] text-white ",
  secondary: "bg-[#2d65c8] hover:bg-[#2455a8] text-white ",
  outline:
    "bg-white border-2 border-[#1e40af] hover:bg-[#f5f9ff] text-[#2453a0] dark:border-slate-600 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700",
  gray: "bg-gray-200 hover:bg-gray-300 text-gray-600",
  icon: "text-slate-500 hover:bg-[#142f50] hover:text-slate-300",
}

/**
 * Reusable application button with a unified design.
 *
 * @example
 * <CommonButton variant="primary">
 *   Create account
 * </CommonButton>
 *
 * <CommonButton variant="outline">
 *   Sign in
 * </CommonButton>
 *
 * <CommonButton variant="icon" aria-label="Log out">
 *   <LogOut size={13} />
 * </CommonButton>
 */
export default function CommonButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const isIcon = variant === "icon"

  return (
    <button
      {...props}
      className={`
        ${
          isIcon
            ? "flex h-6 w-6 shrink-0 items-center justify-center rounded"
            : "rounded-lg px-4 py-2.5 text-2xs font-semibold shadow-sm"
        }
        ${colors[variant]}
        transition-colors
        disabled:cursor-not-allowed
        disabled:opacity-60
        active:scale-95
        hover:cursor-pointer
        ${className}
      `}
    >
      {children}
    </button>
  )
}
