import { useState, type InputHTMLAttributes, type ReactNode } from "react"
import { Eye, EyeOff } from "lucide-react"

type BaseVariant = "default" | "compact"
type CommonInputVariant = BaseVariant | "password"

const styles: Record<BaseVariant, { label: string; input: string }> = {
  default: {
    label:
      "mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300",
    input: `
      rounded-lg border border-slate-300 bg-white
      py-2.5 text-sm text-slate-900
      transition-colors
      focus:border-[#2d65c8]
      dark:border-slate-700 dark:bg-slate-900 dark:text-white
    `,
  },
  compact: {
    label:
      "mb-1 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400",
    input: `
      h-9 rounded-md border border-slate-200 bg-slate-50
      text-sm text-slate-800
      transition-colors
      focus:border-[#2d65c8]
      dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100
    `,
  },
}

interface CommonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  /**
   * 'default'  — rounded-lg, slate chrome (matches the auth forms)
   * 'compact'  — shorter, subtler, good for toolbars/filters
   * 'password' — same look as 'default' + eye/eye-off visibility toggle
   */
  variant?: CommonInputVariant
}

/**
 * @example
 * // Basic input
 * <CommonInput id="email" label="Email Address" type="email" placeholder="admin@gmail.com" />
 *
 * @example
 * // Password with show/hide toggle
 * <CommonInput id="password" label="Password" variant="password" placeholder="Enter your password" />
 *
 * @example
 * // With an icon
 * <CommonInput id="email" label="Email" type="email" icon={<Mail size={18} />} />
 *
 * @example
 * // Required indicator
 * <CommonInput id="lastName" label="Last name" required placeholder="e.g. Cruz" />
 */
export default function CommonInput({
  label,
  icon,
  variant = "default",
  className = "",
  type,
  required,
  ...props
}: CommonInputProps) {
  const isPassword = variant === "password"
  const baseVariant: BaseVariant = isPassword ? "default" : variant
  const { label: labelClass, input: inputClass } = styles[baseVariant]

  const [showPassword, setShowPassword] = useState(false)

  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type

  return (
    <div>
      {label && (
        <label htmlFor={props.id} className={labelClass}>
          <span>{label}</span>
          {required && (
            <span className="text-[#2d65c8] dark:text-blue-400">
              Required
            </span>
          )}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          {...props}
          required={required}
          type={resolvedType}
          className={`
            w-full outline-none
            ${icon ? "pl-10" : "pl-4"}
            ${isPassword ? "pr-11" : "pr-4"}
            ${inputClass}
            ${className}
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  )
}
