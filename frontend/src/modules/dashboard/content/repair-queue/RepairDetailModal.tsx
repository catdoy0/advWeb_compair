import { useEffect, useState } from "react";
import { ArrowRight, Check, FileText, Package, Pencil, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import RightSidebar from "../../../../components/common/modals/RightSideBar";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import {
  advanceRepairStatus,
  getRepairDetail,
  listRepairNotes,
  listRepairParts,
  removeRepairPart,
  rejectRepair,
  updateEstimate,
} from "../../../../api/repair_requests";
import type {
  RepairDetail,
  RepairNote,
  RepairPartUsage,
  RepairQueueStatus,
} from "../../../../types/repair_requests";
import AddNoteModal from "./AddNoteModal";
import AddPartModal from "./AddPartModal";
import AreYouSureModal from "../../../../components/common/modals/AreYouSureModal";
import MessageModal from "../../../../components/common/modals/MessageModal";

dayjs.extend(relativeTime);

const WORKFLOW_STEPS: { key: RepairQueueStatus; label: string }[] = [
  { key: "PENDING", label: "Pending" },
  { key: "RECEIVED", label: "Received" },
  { key: "DIAGNOSING", label: "Diagnosing" },
  { key: "REPAIRING", label: "Repairing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "RELEASED", label: "Released" },
];

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

const COMPUTER_TYPE_LABEL: Record<string, string> = {
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  OTHER: "Other",
};

function formatEstimate(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAppointmentDate(iso: string | null): string {
  if (!iso) return "—";
  return dayjs(iso).format("MMM D, YYYY");
}

function formatDue(isoDate: string | null, isoTime: string | null): string {
  if (!isoDate || !isoTime) return "—";
  const d = dayjs(isoDate);
  const time = dayjs(`2000-01-01T${isoTime}`).format("h:mm A");
  if (d.isSame(dayjs(), "day")) return `Today, ${time}`;
  return `${d.format("MMM D")}, ${time}`;
}

interface RepairDetailModalProps {
  open: boolean;
  onClose: () => void;
  repairRequestId: number | null;
  onUpdated: () => void;
}

export default function RepairDetailModal(props: RepairDetailModalProps) {
  if (!props.open || props.repairRequestId === null) return null;
  return (
    <RepairDetailContent
      {...props}
      repairRequestId={props.repairRequestId}
    />
  );
}

function RepairDetailContent({
  open,
  onClose,
  repairRequestId,
  onUpdated,
}: RepairDetailModalProps & { repairRequestId: number }) {
  const [detail, setDetail] = useState<RepairDetail | null>(null);
  const [notes, setNotes] = useState<RepairNote[]>([]);
  const [parts, setParts] = useState<RepairPartUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [addPartOpen, setAddPartOpen] = useState(false);

  const [confirmAdvanceOpen, setConfirmAdvanceOpen] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState("");

  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateDraft, setEstimateDraft] = useState("");
  const [savingEstimate, setSavingEstimate] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [detailRes, notesRes, partsRes] = await Promise.all([
        getRepairDetail(repairRequestId),
        listRepairNotes(repairRequestId),
        listRepairParts(repairRequestId),
      ]);
      if (cancelled) return;
      setDetail(detailRes);
      setNotes(notesRes);
      setParts(partsRes);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [repairRequestId, refreshTick]);

  function refresh() {
    setRefreshTick((t) => t + 1);
    onUpdated();
  }

  async function handleRemovePart(repairPartId: number) {
    const ok = await removeRepairPart(repairRequestId, repairPartId);
    if (ok) refresh();
  }

  if (loading && !detail) {
    return (
      <RightSidebar open={open} onClose={onClose}>
        <p className="py-20 text-center text-[11px] text-slate-400">
          Loading repair...
        </p>
      </RightSidebar>
    );
  }

  if (!detail) {
    return (
      <RightSidebar open={open} onClose={onClose}>
        <p className="py-20 text-center text-[11px] text-slate-400">
          Repair not found.
        </p>
      </RightSidebar>
    );
  }

  const currentIndex = WORKFLOW_STEPS.findIndex(
    (s) => s.key === detail.status,
  );

  const nextStep =
    currentIndex >= 0 && currentIndex < WORKFLOW_STEPS.length - 1
      ? WORKFLOW_STEPS[currentIndex + 1]
      : null;

  const updatedRelative = detail.updated_at
    ? dayjs(detail.updated_at).fromNow()
    : dayjs(detail.created_at).fromNow();

  const totalParts = parts.reduce((sum, p) => sum + p.line_total, 0);

  const footer = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <CommonButton
          variant="outline"
          onClick={() => setAddPartOpen(true)}
          className="flex items-center justify-center gap-2 border-[#d4ddea] px-4 py-2"
        >
          <Package size={13} />
          Add parts
        </CommonButton>

        <CommonButton
          variant="outline"
          onClick={() => setAddNoteOpen(true)}
          className="flex items-center justify-center gap-2 border-[#d4ddea] px-4 py-2"
        >
          <FileText size={13} />
          Add note
        </CommonButton>
      </div>

      {advanceError && (
        <p className="mt-2 text-center text-xs font-medium text-red-500">
          {advanceError}
        </p>
      )}
      {nextStep && (
        <CommonButton
          onClick={() => {
            setAdvanceError("");
            setConfirmAdvanceOpen(true);
          }}
          disabled={advancing}
          className="mt-2 flex w-full items-center justify-center gap-2 px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {advancing ? "Updating..." : `Move to ${nextStep.label}`}
          {!advancing && <ArrowRight size={13} />}
        </CommonButton>
      )}
    </>
  );

  function startEditEstimate() {
    setEstimateDraft(
      detail?.estimate_amount != null ? String(detail.estimate_amount) : "",
    );
    setEditingEstimate(true);
  }

  async function saveEstimate() {
    const value = parseFloat(estimateDraft);
    if (isNaN(value) || value < 0) {
      setEditingEstimate(false);
      return;
    }

    setSavingEstimate(true);
    try {
      const result = await updateEstimate(repairRequestId, value);
      if (result.ok) {
        refresh();
      }
    } finally {
      setSavingEstimate(false);
      setEditingEstimate(false);
    }
  }

  return (
    <RightSidebar open={open} onClose={onClose} footer={footer}>

      <AreYouSureModal
        open={confirmRejectOpen}
        onClose={() => setConfirmRejectOpen(false)}
        onConfirm={async () => {
          if (rejecting) return;
          setRejecting(true);
          try {
            const result = await rejectRepair(repairRequestId);
            setConfirmRejectOpen(false);
            setMessageModalMessage(result.message);
            setMessageWasSuccess(result.ok);
            setMessageModalOpen(true);

            if (result.ok) refresh();
          } finally {
            setRejecting(false);
          }
        }}
        title={`Reject ${detail.repair_number}?`}
        description="This permanently closes the repair. The customer will be notified."
        confirmLabel="Reject"
      />

      <MessageModal
        open={messageModalOpen}
        onClose={() => {
          setMessageModalOpen(false);
          if (messageWasSuccess) {
            setMessageWasSuccess(false);
            onClose();
          }
        }}
        title={messageModalMessage}
      />

      <AreYouSureModal
        open={confirmAdvanceOpen}
        onClose={() => setConfirmAdvanceOpen(false)}
        onConfirm={async () => {
          if (advancing) return;
          setAdvancing(true);
          try {
            const result = await advanceRepairStatus(repairRequestId);
            if (!result.ok) {
              setAdvanceError(result.message);
              setConfirmAdvanceOpen(false);
              return;
            }
            setConfirmAdvanceOpen(false);
            refresh();
          } finally {
            setAdvancing(false);
          }
        }}
        title={
          nextStep
            ? `Move ${detail.repair_number} to ${nextStep.label}?`
            : ""
        }
        description="This updates the repair workflow and the status the customer sees."
        confirmLabel={nextStep ? `Move to ${nextStep.label}` : "Confirm"}
      />

      <AddNoteModal
        open={addNoteOpen}
        onClose={() => setAddNoteOpen(false)}
        repairRequestId={repairRequestId}
        onUpdated={refresh}
      />
      <AddPartModal
        open={addPartOpen}
        onClose={() => setAddPartOpen(false)}
        repairRequestId={repairRequestId}
        onUpdated={refresh}
      />

      {/* Header */}
      <div>
        <p className="text-[15px] font-bold text-[#102c50] dark:text-white">
          Repair detail
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {detail.repair_number} · updated {updatedRelative}
        </p>
      </div>

      {/* Identity */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            {detail.repair_number}
          </p>
          <span
            className={`inline-flex rounded px-2 py-1 text-[10px] font-bold ${
              STATUS_BADGE[detail.status] ?? STATUS_BADGE.PENDING
            }`}
          >
            {STATUS_LABEL[detail.status] ?? detail.status}
          </span>
        </div>

        <h2 className="mt-3 text-[22px] font-bold text-[#102c50] dark:text-white">
          {detail.computer_name}
        </h2>

        <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
          {detail.reported_problem}
        </p>
      </div>

      {/* Status workflow */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Status workflow
        </p>

        {detail.status === "REJECTED" || detail.status === "CANCELLED" ? (
          <div className="mt-4 rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3 py-3 dark:border-[#3a1717] dark:bg-[#3a1717]">
            <p className="text-[11px] font-bold text-[#c0392b] dark:text-[#f87171]">
              This repair was {detail.status.toLowerCase()}
            </p>
            <p className="mt-1 text-[10px] text-[#c0392b]/80 dark:text-[#f87171]/80">
              It is no longer in the active workflow.
            </p>
          </div>
        ) : (
            <ol className="mt-4 space-y-4">
              {WORKFLOW_STEPS.map((step, i) => {
                const done = i < currentIndex;
                const current = i === currentIndex;

                const subLabel = done
                  ? "Completed"
                  : current
                    ? "Current stage"
                    : "Next in workflow";

                return (
                  <li key={step.key} className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
done
? "bg-[#2870e8] text-white"
: current
? "bg-[#2870e8]"
: "border-2 border-slate-200 dark:border-slate-700"
}`}
                    >
                      {done && <Check size={12} strokeWidth={3} />}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#102c50] dark:text-white">
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        {subLabel}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
      </div>

      {/* Request context */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Request context
        </p>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
          <Field label="Customer" value={detail.customer_name} />
          <Field
            label="Device type"
            value={
              COMPUTER_TYPE_LABEL[detail.computer_type] ?? detail.computer_type
            }
          />
          <Field
            label="Technician"
            value={detail.technician_name || "Unassigned"}
            muted={!detail.technician_name}
          />
          <div>
            <p className="text-[10px] text-slate-400">Estimated cost</p>
            {editingEstimate ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  autoFocus
                  value={estimateDraft}
                  onChange={(e) => setEstimateDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEstimate();
                    if (e.key === "Escape") setEditingEstimate(false);
                  }}
                  onBlur={saveEstimate}
                  disabled={savingEstimate}
                  className="h-7 w-24 rounded border border-[#cfd9e8] bg-white px-2 text-[11px] font-bold text-[#102c50] outline-none focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white"
                />
              </div>
            ) : (
                <button
                  type="button"
                  onClick={startEditEstimate}
                  className="mt-1 flex items-center gap-1.5 text-[12px] font-bold text-[#102c50] hover:text-[#2870e8] dark:text-white dark:hover:text-[#8ec5ff]"
                >
                  {formatEstimate(detail.estimate_amount)}
                  <Pencil size={11} className="text-slate-400" />
                </button>
              )}
          </div>
          <Field
            label="Due"
            value={formatDue(detail.appointment_date, detail.appointment_time)}
          />
          <Field
            label="Appointment"
            value={formatAppointmentDate(detail.appointment_date)}
          />
        </div>
      </div>

      {/* Parts used */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Parts used
          </p>
          {parts.length > 0 && (
            <p className="text-[10px] font-bold text-[#102c50] dark:text-white">
              {formatEstimate(totalParts)}
            </p>
          )}
        </div>

        {parts.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-400">
            No parts recorded for this repair yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {parts.map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-md border border-[#e5edf7] bg-[#f8fafc] px-3 py-2.5 dark:border-slate-700 dark:bg-[#162334]"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#102c50] dark:text-white">
                    {p.part_name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {p.part_sku} · {p.quantity_used} ×{" "}
                    {formatEstimate(p.unit_price)}
                  </p>
                  {p.work_note && (
                    <p className="mt-1 text-[10px] italic text-slate-500 dark:text-slate-400">
                      {p.work_note}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <p className="text-[11px] font-bold text-[#102c50] dark:text-white">
                    {formatEstimate(p.line_total)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemovePart(p.id)}
                    aria-label={`Remove ${p.part_name}`}
                    className="text-slate-400 transition-colors hover:text-[#c0392b]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Technician notes */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Technician notes
        </p>

        {notes.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-400">
            No notes recorded yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {notes.map((n) => (
              <li
                key={n.id}
                className="rounded-md border border-[#e5edf7] bg-[#f8fafc] px-3 py-2.5 dark:border-slate-700 dark:bg-[#162334]"
              >
                <p className="text-[11px] leading-5 text-[#102c50] dark:text-white">
                  {n.note}
                </p>
                <p className="mt-1.5 text-[9px] text-slate-400">
                  {n.author_name} · {dayjs(n.created_at).fromNow()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* terminal statuses shouldn't show the reject button */}
      {!["REJECTED", "CANCELLED", "RELEASED"].includes(detail.status) && (
        <div className="w-full mt-5 flex justify-center">
          <CommonButton
            variant="none"
            onClick={() => setConfirmRejectOpen(true)}
            disabled={rejecting}
            className="w-full bg-red-500 hover:bg-red-600 text-white dark:bg-red-900 dark:hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rejecting ? "Rejecting..." : "REJECT"}
          </CommonButton>
        </div>
      )}
    </RightSidebar>
  );
}

function Field({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-slate-400">{label}</p>
      <p
        className={`mt-1 text-[12px] font-bold ${
          muted ? "text-slate-400" : "text-[#102c50] dark:text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
