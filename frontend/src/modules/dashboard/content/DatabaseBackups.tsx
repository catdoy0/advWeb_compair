import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Download, RefreshCw, RotateCcw, Save } from "lucide-react";

import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import CommonButton from "../../../components/common/widgets/CommonButton";
import DataTable, { type DataTableColumn } from "../../../components/common/widgets/DataTable";
import DashboardPanel from "../components/DashboardPanel";
import { useAuth } from "../../../context/AuthContext";
import {
  createDatabaseSnapshot,
  archiveDatabaseSnapshot,
  downloadDatabaseSnapshot,
  getDatabaseSnapshots,
  restoreDatabaseSnapshot,
  type DatabaseSnapshot,
} from "../../../api/administration";

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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DatabaseBackups({ onSnapshotCountChange }: { onSnapshotCountChange?: (count: number) => void }) {
  const { session } = useAuth();
  const isSuperAdmin = session?.user.role === "SUPER_ADMIN";
  const [snapshots, setSnapshots] = useState<DatabaseSnapshot[]>([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [pendingRestore, setPendingRestore] = useState<DatabaseSnapshot | null>(null);
  const [pendingArchive, setPendingArchive] = useState<DatabaseSnapshot | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const loadSnapshots = useCallback(async () => {
    setLoading(true);
    const result = await getDatabaseSnapshots();
    const items = result.items ?? [];
    setSnapshots(items);
    onSnapshotCountChange?.(items.filter((snapshot) => !snapshot.archived_at).length);
    setError(result.error);
    setLoading(false);
  }, [onSnapshotCountChange]);

  useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots, reload]);

  async function createSnapshot() {
    const cleanLabel = label.trim();
    if (!cleanLabel || creating) return;
    setCreating(true);
    setError("");
    setNotice("");
    const result = await createDatabaseSnapshot(cleanLabel);
    if (result.snapshot) {
      setLabel("");
      setNotice(`Snapshot “${result.snapshot.label}” is ready.`);
      setReload((value) => value + 1);
    } else {
      setError(result.error);
    }
    setCreating(false);
  }

  async function downloadSnapshot(snapshot: DatabaseSnapshot) {
    setWorkingId(snapshot.id);
    setError("");
    const result = await downloadDatabaseSnapshot(snapshot.id);
    if (!result.blob) {
      setError(result.error);
    } else {
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${snapshot.id}.dump`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    setWorkingId("");
  }

  async function restoreSelectedSnapshot() {
    if (!pendingRestore) return;
    const snapshot = pendingRestore;
    setWorkingId(snapshot.id);
    setError("");
    setNotice("");
    const result = await restoreDatabaseSnapshot(snapshot.id);
    if (result.ok) {
      window.location.reload();
    } else {
      setError(result.message);
    }
    setWorkingId("");
    setPendingRestore(null);
  }

  async function archiveSelectedSnapshot() {
    if (!pendingArchive) return;
    const snapshot = pendingArchive;
    setWorkingId(snapshot.id);
    setError("");
    setNotice("");
    const result = await archiveDatabaseSnapshot(snapshot.id);
    if (result.ok) {
      setNotice(result.message);
      setReload((value) => value + 1);
    } else {
      setError(result.message);
    }
    setWorkingId("");
    setPendingArchive(null);
  }

  const columns = useMemo<DataTableColumn<DatabaseSnapshot>[]>(() => [
    {
      key: "snapshot",
      label: "Snapshot",
      className: "w-[30%]",
      render: (snapshot) => (
        <>
          <p className="text-[11px] font-bold text-[#102c50] dark:text-white">{snapshot.label}</p>
          <p className="mt-1 font-mono text-[9px] text-slate-400">{snapshot.id}</p>
          {snapshot.archived_at && <p className="mt-1 text-[9px] font-semibold text-amber-600 dark:text-amber-400">Archived {formatDate(snapshot.archived_at)}</p>}
        </>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      className: "w-[21%] whitespace-nowrap",
      render: (snapshot) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatDate(snapshot.created_at)}</span>,
    },
    {
      key: "kind",
      label: "Type",
      className: "w-[13%]",
      render: (snapshot) => (
        <span className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${snapshot.kind === "pre_restore" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" : "bg-[#eef4ff] text-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]"}`}>
          {snapshot.kind === "pre_restore" ? "Safety" : "Manual"}
        </span>
      ),
    },
    {
      key: "size",
      label: "Size",
      className: "w-[10%]",
      render: (snapshot) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatSize(snapshot.size_bytes)}</span>,
    },
    {
      key: "created_by",
      label: "Created by",
      className: "w-[12%]",
      render: (snapshot) => <span className="text-[10px] text-slate-500 dark:text-slate-400">{snapshot.created_by?.name ?? "System"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-[14%]",
      render: (snapshot) => (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadSnapshot(snapshot)}
            disabled={Boolean(workingId)}
            title="Download snapshot file"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2870e8] hover:underline disabled:opacity-50"
          ><Download size={12} /> Download</button>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setPendingRestore(snapshot)}
              disabled={Boolean(workingId)}
              title="Restore this snapshot"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
            ><RotateCcw size={12} /> Restore</button>
          )}
          {!snapshot.archived_at && (
            <button
              type="button"
              onClick={() => setPendingArchive(snapshot)}
              disabled={Boolean(workingId)}
              title="Archive snapshot record"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:underline disabled:opacity-50 dark:text-slate-400"
            ><Archive size={12} /> Archive</button>
          )}
        </div>
      ),
    },
  ], [isSuperAdmin, workingId]);

  const visibleSnapshots = snapshots.filter((snapshot) => Boolean(snapshot.archived_at) === showArchived);

  return (
    <>
      <DashboardPanel
        title="Workspace backups"
        description="Create a PostgreSQL database snapshot, download a copy, or restore one. Uploaded files and store_settings.json are not included."
        className="mt-8"
        headerClassName="flex-col items-start px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
        headerAction={
          <div className="flex flex-wrap gap-2">
            <CommonButton
              variant="outline"
              onClick={() => setShowArchived((value) => !value)}
              className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
            >
              <Archive size={13} /> {showArchived ? "Show active" : `Show archived (${snapshots.filter((snapshot) => snapshot.archived_at).length})`}
            </CommonButton>
            <CommonButton
              variant="outline"
              onClick={() => setReload((value) => value + 1)}
              disabled={loading || creating || Boolean(workingId)}
              className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
            </CommonButton>
          </div>
        }
      >
        <div className="flex flex-col gap-3 border-b border-[#e5ebf2] p-5 sm:flex-row sm:items-end dark:border-slate-700">
          <label htmlFor="snapshot-label" className="flex-1 text-[11px] font-bold text-[#102c50] dark:text-white">
            Snapshot name
            <input
              id="snapshot-label"
              value={label}
              maxLength={80}
              onChange={(event) => setLabel(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createSnapshot(); } }}
              placeholder="e.g. Before changing repair workflow"
              className="mt-1.5 h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[11px] font-normal text-[#102c50] outline-none focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
            />
          </label>
          <CommonButton
            onClick={() => void createSnapshot()}
            disabled={!label.trim() || creating || Boolean(workingId)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={13} className={creating ? "animate-pulse" : ""} />
            {creating ? "Creating backup..." : "Create backup"}
          </CommonButton>
        </div>
        {notice && <p role="status" className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-[11px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}
        {error && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-[11px] text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
        {loading ? (
          <p className="px-5 py-10 text-center text-[11px] text-slate-400">Loading snapshots...</p>
        ) : (
          <DataTable
            columns={columns}
            data={visibleSnapshots}
            emptyMessage={showArchived ? "No archived snapshots." : "No active snapshots yet. Create one before making major changes."}
          />
        )}
        <p className="border-t border-[#e5ebf2] px-5 py-3 text-[10px] text-slate-400 dark:border-slate-700">
          Archiving hides a snapshot from the active list but retains its dump for download or restore. Restore is available to super admins only. Restoring reapplies objects/data in the dump; objects created afterward but absent from it remain.
        </p>
      </DashboardPanel>

      <AreYouSureModal
        open={Boolean(pendingRestore)}
        onClose={() => { if (!workingId) setPendingRestore(null); }}
        onConfirm={restoreSelectedSnapshot}
        header="Restore database snapshot"
        title={`Restore “${pendingRestore?.label ?? "snapshot"}”?`}
        description="This restores the objects and data recorded in the selected PostgreSQL dump. A safety snapshot is created first, and the archive is checked before restore starts."
        confirmLabel={workingId ? "Restoring..." : "Create safety snapshot and restore"}
        cancelLabel="Keep current database"
        variant="danger"
      />
      <AreYouSureModal
        open={Boolean(pendingArchive)}
        onClose={() => { if (!workingId) setPendingArchive(null); }}
        onConfirm={archiveSelectedSnapshot}
        header="Archive database snapshot"
        title={`Archive “${pendingArchive?.label ?? "snapshot"}”?`}
        description="This removes the snapshot from the active list while keeping its dump available in archived snapshots for download or restore."
        confirmLabel={workingId ? "Archiving..." : "Archive snapshot"}
        cancelLabel="Keep active"
      />
    </>
  );
}
