import { useNavigate } from "react-router";
import { ArrowRight, Download, UserPlus } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

// ---------- Static Mock Data ----------

const technicians = [
  {
    id: 1,
    name: "Rafael Gomez",
    initials: "RG",
    avatarColor: "bg-[#e2e8f0] text-slate-600",
    activeCount: 6,
    status: "Active",
    capacity: 72,
    capacityColor: "bg-[#2870e8]",
  },
  {
    id: 2,
    name: "Arianna Reyes",
    initials: "AR",
    avatarColor: "bg-[#dcfce7] text-[#166534]",
    activeCount: 5,
    status: "Active",
    capacity: 64,
    capacityColor: "bg-[#15946a]",
  },
  {
    id: 3,
    name: "Tomas Villanueva",
    initials: "TV",
    avatarColor: "bg-[#fef08a] text-[#854d0e]",
    activeCount: 7,
    status: "Active",
    capacity: 84,
    capacityColor: "bg-[#d97706]",
  },
  {
    id: 4,
    name: "Sofia Macaraig",
    initials: "SM",
    avatarColor: "bg-[#f3e8ff] text-[#6b21a8]",
    activeCount: 3,
    status: "Active",
    capacity: 38,
    capacityColor: "bg-[#2870e8]",
  },
];

const unassignedRequests = [
  {
    id: "CP-1040",
    customer: "Janelle Cruz",
    issue: "OS recovery",
    due: "Tomorrow, 9:00 AM",
  },
  {
    id: "CP-1034",
    customer: "Ivy Salazar",
    issue: "Keyboard replacement",
    due: "Tomorrow, 11:00 AM",
  },
];

// ---------- Page ----------

export default function Technicians() {
  const navigate = useNavigate();

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <PageHeader
        eyebrow="Manage / People"
        title="Technician workspace"
        description="Balance assignments without losing the detail behind each repair."
        action={
          <div className="flex gap-2">
            <CommonButton
              variant="outline"
              className="flex items-center gap-2 px-4 py-2"
            >
              <Download size={14} />
              Export roster
            </CommonButton>
            <CommonButton className="flex items-center gap-2 px-4 py-2">
              <UserPlus size={14} />
              Add technician
            </CommonButton>
          </div>
        }
      />

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(350px,1fr)]">
        
        {/* Left Column - Roster */}
        <DashboardPanel
          title="Technician roster"
          description="Current assignments by person"
          contentClassName="p-0"
        >
          <div className="divide-y divide-[#e5edf7] dark:divide-slate-700">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${tech.avatarColor}`}
                  >
                    {tech.initials}
                  </div>
                  <p className="text-[13px] font-bold text-[#102c50] dark:text-white">
                    {tech.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                    {tech.activeCount} active
                  </span>
                  <span className="rounded bg-[#e6f5ef] px-2 py-1 text-[10px] font-bold text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]">
                    {tech.status}
                  </span>
                  <button
                    type="button"
                    className="text-[12px] font-bold text-[#2870e8] hover:underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        {/* Right Column - Capacity */}
        <DashboardPanel
          title="Capacity by technician"
          description="Keep assignments below 85%"
          contentClassName="p-5"
        >
          <div className="space-y-5">
            {technicians.map((tech) => (
              <div key={tech.id} className="flex items-center gap-4">
                <p className="w-16 truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {tech.name.split(" ")[0]}
                </p>
                
                <div className="flex-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9] dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${tech.capacityColor}`}
                      style={{ width: `${tech.capacity}%` }}
                    />
                  </div>
                </div>

                <p className="w-8 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {tech.capacity}%
                </p>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>

      {/* Bottom - Unassigned Requests */}
      <div className="mt-6">
        <DashboardPanel
          title="Unassigned requests"
          description="Assign these before the next appointment block."
          headerAction={
            <span className="rounded bg-[#fef3c7] px-2.5 py-1 text-[10px] font-bold text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]">
              {unassignedRequests.length} need assignment
            </span>
          }
          contentClassName="p-0"
        >
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-[#e5edf7] bg-[#f8fafc] text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-[#162334]">
                <tr>
                  <th className="px-5 py-3 font-semibold w-[20%]">Request</th>
                  <th className="px-5 py-3 font-semibold w-[25%]">Customer</th>
                  <th className="px-5 py-3 font-semibold w-[25%]">Issue</th>
                  <th className="px-5 py-3 font-semibold w-[15%]">Due</th>
                  <th className="px-5 py-3 font-semibold text-right w-[15%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
                {unassignedRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-[#f8fafc] dark:hover:bg-[#162334]"
                  >
                    <td className="px-5 py-4 text-[12px] font-bold text-[#102c50] dark:text-white">
                      {req.id}
                    </td>
                    <td className="px-5 py-4 text-[12px] font-medium text-slate-600 dark:text-slate-300">
                      {req.customer}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-slate-500 dark:text-slate-400">
                      {req.issue}
                    </td>
                    <td className="px-5 py-4 text-[12px] text-slate-500 dark:text-slate-400">
                      {req.due}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate("/dashboard/repair-queue")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2870e8] hover:underline"
                      >
                        Assign technician
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
