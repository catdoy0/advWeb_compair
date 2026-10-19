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

export default function SettingsDashboard() {
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
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

    const result = await updateStoreSettings({ email: email.trim(), number: number.trim() });
    if (result.settings) {
      setEmail(result.settings.email);
      setNumber(result.settings.number);
      setSaved(true);
    } else {
      setError(result.error);
    }
    setSaving(false);
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

      <div className="mt-6 max-w-3xl">
        <DashboardPanel
          title="Public contact details"
          description="These values are read from the backend store_settings.json file and used in the site footer."
          headerClassName="py-3"
        >
          <form id="store-settings-form" onSubmit={handleSave} className="p-5">
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

            {(error || saved) && (
              <p
                role="status"
                className={`mt-4 text-[11px] ${error ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
              >
                {error || "Store settings saved."}
              </p>
            )}
          </form>
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
