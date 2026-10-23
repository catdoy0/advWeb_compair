import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";

import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import CommonButton from "../../../components/common/widgets/CommonButton";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import PageHeader from "../components/PageHeader";
import { getActivityLogs, type ActivityLogEntry } from "../../../api/administration";

const PAGE_SIZE = 20;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function formatAction(value: string): string {
  return value.toLowerCase().split("_").map((word) =>
    word.charAt(0).toUpperCase() + word.slice(1),
  ).join(" ");
}

function detailText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map(String).join(", ") || "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function ActivityLogs() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTick, setRefreshTick] = useState(0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const result = await getActivityLogs(search.trim(), page, PAGE_SIZE);
      if (cancelled) return;
      if (!result) {
        setError("Could not load activity logs. Please try again.");
        setRows([]);
        setTotal(0);
      } else {
        setRows(result.items);
        setTotal(result.total);
      }
      setLoading(false);
    }, search.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [search, page, refreshTick]);

  const columns = useMemo<DataTableColumn<ActivityLogEntry>[]>(() => [
    {
      key: "time",
      label: "Date and time",
      className: "w-[17%] whitespace-nowrap",
      sortValue: (row) => row.created_at,
      render: (row) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(row.created_at)}</span>,
    },
    {
      key: "actor",
      label: "User",
      className: "w-[19%]",
      sortValue: (row) => row.actor_name,
      render: (row) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">{row.actor_name}</p>
          <p className="mt-0.5 text-[9px] text-slate-400">{row.actor_email ?? "Account unavailable"}</p>
          {row.actor_role && (
            <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {row.actor_role.replaceAll("_", " ")}
            </span>
          )}
        </>
      ),
    },
    {
      key: "action",
      label: "Activity",
      className: "w-[16%]",
      render: (row) => <span className="inline-flex rounded-md bg-[#eef4ff] px-2 py-1 text-[9px] font-bold text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]">{formatAction(row.action)}</span>,
    },
    {
      key: "description",
      label: "Details",
      className: "w-[36%]",
      render: (row) => (
        <div>
          <p className="text-[11px] leading-5 text-slate-600 dark:text-slate-300">{row.description}</p>
          {Object.keys(row.details ?? {}).length > 0 && (
            <dl className="mt-1 space-y-0.5">
              {Object.entries(row.details).map(([key, value]) => {
                const fromTo = value && typeof value === "object" && !Array.isArray(value)
                  ? value as Record<string, unknown>
                  : null;
                const text = fromTo && "from" in fromTo && "to" in fromTo
                  ? `${detailText(fromTo.from)} → ${detailText(fromTo.to)}`
                  : detailText(value);
                return (
                  <div key={key} className="flex gap-1 text-[9px] text-slate-400">
                    <dt className="font-semibold">{key.replaceAll("_", " ")}:</dt>
                    <dd className="break-all">{text}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>
      ),
    },
    {
      key: "target",
      label: "Record",
      className: "w-[12%]",
      sortValue: (row) => `${row.target_type ?? ""} ${row.target_id ?? ""}`,
      render: (row) => row.target_type ? (
        <span className="text-[10px] text-slate-500 dark:text-slate-400">
          <span className="capitalize">{row.target_type.replaceAll("_", " ")}</span>
          {row.target_id && <span className="ml-1 font-mono text-[#102c50] dark:text-slate-200">#{row.target_id}</span>}
        </span>
      ) : <span className="text-slate-400">—</span>,
    },
  ], []);

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="System / Audit trail"
        title="Activity logs"
        description="Review account, repair, checkout, and workspace changes across the system."
        action={
          <CommonButton
            variant="outline"
            onClick={() => setRefreshTick((value) => value + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </CommonButton>
        }
      />

      <DashboardPanel
        title="Recent activity"
        description={`${total.toLocaleString()} recorded ${total === 1 ? "event" : "events"}`}
        className="mt-6"
        headerClassName="py-3"
        headerAction={
          <label className="relative block w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search users, repairs, actions..."
              aria-label="Search activity logs"
              className="h-9 w-full rounded-md border border-[#d8e0eb] bg-white pl-9 pr-3 text-[11px] text-[#102c50] outline-none focus:border-[#2870e8] dark:border-slate-700 dark:bg-[#182536] dark:text-white"
            />
          </label>
        }
      >
        {error ? (
          <p role="alert" className="px-5 py-10 text-center text-[11px] text-red-500">{error}</p>
        ) : loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">Loading activity...</p>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            onRefresh={() => setRefreshTick((value) => value + 1)}
            refreshing={loading}
            emptyMessage="No matching activity found."
          />
        )}

        <div className="flex items-center justify-between border-t border-[#e5ebf2] px-5 py-3 dark:border-slate-700">
          <p className="text-[10px] text-slate-400">Page {page} of {pageCount}</p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#d8e0eb] text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            ><ChevronLeft size={14} /></button>
            <button
              type="button"
              aria-label="Next page"
              disabled={page >= pageCount || loading}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              className="flex h-8 w-8 items-center justify-center rounded border border-[#d8e0eb] text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            ><ChevronRight size={14} /></button>
          </div>
        </div>
      </DashboardPanel>
    </DashboardPage>
  );
}
