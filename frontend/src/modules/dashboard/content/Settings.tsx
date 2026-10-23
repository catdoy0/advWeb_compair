import { useEffect, useState, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import { getStoreSettings, updateStoreSettings } from "../../../api/auth";

const inputClass =
  "h-11 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const labelClass =
  "mb-1.5 block text-[11px] font-bold text-[#102c50] dark:text-white";

const APPOINTMENT_TIME_SLOTS = Array.from({ length: 24 }, (_, hour) =>
  `${String(hour).padStart(2, "0")}:00`,
);
const APPOINTMENT_DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

function formatAppointmentTime(value: string): string {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function SettingsDashboard() {
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getStoreSettings().then((settings) => {
      if (!active) return;
      if (settings) {
        setEmail(settings.email ?? "");
        setNumber(settings.number ?? "");
        setAvailableTimes(settings.available_times ?? APPOINTMENT_TIME_SLOTS);
        setAvailableDays(settings.available_days ?? APPOINTMENT_DAYS.map((day) => day.value));
      } else {
        setError("Could not load store settings. Please refresh and try again.");
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    const result = await updateStoreSettings({
      email: email.trim(),
      number: number.trim(),
      available_times: availableTimes,
      available_days: availableDays,
    });
    if (result.settings) {
      setEmail(result.settings.email);
      setNumber(result.settings.number);
      setAvailableTimes(result.settings.available_times ?? APPOINTMENT_TIME_SLOTS);
      setAvailableDays(
        result.settings.available_days ?? APPOINTMENT_DAYS.map((day) => day.value),
      );
      setSaved(true);
    } else {
      setError(result.error);
    }
    setSaving(false);
  }

  function toggleAppointmentTime(slot: string) {
    setSaved(false);
    setError("");
    if (availableTimes.includes(slot)) {
      if (availableTimes.length === 1) {
        setError("Keep at least one appointment time available.");
        return;
      }
      setAvailableTimes(availableTimes.filter((time) => time !== slot));
      return;
    }
    setAvailableTimes(
      APPOINTMENT_TIME_SLOTS.filter(
        (time) => availableTimes.includes(time) || time === slot,
      ),
    );
  }

  function toggleAppointmentDay(day: number) {
    setSaved(false);
    setError("");
    if (availableDays.includes(day)) {
      if (availableDays.length === 1) {
        setError("Keep at least one appointment day available.");
        return;
      }
      setAvailableDays(availableDays.filter((value) => value !== day));
      return;
    }
    setAvailableDays(
      APPOINTMENT_DAYS.map((value) => value.value).filter(
        (value) => availableDays.includes(value) || value === day,
      ),
    );
  }

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Manage / Workspace"
        title="Store settings"
        description="Update the contact details shown to customers."
        action={
          <CommonButton
            type="submit"
            form="store-settings-form"
            disabled={loading || saving}
            className="flex items-center gap-2 self-start px-4 py-2 xl:self-auto"
          >
            {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving..." : "Save changes"}
          </CommonButton>
        }
      />

      <form
        id="store-settings-form"
        onSubmit={handleSave}
        className="mt-6 max-w-3xl space-y-4"
      >
        <DashboardPanel
          title="Public contact details"
          description="These values are read from the backend store_settings.json file and used in the site footer."
          headerClassName="py-3"
        >
          <div className="p-5">
            {loading ? (
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Loading store settings...</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="store-email" className={labelClass}>
                    Contact email
                  </label>
                  <input
                    id="store-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setSaved(false);
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="store-number" className={labelClass}>
                    Contact number
                  </label>
                  <input
                    id="store-number"
                    name="number"
                    type="tel"
                    autoComplete="tel"
                    required
                    minLength={3}
                    maxLength={30}
                    value={number}
                    onChange={(event) => {
                      setNumber(event.target.value);
                      setSaved(false);
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Appointment availability"
          description="Choose which weekdays and hourly slots customers can select when requesting a repair."
          headerClassName="py-3"
        >
          <div className="p-5">
            {loading ? (
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Loading appointment availability...</p>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-[11px] font-bold text-[#102c50] dark:text-white">
                    Available days
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {APPOINTMENT_DAYS.map((day) => {
                      const enabled = availableDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-pressed={enabled}
                          onClick={() => toggleAppointmentDay(day.value)}
                          className={`flex min-h-10 items-center justify-between rounded-md border px-3 text-[11px] font-semibold transition-colors ${
                            enabled
                              ? "border-[#a8c8ff] bg-[#eef4ff] text-[#2870e8] dark:border-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]"
                              : "border-[#d8e0eb] bg-white text-slate-500 hover:border-[#b9c7d8] dark:border-slate-700 dark:bg-[#151f2d] dark:text-slate-400"
                          }`}
                        >
                          {day.label}
                          <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                            enabled
                              ? "border-[#2870e8] bg-[#2870e8] text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {enabled && <Check size={11} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    {availableDays.length} of {APPOINTMENT_DAYS.length} days available.
                  </p>
                </div>

                <div className="mt-5 border-t border-[#e5edf7] pt-4 dark:border-slate-700">
                  <p className="mb-2 text-[11px] font-bold text-[#102c50] dark:text-white">
                    Available times
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                    {APPOINTMENT_TIME_SLOTS.map((slot) => {
                      const enabled = availableTimes.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          aria-pressed={enabled}
                          onClick={() => toggleAppointmentTime(slot)}
                          className={`flex min-h-10 items-center justify-between rounded-md border px-3 text-[11px] font-semibold transition-colors ${
                            enabled
                              ? "border-[#a8c8ff] bg-[#eef4ff] text-[#2870e8] dark:border-[#2870e8] dark:bg-[#172a42] dark:text-[#8ec5ff]"
                              : "border-[#d8e0eb] bg-white text-slate-500 hover:border-[#b9c7d8] dark:border-slate-700 dark:bg-[#151f2d] dark:text-slate-400"
                          }`}
                        >
                          {formatAppointmentTime(slot)}
                          <span className={`flex h-4 w-4 items-center justify-center rounded border ${
                            enabled
                              ? "border-[#2870e8] bg-[#2870e8] text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {enabled && <Check size={11} strokeWidth={3} />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400">
                    {availableTimes.length} of {APPOINTMENT_TIME_SLOTS.length} times available. Save changes to publish your selection.
                  </p>
                </div>
              </>
            )}
          </div>
        </DashboardPanel>

        {(error || saved) && (
          <p
            role="status"
            className={`text-[11px] ${error ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
          >
            {error || "Store settings saved."}
          </p>
        )}
      </form>
    </DashboardPage>
  );
}
