import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import RightSidebar from "../../../../components/common/modals/RightSideBar";
import {
  getRepairDetail,
  listRepairNotes,
  listRepairParts,
} from "../../../../api/repair_requests";
import type {
  RepairDetail,
  RepairNote,
  RepairPartUsage,
  RepairQueueStatus,
} from "../../../../types/repair_requests";

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

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(value);
}

interface CustomerRepairDetailModalProps {
  open: boolean;
  onClose: () => void;
  repairRequestId: number | null;
}

export default function CustomerRepairDetailModal(
  props: CustomerRepairDetailModalProps,
) {
  if (!props.open || props.repairRequestId === null) return null;
  return (
    <DetailContent
      {...props}
      repairRequestId={props.repairRequestId}
    />
  );
}

function DetailContent({
  open,
  onClose,
  repairRequestId,
}: CustomerRepairDetailModalProps & { repairRequestId: number }) {
  const [detail, setDetail] = useState<RepairDetail | null>(null);
  const [notes, setNotes] = useState<RepairNote[]>([]);
  const [parts, setParts] = useState<RepairPartUsage[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [repairRequestId]);

  if (loading || !detail) {
    return (
      <RightSidebar open={open} onClose={onClose}>
        <p className="py-20 text-center text-[11px] text-slate-400">
          {loading ? "Loading repair..." : "Repair not found."}
        </p>
      </RightSidebar>
    );
  }

  const currentIndex = WORKFLOW_STEPS.findIndex(
    (s) => s.key === detail.status,
  );

  const updatedRelative = detail.updated_at
    ? dayjs(detail.updated_at).fromNow()
    : dayjs(detail.created_at).fromNow();

  const totalParts = parts.reduce((sum, p) => sum + p.line_total, 0);

  return (
    <RightSidebar open={open} onClose={onClose}>
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

      {/* Workflow stepper (read-only) */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Status
        </p>

        {detail.status === "REJECTED" || detail.status === "CANCELLED" ? (
          <div className="mt-4 rounded-md border border-[#f5c2c2] bg-[#fdecec] px-3 py-3 dark:border-[#3a1717] dark:bg-[#3a1717]">
            <p className="text-[11px] font-bold text-[#c0392b] dark:text-[#f87171]">
              This repair was {detail.status.toLowerCase()}
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
                  : "Not started";

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

      {/* Request context — read-only, customer-relevant fields only */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Details
        </p>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
          <Field
            label="Device type"
            value={
              COMPUTER_TYPE_LABEL[detail.computer_type] ?? detail.computer_type
            }
          />
          <Field label="Serial number" value={detail.serial_number || "—"} muted={!detail.serial_number} />
          <Field
            label="Requested service"
            value={detail.requested_service}
          />
          <Field
            label="Estimated cost"
            value={formatMoney(detail.estimate_amount)}
          />
          {detail.appointment_date && (
            <Field
              label="Appointment"
              value={dayjs(detail.appointment_date).format("MMM D, YYYY")}
            />
          )}
          {detail.technician_name && (
            <Field label="Technician" value={detail.technician_name} />
          )}
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
              {formatMoney(totalParts)}
            </p>
          )}
        </div>

        {parts.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-400">
            No parts recorded yet.
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
                    {p.quantity_used} × {formatMoney(p.unit_price)}
                  </p>
                </div>
                <p className="shrink-0 text-[11px] font-bold text-[#102c50] dark:text-white">
                  {formatMoney(p.line_total)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notes */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Updates from the shop
        </p>

        {notes.length === 0 ? (
          <p className="mt-3 text-[11px] text-slate-400">
            No updates yet.
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
