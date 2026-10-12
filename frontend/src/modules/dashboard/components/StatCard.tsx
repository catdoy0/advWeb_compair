import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  variant: "blue" | "orange" | "cyan";
  detail?: string;
  detailMuted?: string;
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  detail,
  detailMuted,
  onClick,
}: StatCardProps) {
  const iconStyles = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        rounded-lg
        border
        border-[#dce4ee]
        bg-white
        p-4
        dark:border-slate-800
        dark:bg-slate-900
        ${onClick ? "cursor-pointer transition-colors hover:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-medium text-slate-500">
          {label}
        </p>

        <div
          className={`
            rounded-md
            p-2
            ${iconStyles[variant]}
          `}
        >
          <Icon size={14} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-[#143252] dark:text-white">
        {value}
      </p>

      {(detail || detailMuted) && (
        <div className="mt-2 flex items-center gap-1 text-[9px]">
          {detail && (
            <span className="font-semibold text-emerald-600">
              {detail}
            </span>
          )}

          {detailMuted && (
            <span className="text-slate-400">
              {detailMuted}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
