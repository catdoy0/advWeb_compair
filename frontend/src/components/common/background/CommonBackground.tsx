import type { ReactNode } from "react";

interface BackgroundProps {
  children?: ReactNode;
  variant?: "purpleGradient" | "none";
  className?: string;
}

const backgrounds = {
  none:
    "bg-linear-to-b from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-800",
  purpleGradient: `
    bg-linear-to-b
    from-[#1c052f]
    via-[#451d7e]
    to-[#5d1e76]
  `,
}

/**
 *
 * Provides predefined background styles through variants while allowing
 * additional Tailwind classes to be customized with `className`.
 *
 * The component does not enforce a specific height, allowing the parent
 * component to control its size. For a full-page background, use
 * `min-h-screen` through `className`.
 *
 * @example
 * ```tsx
 * // Full-page application background
 * <CommonBackground className="min-h-screen">
 *   <LoginPage />
 * </CommonBackground>
 *
 * // Background with centered content
 * <CommonBackground
 *   variant="purpleGradient"
 *   className="min-h-screen flex items-center justify-center"
 * >
 *   <LoginForm />
 * </CommonBackground>
 *
 * // Background without a predefined style
 * <CommonBackground variant="none">
 *   <Content />
 * </CommonBackground>
 *
 * // Custom sizing
 * <CommonBackground
 *   variant="purpleGradient"
 *   className="h-[150px] w-[250px]"
 * />
 * ```
 */
export default function CommonBackground({
  children,
  variant = "purpleGradient",
  className = "",
}: BackgroundProps) {
  return (
    <div
      onDrop={(e) => { e.preventDefault()}}
      className={`
        w-full h-full
        ${backgrounds[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
