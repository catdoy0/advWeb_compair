import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"


/** Theme state and actions shared throughout the app. */
interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}


/**
 * Shares the current application theme and theme actions.
 *
 * Usually, use {@link useTheme} instead of consuming this context directly.
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)


/**
 * Provides theme state to its child components.
 *
 * Wrap the application once, usually at the root:
 * ```tsx
 * <ThemeProvider><App /></ThemeProvider>
 * ```
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState((): boolean => {
    const savedTheme = localStorage.getItem("theme")

    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches
  })


  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)

    localStorage.setItem(
      "theme",
      isDark ? "dark" : "light"
    )
  }, [isDark])


  function toggleTheme() {
    setIsDark((current) => !current)
  }


  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}


/**
 * Gets the current theme state and theme actions.
 *
 * Must be called inside a {@link ThemeProvider}.
 * ```tsx
 * const { isDark, toggleTheme } = useTheme();
 * ```
 */
export function useTheme() {
  const ctx = useContext(ThemeContext)

  if (!ctx) {
    throw new Error("useTheme must be used inside ThemeProvider")
  }

  return ctx
}
