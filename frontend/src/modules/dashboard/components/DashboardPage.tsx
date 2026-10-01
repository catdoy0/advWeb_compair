import type { ReactNode } from "react";

interface DashboardPageProps {
  children: ReactNode;
  /** Keep the wider default for directory and operations pages. */
  maxWidth?: "1180px" | "1240px";
  className?: string;
}

export default function DashboardPage({
  children,
  maxWidth = "1240px",
  className = "dark:bg-[#0f1724]",
}: DashboardPageProps) {
  const widthClass = maxWidth === "1180px" ? "max-w-[1180px]" : "max-w-[1240px]";

  return (
    <main className={`flex-1 ${className}`}>
      <div className={`mx-auto ${widthClass} p-5 lg:p-7`}>
        {children}
      </div>
    </main>
  );
}
