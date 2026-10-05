import { ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router";

import CommonButton from "../../../components/common/widgets/CommonButton"
import GoogleLogo from "../../../components/common/widgets/GoogleLogo"
import DarkModeButton from "../../../components/common/widgets/DarkModeButton"
import BackButton from "../../../components/common/widgets/BackButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../routes";
import { useState } from "react";

export default function SignInFormSection() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const success = await login(email, password);

      if (!success) {
        setError("Invalid email or password.");
        return;

      }

      navigate(ROUTES.DASHBOARD.ROOT);
    } catch {
      setError("Unable to sign in. Please try again.");
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
          Sign in to Compair
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sign in to request computer or laptop repair and follow every
          update.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <CommonInput
            id="email"
            label="Email address"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${error ? "!border-red-500" : ""}`}
          />

          <CommonInput
            id="password"
            label="Password"
            variant="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${error ? "!border-red-500" : ""}`}
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Need help signing in?
            </span>
            <a
              href="#"
              className="font-semibold text-[#2d65c8] hover:underline dark:text-blue-400"
            >
              Forgot password
            </a>
          </div>

          <CommonButton
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2"
          >
            {submitting
              ? "Signing in..."
              : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )
            }
          </CommonButton>

            {error && (
            <div className="flex justify-center mt-2">
              <span className="text-red-500 text-sm">{error}</span>
            </div>
            )}
        </form>

        <div className="my-5 flex items-center gap-3 text-2xs font-semibold text-slate-400 dark:text-slate-600">
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          OR
          <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <CommonButton
          type="button"
          variant="outline"
          className="flex w-full items-center justify-center gap-2"
        >
          <GoogleLogo size={16} /> Sign in with Google
        </CommonButton>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{" "}
          <Link
            to="?type=signup"
            className="font-semibold text-[#2d65c8] hover:underline dark:text-blue-400"
          >
            Sign up here
          </Link>
        </p>
      </div>

      <p className="mt-10 max-w-sm text-center text-s text-slate-400 dark:text-slate-600">
        By continuing, you agree to the shop&apos;s service terms and
        privacy notice.
      </p>
    </div>
  )
}
