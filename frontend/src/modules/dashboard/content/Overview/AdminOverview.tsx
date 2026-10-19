import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  RefreshCw,
  Wrench,
} from "lucide-react";
import dayjs from "dayjs";

import { getAdminOverview } from "../../../../api/administration";
import type { AdminOverviewData } from "../../../../types/administration";
import { useEvents } from "../../../../context/EventContext";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import StatusBox, { type Status } from "../../../../components/common/widgets/StatusBox";
import PageHeader from "../../components/PageHeader";
import DashboardPage from "../../components/DashboardPage";
import DashboardPanel from "../../components/DashboardPanel";
import CreateRepairRequestModal from "../../modals/CreateRepairRequestModal";

const FLOW_STAGES = [
  { label: "Received", status: "RECEIVED", color: "bg-[#2870e8]" },
  { label: "Diagnosing", status: "DIAGNOSING", color: "bg-[#f59e0b]" },
  { label: "Repairing", status: "REPAIRING", color: "bg-[#7e22ce]" },
  { label: "Completed", status: "COMPLETED", color: "bg-[#15946a]" },
  { label: "Released", status: "RELEASED", color: "bg-slate-400" },
];

const STATUS_LABELS: Record<string, Status> = {
  PENDING: "Pending",
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  COMPLETED: "Completed",
  RELEASED: "Released",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  CONFIRMED: "Confirmed",
  NO_SHOW: "No show",
};

function displayStatus(status: string): Status {
  return STATUS_LABELS[status] ?? "Pending";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function exportSnapshot(data: AdminOverviewData) {
  const rows = [
    ["Metric", "Value"],
    ["Snapshot date", data.date],
    ["Estimated service value", data.estimated_service_value.toFixed(2)],
    ["Active repairs", String(activeRepairCount(data))],
    ["Ready for release", String(data.repair_counts.COMPLETED ?? 0)],
    ["Appointments", String(data.schedule.length)],
    ["Unread messages", String(data.unread_messages)],
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `admin-overview-${data.date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function activeRepairCount(data: AdminOverviewData) {
  return ["PENDING", "RECEIVED", "DIAGNOSING", "REPAIRING"].reduce(
    (total, status) => total + (data.repair_counts[status] ?? 0),
    0,
  );
}

export default function AdminOverview() {
  const navigate = useNavigate();
  const { subscribe } = useEvents();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const today = dayjs().format("YYYY-MM-DD");

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    const result = await getAdminOverview(today);
    setData(result);
    setError(!result);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    ( async () => {
      void refresh(true);
    })();
  }, [refresh]);

  useEffect(() => {
    const update = () => { void refresh(); };
    const removeMessageListener = subscribe("new-message", update);
    const removeNotificationListener = subscribe("new-notification", update);
    return () => {
      removeMessageListener();
      removeNotificationListener();
    };
  }, [refresh, subscribe]);

  const activeRepairs = data ? activeRepairCount(data) : 0;
  const todayDate = dayjs(today);
  const openSlots = Math.max(0, 6 - (data?.schedule.length ?? 0));

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <CreateRepairRequestModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onUpdated={() => { void refresh(); }}
        selectCustomer
      />

      <PageHeader
        eyebrow={`Computer repair desk · ${todayDate.format("dddd, MMMM D, YYYY")}`}
        title="Computer repair desk overview"
        description="Track repair requests, today’s appointments, and customer conversations."
        action={
          <div className="flex gap-2">
            <CommonButton
              variant="outline"
              className="flex items-center gap-2 px-4 py-2"
              disabled={!data}
              onClick={() => data && exportSnapshot(data)}
            >
              Export snapshot
            </CommonButton>
            <CommonButton
              variant="primary"
              className="flex items-center gap-2 px-4 py-2"
              onClick={() => navigate("/dashboard/repair-queue")}
            >
              <ArrowRight size={14} />
              Repair queue
            </CommonButton>
            {/* <CommonButton */}
            {/*   className="flex items-center gap-2 px-4 py-2" */}
            {/*   onClick={() => setCreateModalOpen(true)} */}
            {/* > */}
            {/*   <Plus size={14} /> */}
            {/*   New Repair Request */}
            {/* </CommonButton> */}
          </div>
        }
      />

      {error && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>Could not load the overview. Check your connection and try again.</span>
          <button onClick={() => void refresh(true)} className="font-semibold hover:underline">Retry</button>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Estimated service value</p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775]"><FileText size={14} /></div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">
            {loading ? "…" : (data?.estimated_service_value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 })}
          </p>
          <p className="mt-2 text-[10px] text-slate-400">Logged estimates for open requests</p>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Active repairs</p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42]"><Wrench size={14} /></div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">{loading ? "…" : activeRepairs}</p>
          <p className="mt-2 text-[10px] text-slate-400">Requests in progress or awaiting intake</p>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Ready for release</p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775]"><CheckCircle2 size={14} /></div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">{loading ? "…" : data?.repair_counts.COMPLETED ?? 0}</p>
          <p className="mt-2 text-[10px] text-slate-400">Completed and awaiting customer pickup</p>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">Appointments today</p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f]"><Calendar size={14} /></div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">{loading ? "…" : data?.schedule.length ?? 0}</p>
          <p className="mt-2 text-[10px] text-slate-400">{openSlots} booking slots remaining today</p>
        </div>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(350px,1fr)]">
        <DashboardPanel
          title="Repair flow"
          description="Current request counts by workflow stage."
          headerAction={<button onClick={() => navigate("/dashboard/repair-queue")} className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline">Open queue <ArrowRight size={12} /></button>}
        >
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5edf7] pb-5 dark:border-slate-700">
              {FLOW_STAGES.map((stage) => (
                <div key={stage.status} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{stage.label}</p>
                    <p className="text-[14px] font-bold text-[#102c50] dark:text-white">{loading ? "—" : data?.repair_counts[stage.status] ?? 0}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">In progress</p>
              <span className="text-[10px] text-slate-400">{data?.in_motion.length ?? 0} shown</span>
            </div>
            <div className="mt-3 space-y-2">
              {data?.in_motion.length ? data.in_motion.map((item) => (
                <button key={item.id} onClick={() => navigate("/dashboard/repair-queue")} className="flex w-full items-center justify-between gap-3 rounded-md border border-[#e5edf7] bg-[#f8fafc] p-3 text-left dark:border-slate-700 dark:bg-[#162334]">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dceaff] text-[10px] font-bold text-[#2870e8]">{initials(item.customer_name)}</div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">{item.customer_name}</p>
                      <p className="truncate text-[9px] text-slate-500">{item.repair_number} · {item.computer_name} · {item.requested_service}</p>
                    </div>
                  </div>
                  <StatusBox status={displayStatus(item.status)} />
                </button>
              )) : <p className="py-4 text-center text-[11px] text-slate-400">{loading ? "Loading repair requests…" : "No repairs currently in progress."}</p>}
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Today's schedule"
          description={todayDate.format("dddd, MMMM D")}
          headerAction={<button aria-label="Open appointments" onClick={() => navigate("/dashboard/appointments")} className="text-slate-400 hover:text-[#2870e8]"><ArrowRight size={16} /></button>}
        >
          <div className="p-5">
            <div className="flex items-center gap-4 rounded-lg border border-[#e5edf7] bg-[#f8fafc] p-3 dark:border-slate-700 dark:bg-[#162334]">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-white text-[#2870e8] shadow-sm dark:bg-slate-800">
                <span className="text-[9px] font-bold uppercase leading-none">{todayDate.format("MMM")}</span>
                <span className="mt-1 text-[18px] font-bold leading-none">{todayDate.format("D")}</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#102c50] dark:text-white">{data?.schedule.length ?? 0} appointments</p>
                <p className="mt-0.5 text-[10px] text-slate-400">Today’s scheduled customer visits</p>
              </div>
            </div>
            <div className="mt-4 space-y-4">
              {data?.schedule.length ? data.schedule.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-14 shrink-0 text-right"><p className="text-[11px] font-bold text-[#102c50] dark:text-white">{dayjs(`2000-01-01T${item.time}`).format("h:mm A")}</p></div>
                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2 border-b border-[#f1f5f9] pb-4 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">{item.customer_name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">{item.requested_service} · {item.computer_name}</p>
                    </div>
                    <StatusBox status={displayStatus(item.status)} />
                  </div>
                </div>
              )) : <p className="py-5 text-center text-[11px] text-slate-400">{loading ? "Loading appointments…" : "No appointments scheduled today."}</p>}
            </div>
          </div>
        </DashboardPanel>
      </div>

      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(350px,1fr)]">
        <DashboardPanel
          title="Needs attention"
          description="New, unassigned, or completed requests that need a team action."
          headerAction={<button onClick={() => navigate("/dashboard/repair-queue")} className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline">View queue <ArrowRight size={12} /></button>}
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-[#e5edf7] text-[9px] uppercase tracking-wider text-slate-400 dark:border-slate-700">
                <tr><th className="px-5 py-3 font-semibold">Request</th><th className="px-5 py-3 font-semibold">Customer / Device</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Technician</th><th className="px-5 py-3 text-right font-semibold">Requested date</th></tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
                {data?.needs_attention.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#162334]">
                    <td className="px-5 py-3"><p className="font-bold text-[#102c50] dark:text-white">{item.repair_number}</p><p className="mt-0.5 text-[9px] text-slate-400">{item.reported_problem}</p></td>
                    <td className="px-5 py-3"><p className="font-bold text-[#102c50] dark:text-white">{item.customer_name}</p><p className="mt-0.5 text-[9px] text-slate-400">{item.computer_name}</p></td>
                    <td className="px-5 py-3"><StatusBox status={displayStatus(item.status)} /></td>
                    <td className="px-5 py-3 text-[10px] text-slate-500">{item.technician_name ?? "Unassigned"}</td>
                    <td className="px-5 py-3 text-right"><p className="font-semibold text-[#102c50] dark:text-white">{dayjs(item.preferred_date).format("MMM D")}</p><p className="text-[9px] text-slate-400">{dayjs(`2000-01-01T${item.preferred_time}`).format("h:mm A")}</p></td>
                  </tr>
                ))}
                {!loading && !data?.needs_attention.length && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No requests need attention.</td></tr>}
                {loading && <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">Loading requests…</td></tr>}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Recently updated repairs"
          description="Most recently created or updated requests."
          headerAction={<button aria-label="Refresh overview" onClick={() => void refresh(true)} className="text-slate-400 hover:text-[#2870e8]"><RefreshCw size={14} /></button>}
        >
          <div className="p-5">
            <ul className="space-y-4">
              {data?.recent_repairs.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-slate-500 dark:bg-slate-800"><Wrench size={12} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] leading-tight text-[#102c50] dark:text-slate-300">{item.repair_number} · {item.customer_name}</p>
                    <p className="mt-1 truncate text-[9px] text-slate-400">{item.computer_name} · {dayjs(item.activity_at).format("MMM D, h:mm A")}</p>
                  </div>
                  <StatusBox status={displayStatus(item.status)} />
                </li>
              ))}
              {!loading && !data?.recent_repairs.length && <li className="py-4 text-center text-[11px] text-slate-400">No repair requests yet.</li>}
            </ul>
          </div>
        </DashboardPanel>
      </div>

      <div className="mt-4">
        <DashboardPanel
          title="Customer messages"
          description={`${data?.unread_messages ?? 0} unread messages · latest conversations`}
          headerAction={<button onClick={() => navigate("/dashboard/messages")} className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline">Open inbox <ArrowRight size={12} /></button>}
        >
          <div className="grid grid-cols-1 divide-y divide-[#e5edf7] md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-slate-700">
            {data?.messages.map((message) => (
              <button key={message.conversation_id} onClick={() => navigate("/dashboard/messages")} className="flex items-center gap-3 p-4 text-left hover:bg-[#f8fafc] dark:hover:bg-[#162334]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#2870e8] dark:bg-[#172a42]">{initials(message.customer_name)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">{message.customer_name}</p>
                    <span className="shrink-0 text-[9px] text-slate-400">{dayjs(message.last_message_at).format("h:mm A")}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{message.repair_number ? `${message.repair_number} · ` : ""}{message.preview}</p>
                </div>
                {message.unread_count > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-[#2870e8]" aria-label="Unread" />}
                <ChevronRight size={14} className="shrink-0 text-slate-400" />
              </button>
            ))}
            {!loading && !data?.messages.length && <p className="col-span-full p-6 text-center text-[11px] text-slate-400">No customer messages yet.</p>}
            {loading && <p className="col-span-full p-6 text-center text-[11px] text-slate-400">Loading messages…</p>}
          </div>
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
