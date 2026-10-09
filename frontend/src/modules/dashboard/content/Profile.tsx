import { useState } from "react";
import { Check, LogOut } from "lucide-react";

import CommonButton from "../../../components/common/widgets/CommonButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import AreYouSureModal from "../../../components/common/modals/AreYouSureModal";
import MessageModal from "../../../components/common/modals/MessageModal";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../../../context/AuthContext";
import { dummySession } from "../../../dummyData";
import DashboardPage from "../components/DashboardPage";
import DashboardPanel from "../components/DashboardPanel";
import { changeEmail, changePassword } from "../../../api/profile";

const PASSWORD_MIN = 8;

function validateEmail(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
  return "";
}

function validateRequired(value: string, label: string): string {
  if (!value) return `${label} is required.`;
  return "";
}

function validateNewPassword(value: string, currentPassword: string): string {
  if (!value) return "New password is required.";
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (value.length > 128) return "Password is too long.";
  if (!/[A-Za-z]/.test(value)) return "Password must include at least one letter.";
  if (!/[0-9]/.test(value)) return "Password must include at least one number.";
  if (value === currentPassword) return "New password must be different from the current one.";
  return "";
}

export default function Profile() {
  const { session, logout, refresh } = useAuth();
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

  // message modal
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalMessage, setMessageModalMessage] = useState("");

  // email form
  const [email, setEmail] = useState(user.email);
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailPasswordError, setEmailPasswordError] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveEmail() {
    const nextEmailError = validateEmail(email);
    const nextEmailPasswordError = validateRequired(emailPassword, "Current password");

    setEmailError(nextEmailError);
    setEmailPasswordError(nextEmailPasswordError);

    if (nextEmailError || nextEmailPasswordError) return;

    if (email.trim().toLowerCase() === user.email.toLowerCase()) {
      setMessageModalMessage("That is already your current email.");
      setMessageModalOpen(true);
      return;
    }

    setSavingEmail(true);
    try {
      const result = await changeEmail({
        email: email.trim(),
        currentPassword: emailPassword,
      });

      setMessageModalMessage(result.message);
      setMessageModalOpen(true);

      if (result.ok) {
        setEmailPassword("");
        await refresh();   // ← pick up the new email in the session
        // keep the new email visible in the input — do not reset to the session value
      }
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleUpdatePassword() {
    const nextCurrentError = validateRequired(currentPassword, "Current password");
    const nextNewError = validateNewPassword(newPassword, currentPassword);
    const nextConfirmError = !confirmPassword
      ? "Please confirm your new password."
      : confirmPassword !== newPassword
        ? "Passwords do not match."
        : "";

    setCurrentPasswordError(nextCurrentError);
    setNewPasswordError(nextNewError);
    setConfirmPasswordError(nextConfirmError);

    if (nextCurrentError || nextNewError || nextConfirmError) return;

    setSavingPassword(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setMessageModalMessage(result.message);
      setMessageModalOpen(true);

      if (result.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <DashboardPage>
      <MessageModal
        open={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        title={messageModalMessage}
      />

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
        <DashboardPanel
          title="Account profile"
          description="Your identity and access details for this workspace."
          headerClassName="py-3"
          headerAction={
            <span className="rounded bg-[#e3f5ec] px-2 py-0.5 text-[10px] font-semibold text-[#168a52] dark:bg-[#12332a] dark:text-[#4ade80]">
              Active
            </span>
          }
        >
          <div className="p-5">
            <div className="flex items-center gap-3 border-b border-[#e6ebf2] pb-5 dark:border-slate-700">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2870e8] text-[13px] font-bold text-white">
                {initials}
              </div>
              <p className="text-[18px] font-bold text-[#102c50] dark:text-white">
                {fullName}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-4 border-b border-[#e6ebf2] py-4 dark:border-slate-700">
              <div>
                <dt className="text-[9px] text-slate-400">Last name</dt>
                <dd className="mt-1 text-[11px] font-bold text-[#102c50] dark:text-white">
                  {user.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-[9px] text-slate-400">First name</dt>
                <dd className="mt-1 text-[11px] font-bold text-[#102c50] dark:text-white">
                  {user.firstName}
                </dd>
              </div>
            </dl>

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div>
                <CommonInput
                  id="profile-email"
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  error={emailError}
                />
                {!emailError && (
                  <p className="mt-2 text-[10px] leading-4 text-slate-400">
                    This email is used to sign in and receive repair updates.
                  </p>
                )}
              </div>

              <div>
                <CommonInput
                  id="profile-email-password"
                  label="Current password"
                  variant="password"
                  autoComplete="current-password"
                  value={emailPassword}
                  onChange={(e) => {
                    setEmailPassword(e.target.value);
                    if (emailPasswordError) setEmailPasswordError("");
                  }}
                  error={emailPasswordError}
                />
                {!emailPasswordError && (
                  <p className="mt-2 text-[10px] leading-4 text-slate-400">
                    Confirm your current password to change the sign-in email.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-[#e6ebf2] pt-3 dark:border-slate-700">
              <CommonButton
                variant="outline"
                onClick={handleSaveEmail}
                disabled={savingEmail}
                className="flex items-center gap-2 border-[#d4ddea] px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEmail ? "Saving..." : "Save email"}
                {!savingEmail && <Check size={14} />}
              </CommonButton>
            </div>
          </div>
        </DashboardPanel>

        {/* Change password */}
        <DashboardPanel
          title="Change password"
          description="Use a private password that only you can use to sign in."
          headerClassName="py-3"
        >
          <div className="p-5">
            <CommonInput
              id="current-password"
              label="Current password"
              variant="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (currentPasswordError) setCurrentPasswordError("");
              }}
              error={currentPasswordError}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CommonInput
                id="new-password"
                label="New password"
                variant="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (newPasswordError) setNewPasswordError("");
                }}
                error={newPasswordError}
              />

              <CommonInput
                id="confirm-password"
                label="Confirm password"
                variant="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError("");
                }}
                error={confirmPasswordError}
              />
            </div>

            <div className="mt-6 flex justify-end border-t border-[#e6ebf2] pt-4 dark:border-slate-700">
              <CommonButton
                onClick={handleUpdatePassword}
                disabled={savingPassword}
                className="flex items-center gap-2 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                variant="secondary"
              >
                {savingPassword ? "Updating..." : "Update password"}
                {!savingPassword && <Check size={14} />}
              </CommonButton>
            </div>

            <p className="mt-4 max-w-[560px] text-[10px] leading-4 text-slate-400">
              Passwords must be at least {PASSWORD_MIN} characters, include a letter and a number.
              Super admins can reset staff passwords from Administration.
            </p>
          </div>
        </DashboardPanel>
      </div>

      <AreYouSureModal
        open={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
        onConfirm={logout}
        title="Are you sure you want to log out?"
      />
    </DashboardPage>
  );
}
