import { useState } from "react";
import { ArrowRight } from "lucide-react";
import dayjs from "dayjs";

import Modal from "../../../components/common/modals/Modal";
import CommonButton from "../../../components/common/widgets/CommonButton";
import MessageModal from "../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../hooks/useModalKeys";
import { useAuth } from "../../../context/AuthContext";
import { createRepairRequest } from "../../../api/repair_requests";
import type { ComputerType } from "../../../types/repair_requests";

const inputClass =
  "h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const textareaClass =
  "w-full rounded-md border border-[#cfd9e8] bg-white px-3 py-2 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white resize-none";

const labelClass =
  "text-xs font-bold uppercase tracking-wider text-slate-400";

const COMPUTER_TYPES: { value: ComputerType; label: string }[] = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "OTHER", label: "Other" },
];

const MIN_HOUR = 8;
const MAX_HOUR = 19;
const MAX_DAYS_AHEAD = 14;

interface CreateRepairRequestModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function CreateRepairRequestModal({
  open,
  onClose,
  onUpdated,
}: CreateRepairRequestModalProps) {
  const { session } = useAuth();
  const fullName = `${session?.user?.firstName || ""} ${session?.user?.lastName || ""}`.trim();
  const email = session?.user?.email || "";

  const [customerName] = useState(fullName);
  const [contactDetail, setContactDetail] = useState(email);
  const [computer, setComputer] = useState("");
  const [computerType, setComputerType] = useState<ComputerType>("LAPTOP");
  const [serialNumber, setSerialNumber] = useState("");
  const [requestedService, setRequestedService] = useState("");
  const [reportedProblem, setReportedProblem] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");

  // bounds for the date input
  const today = dayjs();
  const minDate = today.format("YYYY-MM-DD");
  const maxDate = today.add(MAX_DAYS_AHEAD, "day").format("YYYY-MM-DD");

  function validateDateAndTime(): string {
    if (!preferredDate) return "Preferred date is required.";
    if (!preferredTime) return "Preferred time is required.";

    const picked = dayjs(`${preferredDate}T${preferredTime}`);

    if (picked.isBefore(today, "minute")) {
      return "Preferred date and time must be in the future.";
    }

    if (picked.isAfter(today.add(MAX_DAYS_AHEAD, "day"), "day")) {
      return `Preferred date must be within ${MAX_DAYS_AHEAD} days from today.`;
    }

    const hour = picked.hour();
    if (hour < MIN_HOUR || hour >= MAX_HOUR) {
      return `Preferred time must be between ${MIN_HOUR}:00 AM and ${MAX_HOUR - 12}:00 PM.`;
    }

    return "";
  }

  const handleSubmit = async () => {
    if (submitting) return;

    if (!computer.trim()) {
      setMessageModalMessage("Computer is required.");
      setMessageModalOpen(true);
      return;
    }
    if (!requestedService.trim()) {
      setMessageModalMessage("Requested service is required.");
      setMessageModalOpen(true);
      return;
    }
    if (!reportedProblem.trim()) {
      setMessageModalMessage("Reported problem is required.");
      setMessageModalOpen(true);
      return;
    }

    const dateTimeError = validateDateAndTime();
    if (dateTimeError) {
      setMessageModalMessage(dateTimeError);
      setMessageModalOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createRepairRequest({
        computer_name: computer.trim(),
        computer_type: computerType,
        serial_number: serialNumber.trim() || null,
        contact_detail: contactDetail.trim() || null,
        requested_service: requestedService.trim(),
        reported_problem: reportedProblem.trim(),
        preferred_date: preferredDate,
        preferred_time:
          preferredTime.length === 5 ? `${preferredTime}:00` : preferredTime,
      });

      if (!result) {
        setMessageModalMessage("Failed to create repair request.");
        setMessageModalOpen(true);
        return;
      }

      setMessageModalMessage(
        `Repair ${result.repair_number} submitted. Check your messages for updates.`,
      );
      setMessageModalOpen(true);

      onUpdated();
    } finally {
      setSubmitting(false);
    }
  };

  useEnterKey({
    open,
    onEnter: handleSubmit,
    enabled: open && !submitting,
  });

  return (
    <Modal open={open} onClose={onClose}>
      <MessageModal
        open={messageModalOpen}
        onClose={() => {
          setMessageModalOpen(false);
          onClose();
        }}
        title={messageModalMessage}
      />

      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2870e8]">
        Repairs / new
      </p>

      <div className="mt-2">
        <h2 className="text-lg font-bold text-[#102c50] dark:text-white">
          Create repair request
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Capture the computer context before the customer leaves the desk.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#e6ebf2] pt-2 dark:border-slate-700">
        <div>
          <label className={labelClass}>Customer name</label>
          <input
            type="text"
            value={customerName}
            readOnly
            className={`${inputClass} mt-1.5 cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-[#0f1724]`}
          />
        </div>

        <div>
          <label className={labelClass}>Contact detail</label>
          <input
            type="text"
            value={contactDetail}
            onChange={(e) => setContactDetail(e.target.value)}
            placeholder="Email or phone"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Computer</label>
          <input
            type="text"
            value={computer}
            onChange={(e) => setComputer(e.target.value)}
            placeholder="e.g. Dell Latitude 5420"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div>
          <label className={labelClass}>Computer type</label>
          <select
            value={computerType}
            onChange={(e) => setComputerType(e.target.value as ComputerType)}
            className={`${inputClass} mt-1.5`}
          >
            {COMPUTER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Serial number</label>
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Optional"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Requested service</label>
          <input
            type="text"
            value={requestedService}
            onChange={(e) => setRequestedService(e.target.value)}
            placeholder="e.g. Screen replacement, tune-up, data recovery"
            className={`${inputClass} mt-1.5`}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Reported problem</label>
          <textarea
            value={reportedProblem}
            onChange={(e) => setReportedProblem(e.target.value)}
            placeholder="Describe what the customer reported..."
            rows={4}
            className={`${textareaClass} mt-1.5`}
          />
          <p className="mt-2 text-[10px] leading-4 text-slate-400">
            This is a reported symptom, not an automated diagnosis.
          </p>
        </div>

        <div>
          <label className={labelClass}>Preferred date</label>
          <input
            type="date"
            value={preferredDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
            Between today and {MAX_DAYS_AHEAD} days from now only.
          </p>
        </div>

        <div>
          <label className={labelClass}>Preferred time</label>
          <input
            type="time"
            value={preferredTime}
            min="08:00"
            max="19:00"
            onChange={(e) => setPreferredTime(e.target.value)}
            className={`${inputClass} mt-1.5`}
          />
          <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
            Business hours: 8:00 AM – 7:00 PM.
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
        <CommonButton
          variant="outline"
          onClick={onClose}
          disabled={submitting}
          className="border-[#d4ddea] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </CommonButton>

        <CommonButton
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create request"}
          {!submitting && <ArrowRight size={13} />}
        </CommonButton>
      </div>
    </Modal>
  );
}
