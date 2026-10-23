import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import dayjs from "dayjs";

import Modal from "../../../components/common/modals/Modal";
import CommonButton from "../../../components/common/widgets/CommonButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import MessageModal from "../../../components/common/modals/MessageModal";
import { useEnterKey } from "../../../hooks/useModalKeys";
import { useAuth } from "../../../context/AuthContext";
import { createRepairRequest } from "../../../api/repair_requests";
import { getStoreSettings } from "../../../api/auth";
import type { ComputerType } from "../../../types/repair_requests";
import { getUsers } from "../../../api/administration";
import type { GetUser } from "../../../types/administration";

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

const MAX_DAYS_AHEAD = 14;
const APPOINTMENT_DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTimeLabel(value: string): string {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

interface CreateRepairRequestModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: (scheduledDate: string) => void;
  selectCustomer?: boolean;
}

export default function CreateRepairRequestModal({
  open,
  onClose,
  onUpdated,
  selectCustomer = false,
}: CreateRepairRequestModalProps) {
  const { session } = useAuth();
  const fullName = `${session?.user?.firstName || ""} ${session?.user?.lastName || ""}`.trim();
  const email = session?.user?.email || "";

  const [contactDetail, setContactDetail] = useState(email);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<GetUser[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<GetUser | null>(null);
  const [computer, setComputer] = useState("");
  const [computerType, setComputerType] = useState<ComputerType>("LAPTOP");
  // const [serialNumber, setSerialNumber] = useState("");
  const [requestedService, setRequestedService] = useState("");
  const [reportedProblem, setReportedProblem] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");
  const [messageWasSuccess, setMessageWasSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    setAvailabilityLoading(true);
    setAvailabilityError("");
    getStoreSettings().then((settings) => {
      if (cancelled) return;
      if (!settings) {
        setAvailableTimes([]);
        setAvailableDays([]);
        setAvailabilityError("Appointment availability could not be loaded.");
      } else {
        const times = settings.available_times ?? [];
        const days = settings.available_days ?? APPOINTMENT_DAY_NAMES.map((_, index) => index + 1);
        setAvailableTimes(times);
        setAvailableDays(days);
        setPreferredTime((current) => times.includes(current) ? current : "");
        if (times.length === 0 || days.length === 0) {
          setAvailabilityError("No appointment availability is currently configured.");
        }
      }
      setAvailabilityLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !selectCustomer) return;
    let cancelled = false;
    getUsers(30, 1, customerSearch, "CUSTOMER").then((result) => {
      if (!cancelled) setCustomers(result ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [open, selectCustomer, customerSearch]);

  const customerName = selectCustomer
    ? selectedCustomer
      ? `${selectedCustomer.first_name ?? ""} ${selectedCustomer.last_name ?? ""}`.trim() || selectedCustomer.email
      : ""
    : fullName;

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
      const isoWeekday = ((picked.day() + 6) % 7) + 1;
      if (availableDays.length > 0 && !availableDays.includes(isoWeekday)) {
        const names = availableDays
          .slice()
          .sort((a, b) => a - b)
          .map((day) => APPOINTMENT_DAY_NAMES[day - 1]);
        return names.length === 1
          ? `That day isn't available. The only available day is ${names[0]}.`
          : `That day isn't available. Available days are ${names.join(", ")}.`;
      }
    }

    if (name === "preferredTime") {
      if (!value || !availableTimes.includes(value)) {
        return "Choose an available time.";
      }
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
      customer: selectCustomer && !selectedCustomer ? "Select a customer." : "",
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
        ...(selectCustomer && selectedCustomer ? { customer_id: selectedCustomer.id } : {}),
        computer_name: computer.trim(),
        computer_type: computerType,
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
          {selectCustomer ? (
            <>
              <label className={labelClass} htmlFor="customerSearch">Customer</label>
              <input
                id="customerSearch"
                value={customerSearch}
                onChange={(event) => setCustomerSearch(event.target.value)}
                placeholder="Search customer name or email"
                className={`${selectClass} border-[#cfd9e8] dark:border-slate-600`}
              />
              <select
                aria-label="Select customer"
                value={selectedCustomer?.id ?? ""}
                onChange={(event) => {
                  const customer = customers.find((item) => item.id === Number(event.target.value)) ?? null;
                  setSelectedCustomer(customer);
                  setContactDetail(customer?.email ?? "");
                  setErrors((previous) => ({ ...previous, customer: "" }));
                }}
                className={`${selectClass} mt-2 border-[#cfd9e8] dark:border-slate-600`}
              >
                <option value="">Choose a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {[customer.first_name, customer.last_name].filter(Boolean).join(" ") || customer.email} · {customer.email}
                  </option>
                ))}
              </select>
              {errors.customer && <p className="mt-1 text-xs font-medium text-red-500">{errors.customer}</p>}
              {selectedCustomer && <p className="mt-1 text-[10px] text-slate-400">Selected: {customerName}</p>}
            </>
          ) : (
            <CommonInput
              variant="dashboard"
              id="customerName"
              label="Customer name"
              value={customerName}
              readOnly
              className="cursor-not-allowed opacity-70"
            />
          )}
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
            label="Computer Model"
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

        {/* <div className="col-span-2"> */}
        {/*   <CommonInput */}
        {/*     variant="dashboard" */}
        {/*     id="serialNumber" */}
        {/*     label="Serial number" */}
        {/*     value={serialNumber} */}
        {/*     onChange={(e) => setSerialNumber(e.target.value)} */}
        {/*     placeholder="Optional" */}
        {/*   /> */}
        {/* </div> */}

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
            onChange={(e) => {
              const value = e.target.value;
              setPreferredDate(value);
              setErrors((previous) => ({ ...previous, preferredDate: validateField("preferredDate", value) }));
            }}
            onBlur={() => handleFieldBlur("preferredDate", preferredDate)}
            error={errors.preferredDate}
          />
        </div>


        <div className="col-span-2 sm:col-span-1">
          <label className={labelClass} htmlFor="preferredTime">Preferred time</label>
          <select
            id="preferredTime"
            value={preferredTime}
            onChange={(e) => handleFieldChange("preferredTime", e.target.value, setPreferredTime)}
            onBlur={() => handleFieldBlur("preferredTime", preferredTime)}
            disabled={availabilityLoading || availableTimes.length === 0}
            className={`${selectClass} ${
              errors.preferredTime || availabilityError
                ? "border-red-500 focus:border-red-500"
                : "border-[#cfd9e8] dark:border-slate-600"
            }`}
          >
            <option value="" disabled>
              {availabilityLoading ? "Loading availability..." : "Select a time"}
            </option>
            {availableTimes.map((time) => (
              <option key={time} value={time}>{formatTimeLabel(time)}</option>
            ))}
          </select>
          {availabilityError && (
            <p className="mt-1 text-xs font-medium text-red-500">{availabilityError}</p>
          )}
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
