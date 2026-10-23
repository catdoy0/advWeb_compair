// Didn't you see the news today?
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight,
  Monitor,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import RepairDetailModal from "./repair-queue/RepairDetailModal";

import { getWorkspace } from "../../../api/repair_requests";
import type {
  AssignedRepair,
  WorkspaceResponse,
} from "../../../types/repair_requests";

dayjs.extend(relativeTime);


const STATUS_BADGE: Record<string, string> = {
  RECEIVED: "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]",
  DIAGNOSING: "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]",
  REPAIRING: "bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
  COMPLETED: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
};

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  COMPLETED: "Completed",
};


function formatDue(date: string | null, time: string | null): string {
  if (!date || !time) return "No scheduled due";
  const d = dayjs(date);
  const t = dayjs(`2000-01-01T${time}`).format("h:mm A");
  if (d.isSame(dayjs(), "day")) return `Today, ${t}`;
  if (d.isSame(dayjs().add(1, "day"), "day")) return `Tomorrow, ${t}`;
  return `${d.format("MMM D")}, ${t}`;
}

// ---------- page ----------

export default function Workspace() {
  const navigate = useNavigate();

  const [data, setData] = useState<WorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await getWorkspace();
      if (cancelled) return;
      setData(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const columns: DataTableColumn<AssignedRepair>[] = [
    {
      key: "repair_number",
      label: "Request",
      className: "w-[16%]",
      render: (r) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
            {r.repair_number}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-slate-400">
            {r.reported_problem}
          </p>
        </>
      ),
    },
    {
      key: "computer_name",
      label: "Device",
      className: "w-[20%]",
      render: (r) => (
        <p className="text-[11px] font-semibold text-[#102c50] dark:text-white">
          {r.computer_name}
        </p>
      ),
    },
    {
      key: "customer_name",
      label: "Customer",
      className: "w-[18%]",
      render: (r) => (
        <p className="truncate text-[11px] font-semibold text-[#102c50] dark:text-white">
          {r.customer_name}
        </p>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-[14%]",
      render: (r) => (
        <span
          className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${
            STATUS_BADGE[r.status] ?? STATUS_BADGE.RECEIVED
          }`}
        >
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      ),
    },
    {
      key: "parts_used_count",
      label: "Parts used",
      className: "w-[12%]",
      render: (r) => (
        <span className="text-[11px] text-slate-600 dark:text-slate-300">
          {r.parts_used_count} {r.parts_used_count === 1 ? "item" : "items"}
        </span>
      ),
    },
    {
      key: "due_date",
      label: "Due",
      className: "w-[16%]",
      render: (r) => (
        <span className="text-[11px] text-slate-600 dark:text-slate-300">
          {formatDue(r.due_date, r.due_time)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[8%]",
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedId(r.id)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline"
        >
          Open
          <ChevronRight size={12} />
        </button>
      ),
    },
  ];

  const summary = data?.summary ?? {
    assigned_devices: 0,
    diagnosing: 0,
    parts_on_hand: 0,
    completed_today: 0,
  };
  const items = data?.items ?? [];

  return (
    <DashboardPage>
      <RepairDetailModal
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        repairRequestId={selectedId}
        onUpdated={() => setRefreshTick((t) => t + 1)}
      />

      <PageHeader
        eyebrow="Technician workspace"
        title="Today's workbench"
        description="See assigned devices, update repair stages, and record the parts used on each job."
        action={
          <div className="flex gap-2 self-start xl:self-auto">
            <CommonButton
              variant="outline"
              onClick={() => navigate("/dashboard/parts-inventory")}
              className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
            >
              <Package size={14} />
              Parts inventory
            </CommonButton>

            <CommonButton
              onClick={() => setRefreshTick((t) => t + 1)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh workbench
            </CommonButton>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <WorkspaceCard
          label="Assigned devices"
          value={summary.assigned_devices}
          badgeLabel="In your queue"
          badgeTone="blue"
          detail="Current repair requests"
          icon={<Monitor size={14} />}
        />
        <WorkspaceCard
          label="Diagnosing"
          value={summary.diagnosing}
          badgeLabel="Next action"
          badgeTone="amber"
          detail="Record findings after inspection"
          icon={<Search size={14} />}
        />
        <WorkspaceCard
          label="Parts on hand"
          value={summary.parts_on_hand}
          badgeLabel="View stock"
          badgeTone="teal"
          detail="Part catalog access"
          icon={<Package size={14} />}
          onBadgeClick={() => navigate("/dashboard/parts-inventory")}
        />
        <WorkspaceCard
          label="Completed today"
          value={summary.completed_today}
          badgeLabel="Ready for release"
          badgeTone="green"
          detail="Awaiting shop handoff"
          icon={<ShieldCheck size={14} />}
        />
      </div>

      {/* Assigned devices table */}
      <DashboardPanel
        className="mt-5"
        title="Devices assigned to you"
        description="Open a device to move its stage or record parts used."
        headerAction={
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Workbench live
          </div>
        }
      >
        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">
            Loading...
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2870e8]">
              <Monitor size={16} />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-[#102c50] dark:text-white">
              No devices assigned to you
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Repairs you pick up will show up here.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            onRefresh={() => setRefreshTick((tick) => tick + 1)}
            refreshing={loading}
            emptyMessage="No devices assigned to you."
          />
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}

// ---------- WorkspaceCard ----------

type BadgeTone = "blue" | "amber" | "teal" | "green";

const BADGE_STYLES: Record<BadgeTone, string> = {
  blue: "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]",
  amber: "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]",
  teal: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
  green: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
};

const ICON_STYLES: Record<BadgeTone, string> = {
  blue: "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]",
  amber: "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]",
  teal: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
  green: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
};

function WorkspaceCard({
  label,
  value,
  badgeLabel,
  badgeTone,
  detail,
  icon,
  onBadgeClick,
}: {
  label: string;
  value: number;
  badgeLabel: string;
  badgeTone: BadgeTone;
  detail: string;
  icon: React.ReactNode;
  onBadgeClick?: () => void;
}) {
  const badgeClass = BADGE_STYLES[badgeTone];
  const iconClass = ICON_STYLES[badgeTone];

  return (
    <div className="rounded-lg border border-[#d8e0eb] bg-white px-4 py-4 dark:border-slate-700 dark:bg-[#111c2b]">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </p>

        <div
          className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-[27px] font-semibold text-[#102c50] dark:text-white">
        {value}
      </p>

      <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
        {onBadgeClick ? (
          <button
            type="button"
            onClick={onBadgeClick}
            className={`text-[10px] font-bold hover:underline ${
              badgeClass.split(" ")[0].replace("bg-", "text-") // hacky, see note
            }`}
          >
            {badgeLabel}
          </button>
        ) : (
          <span className={`text-[10px] font-bold ${badgeClass}`}>
            {badgeLabel}
          </span>
        )}
        <span className="text-[10px] text-slate-400">{detail}</span>
      </p>
    </div>
  );
}
// I heard they said it looked like rain
