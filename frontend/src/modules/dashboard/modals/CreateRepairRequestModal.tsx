import { useState } from "react";
import { ArrowRight } from "lucide-react";
import dayjs from "dayjs";

import Modal from "../../../components/common/modals/Modal";
import CommonButton from "../../../components/common/widgets/CommonButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import MessageModal from "../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../hooks/useModalKeys";
import { useAuth } from "../../../context/AuthContext";
import { createRepairRequest } from "../../../api/repair_requests";
import type { ComputerType } from "../../../types/repair_requests";

const textareaClass =
  "w-full rounded-md border bg-white px-3 py-2 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:bg-[#182536] dark:text-white resize-none transition-colors";

const selectClass = 
  "h-10 w-full rounded-md border bg-white px-3 text-[12px] text-[#102c50] outline-none transition-colors focus:border-[#2870e8] dark:bg-[#182536] dark:text-white";

const labelClass =
  "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400";

const COMPUTER_TYPES: { value: ComputerType; label: string }[] = [
  { value: "LAPTOP", label: "Laptop" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "OTHER", label: "Other" },
];

// Generate time slots from 8:00 AM to 7:00 PM
const TIME_SLOTS = Array.from({ length: 12 }, (_, i) => {
  const hour24 = i + 8;
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
  const ampm = hour24 >= 12 ? "PM" : "AM";
  return {
    value: `${String(hour24).padStart(2, "0")}:00`,
    label: `${hour12}:00 ${ampm}`,
  };
});

const MAX_DAYS_AHEAD = 14;

interface CreateRepairRequestModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: (scheduledDate: string) => void;
}

export default function CreateRepairRequestModal({
  open,
  onClose,
  onUpdated,
}: CreateRepairRequestModalProps) {
  const { session } = useAuth();
  const fullName = `${session?.user?.firstName || ""} ${session?.user?.lastName || ""}`.trim();
  const email = session?.user?.email || "";

  const [contactDetail, setContactDetail] = useState(email);
  const [computer, setComputer] = useState("");
  const [computerType, setComputerType] = useState<ComputerType>("LAPTOP");
  const [serialNumber, setSerialNumber] = useState("");
  const [requestedService, setRequestedService] = useState("");
  const [reportedProblem, setReportedProblem] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  const today = dayjs().startOf("day");
  const minDate = today.format("YYYY-MM-DD");
  const maxDate = today.add(MAX_DAYS_AHEAD, "day").format("YYYY-MM-DD");

  // --- Validation Logic ---

  function validateField(name: string, value: string): string {
    if (name === "computer" && !value.trim()) return "Computer is required.";
    if (name === "requestedService" && !value.trim()) return "Requested service is required.";
    if (name === "reportedProblem" && !value.trim()) return "Reported problem is required.";
    
    if (name === "preferredDate") {
      if (!value) return "Date is required.";
      const picked = dayjs(value);
      if (picked.isBefore(today, "day")) return "Date cannot be in the past.";
      if (picked.isAfter(today.add(MAX_DAYS_AHEAD, "day"), "day")) {
        return `Date must be within ${MAX_DAYS_AHEAD} days from today.`;
      }
    }

    if (name === "preferredTime") {
      if (!value) return "Time is required.";
      const hour = Number(value.split(":")[0]);
      // Note: 19 is 7:00 PM, so the valid range is 8 to 19 inclusive
      if (hour < 8 || hour > 19) return "Time must be between 8:00 AM and 7:00 PM.";
    }

    return "";
  }

  function handleFieldChange(name: string, value: string, setter: (val: string) => void) {
    setter(value);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  }

  function handleFieldBlur(name: string, value: string) {
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  }

  const handleSubmit = async () => {
    if (submitting) return;

    const newErrors = {
      computer: validateField("computer", computer),
      requestedService: validateField("requestedService", requestedService),
      reportedProblem: validateField("reportedProblem", reportedProblem),
      preferredDate: validateField("preferredDate", preferredDate),
      preferredTime: validateField("preferredTime", preferredTime),
    };

    const hasErrors = Object.values(newErrors).some((err) => err !== "");
    setErrors(newErrors);

    if (hasErrors) return;

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
        preferred_time: `${preferredTime}:00`, // Append seconds
      });

      if (!result) {
        setMessageWasSuccess(false);
        setMessageModalMessage("Failed to create repair request.");
        setMessageModalOpen(true);
        return;
      }

      setMessageWasSuccess(true);
      setMessageModalMessage(`Repair ${result.repair_number} submitted. Check your messages for updates.`);
      setMessageModalOpen(true);
      onUpdated(preferredDate);
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
          if (messageWasSuccess) {
            setMessageWasSuccess(false);
            onClose();
          }
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

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
        
        <div className="col-span-2 sm:col-span-1">
          <CommonInput
            variant="dashboard"
            id="customerName"
            label="Customer name"
            value={fullName}
            readOnly
            className="cursor-not-allowed opacity-70"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <CommonInput
            variant="dashboard"
            id="contactDetail"
            label="Contact detail"
            value={contactDetail}
            onChange={(e) => setContactDetail(e.target.value)}
            placeholder="Email or phone"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <CommonInput
            variant="dashboard"
            id="computer"
            label="Computer"
            value={computer}
            onChange={(e) => handleFieldChange("computer", e.target.value, setComputer)}
            onBlur={() => handleFieldBlur("computer", computer)}
            placeholder="e.g. Dell Latitude 5420"
            error={errors.computer}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass} htmlFor="computerType">Computer type</label>
          <select
            id="computerType"
            value={computerType}
            onChange={(e) => setComputerType(e.target.value as ComputerType)}
            className={`${selectClass} border-[#cfd9e8] dark:border-slate-600`}
          >
            {COMPUTER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <CommonInput
            variant="dashboard"
            id="serialNumber"
            label="Serial number"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div className="col-span-2">
          <CommonInput
            variant="dashboard"
            id="requestedService"
            label="Requested service"
            value={requestedService}
            onChange={(e) => handleFieldChange("requestedService", e.target.value, setRequestedService)}
            onBlur={() => handleFieldBlur("requestedService", requestedService)}
            placeholder="e.g. Screen replacement, tune-up, data recovery"
            error={errors.requestedService}
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass} htmlFor="reportedProblem">Reported problem</label>
          <textarea
            id="reportedProblem"
            value={reportedProblem}
            onChange={(e) => handleFieldChange("reportedProblem", e.target.value, setReportedProblem)}
            onBlur={() => handleFieldBlur("reportedProblem", reportedProblem)}
            placeholder="Describe what the customer reported..."
            rows={3}
            className={`${textareaClass} ${
              errors.reportedProblem ? "border-red-500 focus:border-red-500" : "border-[#cfd9e8] dark:border-slate-600"
            }`}
          />
          {errors.reportedProblem ? (
            <p className="mt-1 text-xs font-medium text-red-500">{errors.reportedProblem}</p>
          ) : (
            <p className="mt-1.5 text-[10px] leading-4 text-slate-400">
              This is a reported symptom, not an automated diagnosis.
            </p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <CommonInput
            variant="dashboard"
            id="preferredDate"
            label="Preferred date"
            type="date"
            value={preferredDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => handleFieldChange("preferredDate", e.target.value, setPreferredDate)}
            onBlur={() => handleFieldBlur("preferredDate", preferredDate)}
            error={errors.preferredDate}
          />
        </div>


        {/* <div className="col-span-2 sm:col-span-1"> */}
        {/*   <CommonInput */}
        {/*     variant="dashboard" */}
        {/*     id="preferredTime" */}
        {/*     label="Preferred time" */}
        {/*     type="time" */}
        {/*     value={preferredTime} */}
        {/*     min="08:00" */}
        {/*     max="19:00" */}
        {/*     onChange={(e) => handleFieldChange("preferredTime", e.target.value, setPreferredTime)} */}
        {/*     onBlur={() => handleFieldBlur("preferredTime", preferredTime)} */}
        {/*     error={errors.preferredTime} */}
        {/*   /> */}
        {/* </div> */}

        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass} htmlFor="preferredTime">Preferred time</label>
          <select
            id="preferredTime"
            value={preferredTime}
            onChange={(e) => handleFieldChange("preferredTime", e.target.value, setPreferredTime)}
            onBlur={() => handleFieldBlur("preferredTime", preferredTime)}
            className={`${selectClass} ${
              errors.preferredTime ? "border-red-500 focus:border-red-500" : "border-[#cfd9e8] dark:border-slate-600"
            }`}
          >
            <option value="" disabled>Select a time</option>
            {TIME_SLOTS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {errors.preferredTime && (
            <p className="mt-1 text-xs font-medium text-red-500">{errors.preferredTime}</p>
          )}
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
