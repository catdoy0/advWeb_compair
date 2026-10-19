import { useNavigate } from "react-router";

import CommonButton from "../../../components/common/widgets/CommonButton"
import DarkModeButton from "../../../components/common/widgets/DarkModeButton"
import BackButton from "../../../components/common/widgets/BackButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import { requestPasswordReset } from "../../../api/auth";
import { useState } from "react";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await requestPasswordReset(email.trim());
      if (!result.ok) {
        setError(result.message);
        return;
      }
      navigate(`?type=enter-reset&email=${encodeURIComponent(email.trim())}`);
    } catch {
      setError("Unable to send reset code. Please try again.");
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
          Forgot Password
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Enter your email to send a reset code
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <CommonInput
            id="email"
            label="Email address"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            required
            className={`${error ? "!border-red-500" : ""}`}
          />

          <CommonButton
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2"
          >
            Send Reset Code
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

