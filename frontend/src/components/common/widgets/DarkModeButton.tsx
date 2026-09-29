import { Moon, Sun } from "lucide-react"
import { useTheme } from "../../../context/ThemeContext"


interface DarkModeButtonProps {
  /** 
   * 'absolute' for the top-right corner floating style.
   * 'inline' for standard layouts like navbars.
   * Defaults to 'inline'.
   */
  variant?: "inline" | "absolute";
  /** Optional extra classes to override or append styles */
  className?: string;
}

export default function DarkModeButton({ variant = "inline", className = "" }: DarkModeButtonProps) {
  const { isDark, toggleTheme } = useTheme();

  // Variant 1: Small Navbar/Inline Button
  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-pressed={isDark}
        className={`mr-1 grid h-7 w-7 place-items-center rounded-md text-[#4368a6] transition-colors hover:bg-[#eef6ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2458ae] dark:text-blue-300 dark:hover:bg-slate-800 ${className}`}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    );
  }

  // Variant 2: Absolute Floating Button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={`absolute right-6 top-6 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
