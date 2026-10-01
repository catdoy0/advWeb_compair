import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2870e8]">
          {eyebrow}
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#102c50] dark:text-white">
          {title}
        </h1>

        <p className="mt-1 max-w-[700px] text-[12px] leading-5 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {action && (
        <div className="self-start xl:self-auto">
          {action}
        </div>
      )}
    </div>
  );
}
