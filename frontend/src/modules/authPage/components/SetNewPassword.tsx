import { useState } from "react";
import { useNavigate } from "react-router";

import { resetPassword } from "../../../api/auth";
import BackButton from "../../../components/common/widgets/BackButton";
import CommonButton from "../../../components/common/widgets/CommonButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import DarkModeButton from "../../../components/common/widgets/DarkModeButton";
import { validateConfirmPassword, validatePassword } from "./validation";
import { useAuth } from "../../../context/AuthContext";

export default function SetNewPassword({
  resetToken,
  onDone,
}: {
  resetToken: string;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");

    const passwordError = validatePassword(password);
    const confirmError = validateConfirmPassword(password, confirmPassword);
    if (passwordError || confirmError) {
      setError(passwordError || confirmError);
      return;
    }

    setSubmitting(true);
    const result = await resetPassword({
      reset_token: resetToken,
      password,
      confirm_password: confirmPassword,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    await refresh();
    onDone();
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 transition-colors duration-300 dark:bg-[#0b1a2e] lg:w-1/2">
      <BackButton hideOnDesktop={true} variant="absolute" />
      <DarkModeButton variant="absolute" />

      <div className="w-full max-w-sm modal-open">
        <p className="text-xs font-bold tracking-widest text-[#2d65c8] dark:text-blue-400">
          Compair computer repair desk
        </p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
          Set a New Password
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This reset session expires in five minutes.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <CommonInput
            id="newPassword"
            label="New password"
            variant="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <CommonInput
            id="confirmPassword"
            label="Confirm new password"
            variant="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="text-center text-sm text-red-500">{error}</p>}

          <CommonButton
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2"
          >
            Update Password
          </CommonButton>
          <CommonButton
            type="button"
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            onClick={() => navigate(-1)}
          >
            Back
          </CommonButton>
        </form>
      </div>
    </div>
  );
}
