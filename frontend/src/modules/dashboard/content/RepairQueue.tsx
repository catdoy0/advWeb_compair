import { useEffect, useState } from "react";
import {  ChevronRight, Search } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import UserAvatar from "../../../components/common/widgets/UserAvatar";
import { listRepairQueue } from "../../../api/repair_requests";
import type { RepairQueueItem } from "../../../types/repair_requests";
import RepairDetailModal from "./repair-queue/RepairDetailModal";

dayjs.extend(relativeTime);

// ---------- helpers ----------

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "RECEIVED", label: "Received" },
  { key: "DIAGNOSING", label: "Diagnosing" },
  { key: "REPAIRING", label: "Repairing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "RELEASED", label: "Released" },
];

const STATUS_BADGE: Record<string, string> = {
  RECEIVED: "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]",
  DIAGNOSING: "bg-[#fef3c7] text-[#b45309] dark:bg-[#3a2a0f] dark:text-[#fbbf24]",
  REPAIRING: "bg-[#dbeafe] text-[#1d4ed8] dark:bg-[#1e3a8a] dark:text-[#93c5fd]",
  COMPLETED: "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]",
  RELEASED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  CANCELLED: "bg-[#fdecec] text-[#c0392b] dark:bg-[#3a1717] dark:text-[#f87171]",
};

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  DIAGNOSING: "Diagnosing",
  REPAIRING: "Repairing",
  COMPLETED: "Completed",
  RELEASED: "Released",
  CANCELLED: "Cancelled",
};

function initialsOf(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function formatEstimate(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

// ---------- page ----------

export default function RepairQueue() {
  const [items, setItems] = useState<RepairQueueItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeStatus, setActiveStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // debounced fetch on filter + search change
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await listRepairQueue(activeStatus || undefined, search);
      if (cancelled) return;
      setItems(data.items);
      setCounts(data.counts);
      setLoading(false);
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeStatus, search]);

  const columns: DataTableColumn<RepairQueueItem>[] = [
    {
      key: "repair_number",
      label: "Request",
      className: "w-[14%]",
      render: (r) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
            {r.repair_number}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400">
            {dayjs(r.created_at).fromNow()}
          </p>
        </>
      ),
    },
    {
      key: "customer_name",
      label: "Customer",
      className: "w-[16%]",
      render: (r) => (
        <div className="flex items-center gap-2">
          <UserAvatar variant="messages" initials={initialsOf(r.customer_name)} />
          <p className="truncate text-[11px] font-semibold text-[#102c50] dark:text-white">
            {r.customer_name}
          </p>
        </div>
      ),
    },
    {
      key: "computer_name",
      label: "Device",
      className: "w-[24%]",
      render: (r) => (
        <>
          <p className="text-[11px] font-semibold text-[#102c50] dark:text-white">
            {r.computer_name}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-slate-400">
            {r.reported_problem}
          </p>
        </>
      ),
    },
    {
      key: "status",
      label: "Status",
      className: "w-[13%]",
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
      key: "technician_name",
      label: "Technician",
      className: "w-[16%]",
      render: (r) =>
        r.technician_name ? (
          <div className="flex items-center gap-2">
            <UserAvatar
              variant="messages"
              initials={initialsOf(r.technician_name)}
            />
            <p className="truncate text-[11px] font-semibold text-[#102c50] dark:text-white">
              {r.technician_name}
            </p>
          </div>
        ) : (
          <p className="text-[10px] text-slate-400">Unassigned</p>
        ),
    },
    {
      key: "estimate_amount",
      label: "Estimate",
      className: "w-[10%]",
      render: (r) => (
        <p className="text-[11px] font-semibold text-[#102c50] dark:text-white">
          {formatEstimate(r.estimate_amount)}
        </p>
      ),
    },
    {
      key: "actions",
      label: "Next action",
      className: "w-[7%]",
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
    }
  ];

  const visibleCount = items.length;

  return (
    <DashboardPage>

      <RepairDetailModal
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        repairRequestId={selectedId}
        onUpdated={() => {
          // refresh the queue after a status change
          // (for now, nothing — the modal doesn't mutate yet)
        }}
      />
      <PageHeader
        eyebrow="Operations / repairs"
        title="Repair queue"
        description="Track every active request and move work through the service workflow."
      />

      {/* Search */}
      <div className="mt-5 flex justify-end">
        <div className="relative w-full max-w-[360px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repair ID, Customer, Devices..."
            className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="mt-4 flex flex-wrap gap-1 border-b border-[#d8e0eb] pb-2 dark:border-slate-700">
        {STATUS_TABS.map((tab) => {
          const isActive = activeStatus === tab.key;
          const count =
            tab.key === ""
              ? counts.ALL ?? 0
              : counts[tab.key] ?? 0;

          return (
            <button
              key={tab.key || "all"}
              type="button"
              onClick={() => setActiveStatus(tab.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "bg-[#eef4ff] text-[#2870e8] ring-1 ring-[#cfe0ff] dark:bg-[#172a42] dark:ring-[#2870e8]"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
              <span className={isActive ? "text-[#7da9ee]" : "text-slate-400"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <DashboardPanel className="mt-4">
        <div className="flex items-start justify-between border-b border-[#e5edf7] px-5 py-4 dark:border-slate-700">
          <div>
            <h2 className="text-[13px] font-bold text-[#102c50] dark:text-white">
              {visibleCount} request{visibleCount === 1 ? "" : "s"} in view
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Click a request to open the detail panel and advance its status.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Updated just now
          </div>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">
            Loading...
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            emptyMessage="No requests match this filter."
          />
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}
