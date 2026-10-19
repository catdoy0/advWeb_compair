import { useNavigate } from "react-router";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Laptop,
  Plus,
  RefreshCw,
  Wrench,
} from "lucide-react";

import CommonButton from "../../../../components/common/widgets/CommonButton";
import PageHeader from "../../components/PageHeader";
import DashboardPage from "../../components/DashboardPage";
import DashboardPanel from "../../components/DashboardPanel";

// ---------- Static Mock Data ----------

const inMotion = [
  {
    id: "CP-1042",
    name: "Mika Santos",
    initials: "MS",
    device: 'MacBook Pro 14" · Battery health check',
    status: "Diagnosing",
    statusColor: "bg-[#fef3c7] text-[#b45309]",
  },
  {
    id: "CP-1041",
    name: "Carlo Mendoza",
    initials: "CM",
    device: "Lenovo ThinkPad T14 · Display replacement",
    status: "Repairing",
    statusColor: "bg-[#f3e8ff] text-[#7e22ce]",
  },
  {
    id: "CP-1038",
    name: "Luis Navarro",
    initials: "LN",
    device: "Acer Nitro 5 · Overheating and fan noise",
    status: "Completed",
    statusColor: "bg-[#e6f5ef] text-[#15946a]",
  },
  {
    id: "CP-1035",
    name: "Noel Garcia",
    initials: "NG",
    device: "HP ProDesk 400 · No power / diagnostics",
    status: "Diagnosing",
    statusColor: "bg-[#fef3c7] text-[#b45309]",
  },
];

const schedule = [
  {
    time: "09:30",
    name: "Carlo Mendoza",
    service: 'Screen replacement · Lenovo ThinkPad T14',
    status: "Confirmed",
    statusColor: "bg-[#e6f5ef] text-[#15946a]",
  },
  {
    time: "11:00",
    name: "Mika Santos",
    service: 'Initial diagnosis · MacBook Pro 14"',
    status: "Confirmed",
    statusColor: "bg-[#e6f5ef] text-[#15946a]",
  },
  {
    time: "13:30",
    name: "Amara Flores",
    service: "OS recovery · Dell Latitude 5420",
    status: "Pending",
    statusColor: "bg-slate-100 text-slate-600",
  },
  {
    time: "15:00",
    name: "Luis Navarro",
    service: "Release / pickup · Acer Nitro 5",
    status: "Confirmed",
    statusColor: "bg-[#e6f5ef] text-[#15946a]",
  },
];

const needsAttention = [
  {
    id: "CP-1042",
    name: "Mika Santos",
    device: 'MacBook Pro 14"',
    problem: "Battery health check",
    status: "Diagnosing",
    statusColor: "bg-[#fef3c7] text-[#b45309]",
    tech: "RG",
    techName: "R. Gomez",
    due: "Today, 2:30 PM",
  },
  {
    id: "CP-1041",
    name: "Carlo Mendoza",
    device: "Lenovo ThinkPad T14",
    problem: "Display replacement",
    status: "Repairing",
    statusColor: "bg-[#f3e8ff] text-[#7e22ce]",
    tech: "AR",
    techName: "A. Reyes",
    due: "Today, 4:00 PM",
  },
  {
    id: "CP-1040",
    name: "Janelle Cruz",
    device: "Dell Inspiron 15",
    problem: "OS recovery",
    status: "Received",
    statusColor: "bg-[#eef4ff] text-[#2870e8]",
    tech: null,
    techName: "Unassigned",
    due: "Tomorrow, 9:00 AM",
  },
  {
    id: "CP-1038",
    name: "Luis Navarro",
    device: "Acer Nitro 5",
    problem: "Overheating and fan noise",
    status: "Completed",
    statusColor: "bg-[#e6f5ef] text-[#15946a]",
    tech: "TV",
    techName: "T. Villanueva",
    due: "Ready for release",
  },
];

const recentActivity = [
  {
    icon: CheckCircle2,
    text: "Repair CP-1038 marked completed by T. Villanueva",
    time: "18 minutes ago",
  },
  {
    icon: Calendar,
    text: "New appointment booked for Amara Flores",
    time: "42 minutes ago",
  },
  {
    icon: Laptop,
    text: "Customer Paolo Dizon added a new device",
    time: "1 hour ago",
  },
  {
    icon: FileText,
    text: "Service report exported for August 2026",
    time: "Yesterday",
  },
];

const customerMessages = [
  {
    name: "Mika Santos",
    initials: "MS",
    preview: "Hello, Mika our technician is finishing the diagnosis...",
    time: "10:42 AM",
  },
  {
    name: "Carlo Mendoza",
    initials: "CM",
    preview: "Thank you, that works for me.",
    time: "9:18 AM",
  },
  {
    name: "Luis Navarro",
    initials: "LN",
    preview: "I can come by after 4 PM.",
    time: "Yesterday",
  },
];

// ---------- Page ----------

export default function AdminOverview() {
  const navigate = useNavigate();

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <PageHeader
        eyebrow="Computer & Laptop repair desk • Monday, September 14, 2026"
        title="Computer repair desk overview"
        description="Keep every computer and laptop moving from intake to release with one clear operational view."
        action={
          <div className="flex gap-2">
            <CommonButton
              variant="outline"
              className="flex items-center gap-2 px-4 py-2"
              onClick={() => {}}
            >
              <Download size={14} />
              Export snapshot
            </CommonButton>
            <CommonButton
              className="flex items-center gap-2 px-4 py-2"
              onClick={() => navigate("/dashboard/repair-queue")}
            >
              <Plus size={14} />
              New repair request
            </CommonButton>
          </div>
        }
      />

      {/* Top Stats Row */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              Estimated service value
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775]">
              <FileText size={14} />
            </div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">
            ₱84,500
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[10px] font-bold text-[#15946a]">+8.4%</p>
            <p className="text-[10px] text-slate-500">this month</p>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Based on logged repair work
          </p>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              Active repairs
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42]">
              <Wrench size={14} />
            </div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">
            6
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[10px] font-bold text-[#15946a]">+12%</p>
            <p className="text-[10px] text-slate-500">vs last Monday</p>
          </div>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              Ready for release
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775]">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">
            1
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[10px] font-bold text-[#15946a]">2 today</p>
            <p className="text-[10px] text-slate-500">awaiting pickup</p>
          </div>
        </div>

        <div className="rounded-lg border border-[#d8e0eb] bg-white p-5 dark:border-slate-700 dark:bg-[#111c2b]">
          <div className="flex items-start justify-between">
            <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400">
              Appointments today
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f]">
              <Calendar size={14} />
            </div>
          </div>
          <p className="mt-4 text-[32px] font-bold text-[#102c50] dark:text-white">
            4
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[10px] font-bold text-[#b45309]">3 open</p>
            <p className="text-[10px] text-slate-500">slots remaining</p>
          </div>
        </div>
      </div>

      {/* Middle Row: Repair Flow & Schedule */}
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(350px,1fr)]">
        
        {/* Repair Flow Panel */}
        <DashboardPanel
          title="Repair flow"
          description="Live view of requests by workflow stage."
          headerAction={
            <button
              onClick={() => navigate("/dashboard/repair-queue")}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline"
            >
              Open queue <ArrowRight size={12} />
            </button>
          }
        >
          <div className="p-5">
            {/* Workflow Stages */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5edf7] pb-5 dark:border-slate-700">
              {[
                { label: "Received", count: "02", color: "bg-[#2870e8]" },
                { label: "Diagnosing", count: "02", color: "bg-[#f59e0b]" },
                { label: "Repairing", count: "01", color: "bg-[#7e22ce]" },
                { label: "Completed", count: "01", color: "bg-[#15946a]" },
                { label: "Released", count: "01", color: "bg-slate-400" },
              ].map((stage) => (
                <div key={stage.label} className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {stage.label}
                    </p>
                    <p className="text-[14px] font-bold text-[#102c50] dark:text-white">
                      {stage.count}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              In motion now
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_200px]">
              {/* In motion list */}
              <div className="space-y-2">
                {inMotion.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[#e5edf7] bg-[#f8fafc] p-3 dark:border-slate-700 dark:bg-[#162334]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dceaff] text-[10px] font-bold text-[#2870e8]">
                        {item.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-500">
                          {item.id} · {item.device}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[9px] font-bold ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Queue Health */}
              <div className="flex flex-col justify-center rounded-lg bg-[#0b213d] p-4 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Queue health
                </p>
                <p className="mt-2 text-[32px] font-bold">72%</p>
                <p className="mt-1 text-[10px] text-slate-400">
                  Capacity used across the floor
                </p>
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        i <= 5 ? "bg-[#2870e8]" : "bg-[#1c3552]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DashboardPanel>

        {/* Today's Schedule Panel */}
        <DashboardPanel
          title="Today's schedule"
          description="Monday, September 14"
          headerAction={
            <button
              onClick={() => navigate("/dashboard/appointments")}
              className="text-slate-400 hover:text-[#2870e8]"
            >
              <ArrowRight size={16} />
            </button>
          }
        >
          <div className="p-5">
            {/* Date Box */}
            <div className="flex items-center gap-4 rounded-lg border border-[#e5edf7] bg-[#f8fafc] p-3 dark:border-slate-700 dark:bg-[#162334]">
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded bg-white text-[#2870e8] shadow-sm dark:bg-slate-800">
                <span className="text-[9px] font-bold uppercase leading-none">Sep</span>
                <span className="text-[18px] font-bold leading-none mt-1">14</span>
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#102c50] dark:text-white">
                  4 appointments
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  2 confirmed · 1 pending · 1 pickup
                </p>
              </div>
            </div>

            {/* Schedule List */}
            <div className="mt-4 space-y-4">
              {schedule.map((item) => (
                <div key={item.time} className="flex gap-4">
                  <div className="w-10 shrink-0 text-right">
                    <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
                      {item.time}
                    </p>
                  </div>
                  <div className="flex flex-1 items-start justify-between gap-2 border-b border-[#f1f5f9] pb-4 dark:border-slate-800">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">
                        {item.name}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-500">
                        {item.service}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-1 text-[9px] font-bold ${item.statusColor}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DashboardPanel>
      </div>

      {/* Bottom Row: Needs Attention & Recent Activity */}
      <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(350px,1fr)]">
        
        {/* Needs Attention */}
        <DashboardPanel
          title="Needs attention"
          description="Requests that need a next action from the team."
          headerAction={
            <button
              onClick={() => navigate("/dashboard/repair-queue")}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline"
            >
              View all <ArrowRight size={12} />
            </button>
          }
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-[#e5edf7] text-[9px] uppercase tracking-wider text-slate-400 dark:border-slate-700">
                <tr>
                  <th className="px-5 py-3 font-semibold">Request</th>
                  <th className="px-5 py-3 font-semibold">Customer / Device</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Technician</th>
                  <th className="px-5 py-3 font-semibold text-right">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
                {needsAttention.map((row) => (
                  <tr key={row.id} className="hover:bg-[#f8fafc] dark:hover:bg-[#162334]">
                    <td className="px-5 py-3">
                      <p className="font-bold text-[#102c50] dark:text-white">{row.id}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{row.problem}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-[#102c50] dark:text-white">{row.name}</p>
                      <p className="mt-0.5 text-[9px] text-slate-400">{row.device}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {row.tech ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#eef4ff] text-[8px] font-bold text-[#2870e8] dark:bg-[#172a42]">
                            {row.tech}
                          </div>
                          <span className="text-[10px] font-semibold text-[#102c50] dark:text-white">
                            {row.techName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <p className="font-semibold text-[#102c50] dark:text-white">{row.due}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>

        {/* Recent Activity */}
        <DashboardPanel
          title="Recent activity"
          description="Last 24 hours"
          headerAction={<RefreshCw size={14} className="text-slate-400" />}
        >
          <div className="p-5">
            <ul className="space-y-4">
              {recentActivity.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-slate-500 dark:bg-slate-800">
                    <item.icon size={12} />
                  </div>
                  <div>
                    <p className="text-[11px] leading-tight text-[#102c50] dark:text-slate-300">
                      {item.text}
                    </p>
                    <p className="mt-1 text-[9px] text-slate-400">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </DashboardPanel>
      </div>

      {/* Full Width: Customer Messages */}
      <div className="mt-4">
        <DashboardPanel
          title="Customer messages"
          description="0 unread messages • latest repair questions"
          headerAction={
            <button
              onClick={() => navigate("/dashboard/messages")}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline"
            >
              Open inbox <ArrowRight size={12} />
            </button>
          }
        >
          <div className="grid grid-cols-1 divide-y divide-[#e5edf7] md:grid-cols-3 md:divide-x md:divide-y-0 dark:divide-slate-700">
            {customerMessages.map((msg) => (
              <div key={msg.name} className="flex cursor-pointer items-center gap-3 p-4 hover:bg-[#f8fafc] dark:hover:bg-[#162334]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#2870e8] dark:bg-[#172a42]">
                  {msg.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">
                      {msg.name}
                    </p>
                    <span className="shrink-0 text-[9px] text-slate-400">
                      {msg.time}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {msg.preview}
                  </p>
                </div>
                <ChevronRight size={14} className="shrink-0 text-slate-400" />
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

    </DashboardPage>
  );
}
