export default function AccountFilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[11px] font-semibold transition-colors ${
        active
          ? "bg-[#eef4ff] dark:bg-[#1d4775] text-[#2870e8] dark:text-[#6c9df0] ring-1 ring-[#cfe0ff] dark:ring-[#1d4775]"
          : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
      }`}
    >
      {label}
      <span className={active ? "text-[#7da9ee]" : "text-slate-400"}>{count}</span>
    </button>
  );
}
