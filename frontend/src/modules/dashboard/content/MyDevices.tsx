import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Search,
} from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, {
  type DataTableColumn,
} from "../../../components/common/widgets/DataTable";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import CustomerRepairDetailModal from "./repair-queue/CustomerRepairDetailModal";

import { listMyDevices } from "../../../api/repair_requests";
import type { CustomerDevice } from "../../../types/repair_requests";

const PAGE_SIZE = 10;

const COMPUTER_TYPE_LABEL: Record<string, string> = {
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  OTHER: "Other",
};

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

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function MyDevices() {
  const [devices, setDevices] = useState<CustomerDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepairId, setSelectedRepairId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await listMyDevices();
      if (cancelled) return;
      setDevices(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // filter + search (client-side)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return devices.filter((d) => {
      if (typeFilter && d.computer_type !== typeFilter) return false;
      if (!q) return true;

      return (
        d.computer_name.toLowerCase().includes(q) ||
        (d.serial_number?.toLowerCase().includes(q) ?? false) ||
        (d.repair_number?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [devices, search, typeFilter]);

  // reset to page 1 whenever the filter set changes
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const columns: DataTableColumn<CustomerDevice>[] = [
    {
      key: "computer_name",
      label: "Computer",
      className: "w-[26%]",
      render: (d) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
            {d.computer_name}
          </p>
          {d.serial_number && (
            <p className="mt-0.5 text-[9px] text-slate-400">
              SN {d.serial_number}
            </p>
          )}
        </>
      ),
    },
    {
      key: "computer_type",
      label: "Type",
      className: "w-[12%]",
      render: (d) => COMPUTER_TYPE_LABEL[d.computer_type] ?? d.computer_type,
    },
    {
      key: "repair_number",
      label: "Current request",
      className: "w-[18%]",
      render: (d) =>
        d.repair_number ? (
          <span className="font-mono text-[11px] font-semibold text-[#102c50] dark:text-white">
            {d.repair_number}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">No active repair</span>
        ),
    },
    {
      key: "repair_status",
      label: "Status",
      className: "w-[16%]",
      render: (d) =>
        d.repair_status ? (
          <span
            className={`inline-flex rounded px-2 py-1 text-[9px] font-bold ${
              STATUS_BADGE[d.repair_status] ?? STATUS_BADGE.PENDING
            }`}
          >
            {STATUS_LABEL[d.repair_status] ?? d.repair_status}
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">—</span>
        ),
    },
    {
      key: "estimate_amount",
      label: "Estimated cost",
      className: "w-[14%]",
      render: (d) => (
        <span className="text-[11px] font-semibold text-[#102c50] dark:text-white">
          {formatMoney(d.estimate_amount)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-[14%]",
      render: (d) =>
        d.repair_request_id ? (
          <button
            type="button"
            onClick={() => setSelectedRepairId(d.repair_request_id!)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#2870e8] hover:underline"
          >
            View details
            <ChevronRight size={12} />
          </button>
        ) : null,
    },
  ];

  return (
    <DashboardPage>
      <CustomerRepairDetailModal
        open={selectedRepairId !== null}
        onClose={() => setSelectedRepairId(null)}
        repairRequestId={selectedRepairId}
      />

      <PageHeader
        eyebrow="Directory / Devices"
        title="My devices"
        description="Every computer we have on file for you, with its most recent repair."
      />

      {/* Search + filter */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, serial number, or repair ID"
            className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white px-3 text-[11px] text-[#102c50] outline-none focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
        >
          <option value="">All types</option>
          <option value="LAPTOP">Laptop</option>
          <option value="DESKTOP">Desktop</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <DashboardPanel
        className="mt-4"
        title={`${filtered.length} device${filtered.length === 1 ? "" : "s"} in view`}
        description="Click a device with an active repair to see details, parts, and updates."
      >
        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">
            Loading...
          </p>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2870e8]">
              <Monitor size={16} />
            </div>
            <p className="mt-3 text-[12px] font-semibold text-[#102c50] dark:text-white">
              No computers on file yet
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Submit a repair request and your device will show up here.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-[12px] font-semibold text-[#102c50] dark:text-white">
              Nothing matches your filters
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Try a different search term or type.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={pageItems}
            emptyMessage="No computers match your filters."
          />
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-[#e8eef7] px-5 py-3 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
              {filtered.length}
            </p>

            <div className="flex items-center gap-2">
              <CommonButton
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 border-[#d4ddea] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={12} />
              </CommonButton>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {page} / {totalPages}
              </p>

              <CommonButton
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 border-[#d4ddea] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight size={12} />
              </CommonButton>
            </div>
          </div>
        )}
      </DashboardPanel>
    </DashboardPage>
  );
}
