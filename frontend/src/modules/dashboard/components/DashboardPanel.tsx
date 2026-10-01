import type { ReactNode } from "react";

interface DashboardPanelProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export default function DashboardPanel({
  children,
  title,
  description,
  headerAction,
  className = "",
  headerClassName = "",
  contentClassName = "",
}: DashboardPanelProps) {
  const hasHeader = title || description || headerAction;

  return (
    <section
      className={`overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b] ${className}`}
    >
      {hasHeader && (
        <header
          className={`flex items-center justify-between gap-3 border-b border-[#d8e0eb] px-5 py-4 dark:border-slate-700 ${headerClassName}`}
        >
          <div>
            {title && (
              <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[11px] text-slate-400">{description}</p>
            )}
          </div>
          {headerAction}
        </header>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
