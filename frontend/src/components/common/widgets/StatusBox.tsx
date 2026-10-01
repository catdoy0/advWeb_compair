interface StatusProps {
  status?: Status;
}

export type Status =
  | "Confirmed" | "Pending" | "Completed" | "Cancelled" | "Diagnosing";

const statusClasses: Record<Status, string> = {
  Confirmed: "bg-[#e5f6ee] text-[#159a63]",
  Pending: "bg-[#fff5dc] text-[#b77900]",
  Completed: "bg-[#e9eef5] text-[#52647a]",
  Cancelled: "bg-[#feecec] text-[#c43d3d]",
  Diagnosing: "bg-[#fff5dc] text-[#b77900]",
};

export default function StatusBox({ status = "Pending" }: StatusProps) {
  return (
    <span
      className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
