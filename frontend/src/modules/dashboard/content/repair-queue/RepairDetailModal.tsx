import { useEffect, useState } from "react";
import { ArrowRight, Check, FileText, Package } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import RightSidebar from "../../../../components/common/modals/RightSideBar";
import CommonButton from "../../../../components/common/widgets/CommonButton";
import { getRepairDetail } from "../../../../api/repair_requests";
import type {
  RepairDetail,
  RepairQueueStatus,
} from "../../../../types/repair_requests";

dayjs.extend(relativeTime);

// Full workflow, including the pre-acceptance PENDING state.
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const data = await getRepairDetail(repairRequestId);
      if (cancelled) return;
      setDetail(data);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [repairRequestId]);

  if (loading) {
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

  const footer = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <CommonButton
          variant="outline"
          onClick={() => {
            // TODO: open add-parts modal
          }}
          className="flex items-center justify-center gap-2 border-[#d4ddea] px-4 py-2"
        >
          <Package size={13} />
          Add parts
        </CommonButton>

        <CommonButton
          variant="outline"
          onClick={() => {
            // TODO: open add-note modal
          }}
          className="flex items-center justify-center gap-2 border-[#d4ddea] px-4 py-2"
        >
          <FileText size={13} />
          Add note
        </CommonButton>
      </div>

      {nextStep && (
        <CommonButton
          onClick={() => {
            // TODO: POST /repair-requests/{id}/advance-status
            console.log("advance to", nextStep.key);
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 px-4 py-2.5"
        >
          Move to {nextStep.label}
          <ArrowRight size={13} />
        </CommonButton>
      )}
    </>
  );

  return (
    <RightSidebar open={open} onClose={onClose} footer={footer}>
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
          <Field
            label="Estimated cost"
            value={formatEstimate(detail.estimate_amount)}
          />
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
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Parts used
        </p>
        <p className="mt-3 text-[11px] text-slate-400">
          No parts recorded for this repair yet.
        </p>
      </div>

      {/* Technician notes */}
      <div className="mt-6 border-t border-[#e5edf7] pt-6 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Technician notes
        </p>
        {detail.diagnosis ? (
          <p className="mt-3 text-[11px] text-[#102c50] dark:text-white">
            {detail.diagnosis}
          </p>
        ) : (
          <p className="mt-3 text-[11px] text-slate-400">
            No notes recorded yet.
          </p>
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
