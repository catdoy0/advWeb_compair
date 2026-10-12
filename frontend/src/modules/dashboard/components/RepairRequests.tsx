import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import DashboardPanel from "../components/DashboardPanel";
import type { CustomerOverviewRecentRequest } from "../../../types/repair_requests";

dayjs.extend(relativeTime);

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
  RECEIVED: "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]",
  DIAGNOSING: "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]",
  REPAIRING: "bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
  COMPLETED: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
  RELEASED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-[#fdecec] text-[#c0392b] dark:bg-[#3a1717] dark:text-[#f87171]",
  REJECTED: "bg-[#fdecec] text-[#c0392b] dark:bg-[#3a1717] dark:text-[#f87171]",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  COMPLETED: "Completed",
  RELEASED: "Released",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export default function RepairRequests({
  requests,
  loading,
}: {
  requests: CustomerOverviewRecentRequest[];
  loading: boolean;
}) {
  const navigate = useNavigate();

  return (
    <DashboardPanel
      title="Your repair requests"
      description="Track every request you've submitted."
      headerAction={
        <button
          type="button"
          onClick={() => navigate("/dashboard/mydevices")}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#2870e8] hover:underline"
        >
          View all
          <ArrowRight size={11} />
        </button>
      }
    >
      {loading ? (
        <p className="px-5 py-10 text-center text-[11px] text-slate-400">
          Loading...
        </p>
      ) : requests.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-[12px] font-semibold text-[#102c50] dark:text-white">
            No repair requests yet
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Submit a request from the Appointments page.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#e8eef7] dark:divide-slate-700">
          {requests.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="font-mono text-[11px] font-bold text-[#102c50] dark:text-white">
                  {r.repair_number}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {r.computer_name} · {r.reported_problem}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[9px] text-slate-400">
                  {dayjs(r.created_at).fromNow()}
                </span>
                <span
                  className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${
                    STATUS_BADGE[r.status] ?? STATUS_BADGE.PENDING
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
