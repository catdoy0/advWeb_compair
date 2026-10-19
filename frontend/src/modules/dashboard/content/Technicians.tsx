import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";

import { getUsers } from "../../../api/administration";
import { assignRepairTechnician, listRepairQueue, unassignTechnicianRepairs } from "../../../api/repair_requests";
import type { GetUser } from "../../../types/administration";
import type { RepairQueueItem } from "../../../types/repair_requests";
import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

const ACTIVE_STATUSES = new Set(["PENDING", "RECEIVED", "DIAGNOSING", "REPAIRING", "COMPLETED"]);
const ASSIGNABLE_STATUSES = new Set(["PENDING", "RECEIVED", "DIAGNOSING", "REPAIRING"]);
const CAPACITY = 6;

function technicianName(tech: GetUser) {
  return [tech.first_name, tech.last_name].filter(Boolean).join(" ") || tech.email;
}

function technicianInitials(tech: GetUser) {
  return technicianName(tech)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatAppointment(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Technicians() {
  const [technicians, setTechnicians] = useState<GetUser[]>([]);
  const [repairs, setRepairs] = useState<RepairQueueItem[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<Record<number, string>>({});
  const [technicianToUnassign, setTechnicianToUnassign] = useState<GetUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [unassigningTechnicianId, setUnassigningTechnicianId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [techs, queue] = await Promise.all([
        (async () => {
          const all: GetUser[] = [];
          for (let page = 1; ; page += 1) {
            const result = await getUsers(30, page, "", "TECHNICIAN");
            if (!result) throw new Error("Unable to load technician accounts.");
            all.push(...result);
            if (result.length < 30) return all;
          }
        })(),
        listRepairQueue(),
      ]);
      if (queue.error) throw new Error(queue.error);
      setTechnicians(techs);
      setRepairs(queue.items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load technician dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const activeRepairs = useMemo(
    () => repairs.filter((repair) => ACTIVE_STATUSES.has(repair.status)),
    [repairs],
  );
  const unassignedRequests = useMemo(
    () => activeRepairs.filter((repair) => repair.technician_id === null && ASSIGNABLE_STATUSES.has(repair.status)),
    [activeRepairs],
  );

  async function saveAssignment(repair: RepairQueueItem, technicianId: number | null) {
    setAssigningId(repair.id);
    setError("");
    try {
      const result = await assignRepairTechnician(repair.id, technicianId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSelectedTechnician((current) => {
        const next = { ...current };
        delete next[repair.id];
        return next;
      });
      await loadData();
    } catch {
      setError("Unable to update technician assignment. Please try again.");
    } finally {
      setAssigningId(null);
    }
  }

  async function handleAssign(repair: RepairQueueItem) {
    const technicianId = Number(selectedTechnician[repair.id]);
    if (technicianId) await saveAssignment(repair, technicianId);
  }

  async function handleUnassignTechnician() {
    if (!technicianToUnassign) return;
    const technician = technicianToUnassign;
    setUnassigningTechnicianId(technician.id);
    setError("");
    try {
      const result = await unassignTechnicianRepairs(technician.id);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTechnicianToUnassign(null);
      await loadData();
    } catch {
      setError("Unable to unassign this technician’s repairs. Please try again.");
    } finally {
      setUnassigningTechnicianId(null);
    }
  }

  return (
    <DashboardPage maxWidth="1240px" className="bg-[#f7f9fc] dark:bg-[#0f1724]">
      <AreYouSureModal
        open={technicianToUnassign !== null}
        onClose={() => setTechnicianToUnassign(null)}
        onConfirm={handleUnassignTechnician}
        header={`Unassign ${technicianToUnassign ? technicianName(technicianToUnassign) : "technician"}?`}
        description={`This will remove ${technicianToUnassign ? technicianName(technicianToUnassign) : "this technician"} from ${technicianToUnassign ? activeRepairs.filter((repair) => repair.technician_id === technicianToUnassign.id).length : 0} open repair request(s). Those requests will return to Unassigned requests.`}
        confirmLabel="Unassign repairs"
      />
      <PageHeader
        eyebrow="Manage / People"
        title="Technician workspace"
        description="Balance assignments without losing the detail behind each repair."
      />

      {error && (
        <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-[11px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error} <button type="button" onClick={() => void loadData()} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(350px,1fr)]">
        {/* Left Column - Roster */}
        <DashboardPanel
          title="Technician roster"
          description="Current assignments by person"
          contentClassName="p-0"
        >
          {loading ? (
            <p className="px-5 py-8 text-center text-[11px] text-slate-400">Loading technicians…</p>
          ) : technicians.length === 0 ? (
            <p className="px-5 py-8 text-center text-[11px] text-slate-400">No technician accounts found.</p>
          ) : (
            <div className="divide-y divide-[#e5edf7] dark:divide-slate-700">
              {technicians.map((tech) => {
                const activeCount = activeRepairs.filter((repair) => repair.technician_id === tech.id).length;
                const assignedRepairs = activeRepairs.filter((repair) => repair.technician_id === tech.id);
                return (
                  <div
                    key={tech.id}
                    className="px-5 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {technicianInitials(tech)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-[#102c50] dark:text-white">{technicianName(tech)}</p>
                          <p className="truncate text-[10px] text-slate-400">{tech.email}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                          {activeCount} active
                        </span>
                        <span className={`rounded px-2 py-1 text-[10px] font-bold ${tech.is_active ? "bg-[#e6f5ef] text-[#15946a] dark:bg-[#1d4775] dark:text-[#00d68f]" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                          {tech.is_active ? "Active" : "Suspended"}
                        </span>
                        {assignedRepairs.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setTechnicianToUnassign(tech)}
                            disabled={unassigningTechnicianId === tech.id}
                            className="text-[12px] font-bold text-[#2870e8] hover:underline disabled:opacity-50"
                          >
                            {unassigningTechnicianId === tech.id ? "Unassigning…" : "Unassign"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardPanel>

        {/* Right Column - Capacity */}
        <DashboardPanel
          title="Capacity by technician"
          description="Keep assignments below 85%"
          contentClassName="p-5"
        >
          {loading ? (
            <p className="py-4 text-center text-[11px] text-slate-400">Loading workload…</p>
          ) : technicians.length === 0 ? (
            <p className="py-4 text-center text-[11px] text-slate-400">No technicians to show.</p>
          ) : (
            <div className="space-y-5">
              {technicians.map((tech) => {
                const count = activeRepairs.filter((repair) => repair.technician_id === tech.id).length;
                const capacity = Math.min(100, Math.round((count / CAPACITY) * 100));
                return (
                  <div key={tech.id} className="flex items-center gap-4">
                    <p className="w-16 truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                      {technicianName(tech).split(" ")[0]}
                    </p>

                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#f1f5f9] dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full ${capacity >= 85 ? "bg-[#d97706]" : "bg-[#2870e8]"}`}
                          style={{ width: `${capacity}%` }}
                        />
                      </div>
                    </div>

                    <p className="w-8 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {capacity}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
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
          {loading ? (
            <p className="px-5 py-8 text-center text-[11px] text-slate-400">Loading repair requests…</p>
          ) : unassignedRequests.length === 0 ? (
            <p className="px-5 py-8 text-center text-[11px] text-slate-400">There are no unassigned open repair requests.</p>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-[#e5edf7] bg-[#f8fafc] text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-[#162334]">
                  <tr>
                    <th className="w-[20%] px-5 py-3 font-semibold">Request</th>
                    <th className="w-[25%] px-5 py-3 font-semibold">Customer</th>
                    <th className="w-[25%] px-5 py-3 font-semibold">Issue</th>
                    <th className="w-[15%] px-5 py-3 font-semibold">Due</th>
                    <th className="w-[15%] px-5 py-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
                  {unassignedRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[#f8fafc] dark:hover:bg-[#162334]"
                    >
                      <td className="px-5 py-4 text-[12px] font-bold text-[#102c50] dark:text-white">
                        {req.repair_number}
                      </td>
                      <td className="px-5 py-4 text-[12px] font-medium text-slate-600 dark:text-slate-300">
                        {req.customer_name}
                      </td>
                      <td className="max-w-0 truncate px-5 py-4 text-[12px] text-slate-500 dark:text-slate-400" title={req.reported_problem}>
                        {req.reported_problem}
                      </td>
                      <td className="px-5 py-4 text-[12px] text-slate-500 dark:text-slate-400">
                        {formatAppointment(req.preferred_date)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selectedTechnician[req.id] ?? ""}
                            onChange={(event) => setSelectedTechnician((current) => ({ ...current, [req.id]: event.target.value }))}
                            aria-label={`Choose technician for ${req.repair_number}`}
                            className="max-w-32 rounded border border-[#d8e0eb] bg-white px-2 py-1.5 text-[10px] text-slate-600 dark:border-slate-700 dark:bg-[#111c2b] dark:text-slate-300"
                          >
                            <option value="">Select</option>
                            {technicians.filter((tech) => tech.is_active).map((tech) => (
                              <option key={tech.id} value={tech.id}>{technicianName(tech)}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleAssign(req)}
                            disabled={!selectedTechnician[req.id] || assigningId === req.id}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2870e8] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {assigningId === req.id ? "Assigning" : "Assign"}
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
