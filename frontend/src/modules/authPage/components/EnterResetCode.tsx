import CommonButton from "../../../components/common/widgets/CommonButton"
import DarkModeButton from "../../../components/common/widgets/DarkModeButton"
import BackButton from "../../../components/common/widgets/BackButton";
import { useNavigate, useSearchParams } from "react-router";
import CommonInput from "../../../components/common/widgets/CommonInput";
import { ROUTES } from "../../../routes";
import { useState } from "react";
import { verifyPasswordResetCode } from "../../../api/auth";
import SetNewPassword from "./SetNewPassword";


export default function EnterResetCode() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  if (resetToken) {
    return <SetNewPassword resetToken={resetToken} onDone={() => navigate(ROUTES.DASHBOARD.ROOT)} />;
  }

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await verifyPasswordResetCode({
        email,
        code: code.trim(),
      });
      if (!result.ok || !result.resetToken) {
        setError(result.message);
        return;
      }
      setResetToken(result.resetToken);
    } catch {
      setError("Unable to verify code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center bg-white px-6 py-12 transition-colors duration-300 dark:bg-[#0b1a2e] lg:w-1/2">
      <BackButton hideOnDesktop={true} variant="absolute"/>
      <DarkModeButton variant="absolute"/>

      <div className="w-full max-w-sm modal-open">
        <p className="text-xs font-bold tracking-widest text-[#2d65c8] dark:text-blue-400">
          Compair computer repair desk
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
          Enter Reset Code
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter the code sent to {email} to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <CommonInput
            id="resetCode"
            label="Reset code"
            type="text"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            className={`${error ? "!border-red-500" : ""}`}
          />

          <CommonButton
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2"
          >
            Verify Code
          </CommonButton>

            {error && (
            <div className="flex justify-center mt-2">
              <span className="text-red-500 text-sm">{error}</span>
            </div>
            )}

          <CommonButton
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            type="button"
            onClick={() => navigate(-1)}
          >
            Back to Log In
          </CommonButton>
        </form>

      </div>

      <p className="mt-10 max-w-sm text-center text-s text-slate-400 dark:text-slate-600">
        By continuing, you agree to the shop&apos;s service terms and
        privacy notice.
      </p>
    </div>
  )
}
