import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, RotateCcw, Search } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import {
  getArchivedAccounts,
  getArchivedMessages,
  restoreAccount,
  restoreConversation,
  type ArchivedAccount,
  type ArchivedConversation,
} from "../../../api/administration";

const PAGE_SIZE = 10;
type ArchiveTab = "messages" | "accounts";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

export default function ArchivePage() {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";
  const [tab, setTab] = useState<ArchiveTab>("messages");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<ArchivedConversation[]>([]);
  const [accounts, setAccounts] = useState<ArchivedAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [pendingRestore, setPendingRestore] = useState<{
    id: number;
    kind: ArchiveTab;
    label: string;
  } | null>(null);

  const activeTab: ArchiveTab = isSuperAdmin ? tab : "messages";

  useEffect(() => {
    if (!isSuperAdmin && tab !== "messages") setTab("messages");
  }, [isSuperAdmin, tab]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      const result = activeTab === "messages"
        ? await getArchivedMessages(search.trim(), page)
        : await getArchivedAccounts(search.trim(), page);
      if (cancelled) return;
      if (!result) {
        setError(`Unable to load archived ${activeTab}.`);
        setTotal(0);
        if (activeTab === "messages") setMessages([]);
        else setAccounts([]);
      } else {
        setTotal(result.total);
        if (activeTab === "messages") setMessages(result.items as ArchivedConversation[]);
        else setAccounts(result.items as ArchivedAccount[]);
      }
      setLoading(false);
    }, search ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, search, page, refreshTick]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  async function confirmRestore() {
    if (!pendingRestore) return;
    const { id, kind } = pendingRestore;
    setWorkingId(id);
    setError("");
    const result = kind === "messages"
      ? await restoreConversation(id)
      : await restoreAccount(id);
    if (result.ok) {
      const rowCount = kind === "messages" ? messages.length : accounts.length;
      if (kind === "messages") setMessages((rows) => rows.filter((row) => row.id !== id));
      else setAccounts((rows) => rows.filter((row) => row.id !== id));
      setTotal((count) => Math.max(0, count - 1));
      if (rowCount === 1 && page > 1) setPage((current) => current - 1);
    } else {
      setError(result.message);
    }
    setWorkingId(null);
    setPendingRestore(null);
  }

  function requestRestore(kind: ArchiveTab, id: number, label: string) {
    setPendingRestore({ kind, id, label });
  }

  const messageColumns = useMemo<DataTableColumn<ArchivedConversation>[]>(() => [
    {
      key: "customer",
      label: "Customer",
      className: "w-[24%]",
      sortValue: (row) => [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email,
      render: (row) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
            {[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400">{row.email}</p>
        </>
      ),
    },
    {
      key: "context",
      label: "Conversation",
      className: "w-[23%]",
      sortValue: (row) => `${row.repair_number ?? ""} ${row.repair_status}`,
      render: (row) => (
        <>
          <p className="font-mono text-[11px] font-semibold">{row.repair_number}</p>
          <p className="mt-0.5 text-[9px] text-slate-400">{row.repair_status.toLowerCase()}</p>
        </>
      ),
    },
    {
      key: "preview",
      label: "Last message",
      className: "w-[29%]",
      sortValue: (row) => row.preview,
      render: (row) => <span className="line-clamp-2 text-[10px] text-slate-500 dark:text-slate-400">{row.preview || "No messages"}</span>,
    },
    { key: "archived_at", label: "Archived", className: "w-[12%]", render: (row) => formatDate(row.archived_at) },
    {
      key: "actions",
      label: "",
      className: "w-[12%]",
      render: (row) => (
        <button
          type="button"
          disabled={workingId === row.id}
          onClick={() => requestRestore("messages", row.id, row.repair_number ?? "conversation")}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline disabled:opacity-50"
        >
          <RotateCcw size={12} />
          {workingId === row.id ? "Restoring..." : "Restore"}
        </button>
      ),
    },
  ], [workingId, activeTab]);

  const accountColumns = useMemo<DataTableColumn<ArchivedAccount>[]>(() => [
    {
      key: "account",
      label: "Account",
      className: "w-[35%]",
      sortValue: (row) => [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email,
      render: (row) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
            {[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}
          </p>
          <p className="mt-0.5 text-[9px] text-slate-400">{row.email} · USR-{String(row.id).padStart(3, "0")}</p>
        </>
      ),
    },
    { key: "role", label: "Role", className: "w-[15%]", render: (row) => String(row.role).replaceAll("_", " ") },
    {
      key: "status",
      label: "Access",
      className: "w-[14%]",
      sortValue: (row) => row.is_active ? "Active" : "Suspended",
      render: (row) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{row.is_active ? "Active" : "Suspended"}</span>,
    },
    { key: "archived_at", label: "Archived", className: "w-[16%]", render: (row) => formatDate(row.archived_at) },
    {
      key: "actions",
      label: "",
      className: "w-[14%]",
      render: (row) => (
        <button
          type="button"
          disabled={workingId === row.id}
          onClick={() => requestRestore(
            "accounts",
            row.id,
            [row.first_name, row.last_name].filter(Boolean).join(" ") || row.email,
          )}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#2870e8] hover:underline disabled:opacity-50"
        >
          <RotateCcw size={12} />
          {workingId === row.id ? "Restoring..." : "Restore"}
        </button>
      ),
    },
  ], [workingId, activeTab]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="System / Archive"
        title="Archive"
        description="Browse and restore archived conversations and accounts. Archived records are retained."
        action={
          <CommonButton
            variant="outline"
            onClick={() => setRefreshTick((tick) => tick + 1)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </CommonButton>
        }
      />

      <AreYouSureModal
        open={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        onConfirm={confirmRestore}
        header={`Restore ${pendingRestore?.label ?? "archive item"}`}
        description={pendingRestore?.kind === "messages"
          ? "This conversation will return to the inbox. Its messages will remain available to the customer and team."
          : "This account will return to account lists. If it was suspended before archiving, it will remain suspended and unable to sign in."}
        confirmLabel="Restore"
      />

      {isSuperAdmin && (
        <div className="mt-5 flex gap-1 border-b border-[#d8e0eb] dark:border-slate-700">
          {(["messages", "accounts"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => { setTab(value); setPage(1); }}
              className={`border-b-2 px-4 py-2 text-[11px] font-semibold capitalize ${activeTab === value ? "border-[#2870e8] text-[#2870e8] dark:text-blue-300" : "border-transparent text-slate-500 dark:text-slate-400"}`}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder={activeTab === "messages" ? "Search customer, email, or repair number" : "Search account name or email"}
            className="h-10 w-full rounded-md border border-[#d8e0eb] bg-white pl-9 pr-3 text-[11px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
          />
        </div>
      </div>

      <DashboardPanel
        className="mt-4"
        title={activeTab === "messages" ? "Archived conversations" : "Archived accounts"}
        description={activeTab === "messages"
          ? "Archived conversations no longer appear in the inbox. Restoring returns them to the inbox."
          : "Archived accounts cannot sign in or appear in active account lists. Their history stays in the system."}
      >
        {error && <p role="alert" className="px-5 pt-4 text-[11px] text-red-600 dark:text-red-400">{error}</p>}
        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">Loading archive...</p>
        ) : activeTab === "messages" ? (
          <DataTable
            columns={messageColumns}
            data={messages}
            onRefresh={() => setRefreshTick((tick) => tick + 1)}
            refreshing={loading}
            emptyMessage="No archived conversations found."
          />
        ) : (
          <DataTable
            columns={accountColumns}
            data={accounts}
            onRefresh={() => setRefreshTick((tick) => tick + 1)}
            refreshing={loading}
            emptyMessage="No archived accounts found."
          />
        )}

        {!loading && total > 0 && (
          <div className="flex items-center justify-between border-t border-[#e8eef7] px-5 py-3 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <CommonButton
                variant="outline"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 border-[#d4ddea] px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={12} />
              </CommonButton>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{page} / {totalPages}</p>
              <CommonButton
                variant="outline"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
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
