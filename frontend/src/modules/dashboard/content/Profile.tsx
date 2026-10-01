import { useState } from "react";
import { Check, LogOut } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { dummySession } from "../../../dummyData";

const inputClass =
  "h-10 w-full rounded-md border border-[#cfd9e8] bg-white px-3 text-[12px] text-[#102c50] outline-none placeholder:text-slate-400 focus:border-[#2870e8] dark:border-slate-600 dark:bg-[#182536] dark:text-white";

const labelClass =
  "mb-1.5 block text-[11px] font-bold text-[#102c50] dark:text-white";

export default function Profile() {
  const { session, logout } = useAuth();
  const { user } = session ?? dummySession;

  const hasName = Boolean(user.firstName || user.lastName);
  const fullName = hasName
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : user.email;
  const initials = (
    hasName
      ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
      : user.email[0] ?? "?"
  ).toUpperCase();

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Email form
  const [email, setEmail] = useState(user.email);
  const [emailPassword, setEmailPassword] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSaveEmail = () => {
    // TODO: call update-email endpoint
  };

  const handleUpdatePassword = () => {
    // TODO: call change-password endpoint
  };

  return (
    <main className="flex-1 dark:bg-[#0f1724]">
      <div className="mx-auto max-w-[1240px] p-5 lg:p-7">
        <PageHeader
          eyebrow="Account / profile"
          title="My profile"
          description="Manage your account details and password."
          action={
            <CommonButton
              variant="outline"
              onClick={() => setIsLogoutOpen(true)}
              className="flex items-center gap-2 self-start border-[#d4ddea] px-4 py-2 xl:self-auto"
            >
              <LogOut size={14} />
              Sign out
            </CommonButton>
          }
        />

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
          {/* Account profile */}
          <section className="overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
            <div className="flex items-start justify-between gap-3 border-b border-[#d8e0eb] px-5 py-3 dark:border-slate-700">
              <div>
                <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                  Account profile
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Your identity and access details for this workspace.
                </p>
              </div>

              <span className="rounded bg-[#e3f5ec] px-2 py-0.5 text-[10px] font-semibold text-[#168a52] dark:bg-[#12332a] dark:text-[#4ade80]">
                Active
              </span>
            </div>

            <div className="p-5">
              {/* Identity */}
              <div className="flex items-center gap-3 border-b border-[#e6ebf2] pb-5 dark:border-slate-700">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2870e8] text-[13px] font-bold text-white">
                  {initials}
                </div>
                <p className="text-[18px] font-bold text-[#102c50] dark:text-white">
                  {fullName}
                </p>
              </div>

              {/* Details */}
              <dl className="grid grid-cols-2 gap-4 border-b border-[#e6ebf2] py-4 dark:border-slate-700">
                <div>
                  <dt className="text-[9px] text-slate-400">Full name</dt>
                  <dd className="mt-1 text-[11px] font-bold text-[#102c50] dark:text-white">
                    {fullName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] text-slate-400">Last sign in</dt>
                  <dd className="mt-1 text-[11px] font-bold text-[#102c50] dark:text-white">
                    Just now
                  </dd>
                </div>
              </dl>

              {/* Email change */}
              <div className="grid gap-4 py-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="profile-email" className={labelClass}>
                    Email address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`${inputClass} h-11`}
                  />
                  <p className="mt-2 text-[10px] leading-4 text-slate-400">
                    This email is used to sign in and receive repair updates.
                  </p>
                </div>

                <div>
                  <label htmlFor="profile-email-password" className={labelClass}>
                    Current password
                  </label>
                  <input
                    id="profile-email-password"
                    type="password"
                    autoComplete="current-password"
                    value={emailPassword}
                    onChange={(event) => setEmailPassword(event.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-2 text-[10px] leading-4 text-slate-400">
                    Confirm your current password to change the sign-in email.
                  </p>
                </div>
              </div>

              <div className="flex justify-end border-t border-[#e6ebf2] pt-3 dark:border-slate-700">
                <CommonButton
                  variant="outline"
                  onClick={handleSaveEmail}
                  className="flex items-center gap-2 border-[#d4ddea] px-4 py-2"
                >
                  Save email
                  <Check size={14} />
                </CommonButton>
              </div>
            </div>
          </section>

          {/* Change password */}
          <section className="overflow-hidden rounded-lg border border-[#d8e0eb] bg-white dark:border-slate-700 dark:bg-[#111c2b]">
            <div className="border-b border-[#d8e0eb] px-5 py-3 dark:border-slate-700">
              <h2 className="text-[14px] font-bold text-[#102c50] dark:text-white">
                Change password
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Use a private password that only you can use to sign in.
              </p>
            </div>

            <div className="p-5">
              <div>
                <label htmlFor="current-password" className={labelClass}>
                  Current password
                </label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={`${inputClass} h-11`}
                />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="new-password" className={labelClass}>
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className={`${inputClass} h-11`}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className={labelClass}>
                    Confirm password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={`${inputClass} h-11`}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
                <CommonButton
                  onClick={handleUpdatePassword}
                  className="flex items-center gap-2 px-4 py-2"
                  variant="secondary"
                >
                  Update password
                  <Check size={14} />
                </CommonButton>
              </div>

              <p className="mt-4 max-w-[560px] text-[10px] leading-4 text-slate-400">
                Passwords must be at least 8 characters. Super admins can reset
                staff passwords to a surname-based default from Administration.
              </p>
            </div>
          </section>
        </div>
      </div>

      <AreYouSureModal
        open={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={logout}
        title="Are you sure you want to log out?"
      />
    </main>
  );
}
