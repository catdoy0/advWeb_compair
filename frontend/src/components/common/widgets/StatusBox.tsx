interface StatusProps {
  status?: Status;
}

export type Status =
  | "Confirmed"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "Diagnosing"
  | "Received"
  | "Repairing"
  | "Released"
  | "Rejected"
  | "No show";

const statusClasses: Record<Status, string> = {
  Confirmed: "bg-[#e5f6ee] text-[#159a63] dark:bg-emerald-950/60 dark:text-emerald-300",
  Pending: "bg-[#fff5dc] text-[#b77900] dark:bg-amber-950/60 dark:text-amber-300",
  Completed: "bg-[#e9eef5] text-[#52647a] dark:bg-slate-700 dark:text-slate-200",
  Cancelled: "bg-[#feecec] text-[#c43d3d] dark:bg-rose-950/60 dark:text-rose-300",
  Diagnosing: "bg-[#fff5dc] text-[#b77900] dark:bg-amber-950/60 dark:text-amber-300",
  Received: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  Repairing: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300",
  Released: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  "No show": "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
};

export default function StatusBox({ status = "Pending" }: StatusProps) {
  return (
    <span
      className={`inline-flex w-fit max-w-full min-w-0 shrink items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded px-2 py-1 text-[9px] font-bold leading-tight ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
