export default function SummaryCard({
  label,
  value,
  detail,
  valueText = false,
}: {
  label: string;
  value: number | string;
  detail: string;
  valueText?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#d8e0eb] bg-white px-4 py-4 dark:border-slate-700 dark:bg-[#111c2b]">
      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-4 font-semibold text-[#102c50] dark:text-white ${valueText ? "text-[19px]" : "text-[27px]"}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </div>
  );
}
