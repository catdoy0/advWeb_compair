import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

interface DarkModeButtonProps {
  variant?: "inline" | "absolute";
  className?: string;
}

export default function DarkModeButton({ variant = "inline", className = "" }: DarkModeButtonProps) {
  const { isDark, toggleTheme } = useTheme();
  const position = variant === "absolute"
    ? "absolute right-6 top-6 rounded-full p-2"
    : "mr-1 grid h-7 w-7 place-items-center rounded-md";

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      toggleTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      // Update the class before the new view is captured; React state follows it.
      document.documentElement.classList.toggle("dark", !isDark);
      toggleTheme();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 450,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    }).catch(() => {
      // The theme change has already been applied if the transition cannot start.
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={`${position} text-slate-600 transition-colors hover:bg-[#eef6ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
    >
      {isDark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}
