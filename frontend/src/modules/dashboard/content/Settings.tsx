import { useState } from "react";
import { Check } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import PageHeader from "../components/PageHeader";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";

const inputClass =
  "h-11 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const labelClass =
  "mb-1.5 block text-[11px] font-bold text-[#102c50] dark:text-white";

interface NotificationOption {
  id: string;
  title: string;
  description: string;
}

const notificationOptions: NotificationOption[] = [
  {
    id: "customer-messages",
    title: "Customer messages",
    description:
      "Allow the team to respond to repair questions from the inbox.",
  },
  {
    id: "low-stock-alerts",
    title: "Low-stock alerts",
    description:
      "Flag parts when on-hand quantity reaches the reorder point.",
  },
  {
    id: "appointment-reminders",
    title: "Appointment reminders",
    description:
      "Keep upcoming bookings visible in the daily operations view.",
  },
];

export default function SettingsDashboard() {
  const [shopName, setShopName] = useState("Compair Repair Desk");
  const [supportEmail, setSupportEmail] = useState("hello@compair.local");
  const [supportPhone, setSupportPhone] = useState("+63 917 555 0142");

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "customer-messages": false,
    "low-stock-alerts": false,
    "appointment-reminders": false,
  });

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    // TODO: call update-settings endpoint
  };

  return (
    <DashboardPage>
      <PageHeader
        eyebrow="Manage / Workspace"
        title="TODO: Workspace settings"
        description="Shape the operational defaults for the Compair repair desk."
        action={
          <CommonButton
            onClick={handleSave}
            className="flex items-center gap-2 self-start px-4 py-2 xl:self-auto"
          >
            <Check size={14} />
            Save changes
          </CommonButton>
        }
      />

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        {/* Business details */}
        <DashboardPanel
          title="Business details"
          description="Use the details customers and staff should see."
          headerClassName="py-3"
        >
          <div className="p-5">
            <div>
              <label htmlFor="shop-name" className={labelClass}>
                Shop name
              </label>
              <input
                id="shop-name"
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="support-email" className={labelClass}>
                  Support email
                </label>
                <input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="support-phone" className={labelClass}>
                  Support phone
                </label>
                <input
                  id="support-phone"
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </DashboardPanel>

        {/* Notifications */}
        <DashboardPanel
          title="Notifications and customer care"
          description="Choose what the team should be prompted to follow up."
          headerClassName="py-3"
        >
          <div className="px-5 pb-2">
            {notificationOptions.map((option, index) => (
              <div
                key={option.id}
                className={`flex items-start justify-between gap-4 py-4 ${
                  index < notificationOptions.length - 1
                    ? "border-b border-[#e6ebf2] dark:border-slate-700"
                    : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-[#102c50] dark:text-white">
                    {option.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-400">
                    {option.description}
                  </p>
                </div>

                <label className="flex shrink-0 cursor-pointer items-center pt-0.5">
                  <input
                    type="checkbox"
                    checked={notifications[option.id]}
                    onChange={() => toggleNotification(option.id)}
                    className="peer sr-only"
                  />
                  <span
                    className="
                      flex h-5 w-5 items-center justify-center rounded
                      border border-[#cfd9e8] bg-white
                      transition-colors
                      peer-checked:border-[#2870e8] peer-checked:bg-[#2870e8]
                      dark:border-slate-600 dark:bg-[#182536]
                    "
                  >
                    {notifications[option.id] && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </DashboardPanel>
      </div>
    </DashboardPage>
  );
}
