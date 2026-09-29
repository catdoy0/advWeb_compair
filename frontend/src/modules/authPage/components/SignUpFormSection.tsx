import { ArrowRight } from "lucide-react"
import { Link, useNavigate } from "react-router";
import { useState } from "react";

import CommonButton from "../../../components/common/widgets/CommonButton"
import DarkModeButton from "../../../components/common/widgets/DarkModeButton"
import BackButton from "../../../components/common/widgets/BackButton";
import CommonInput from "../../../components/common/widgets/CommonInput";
import {  checkEmailTaken } from "../../../api/auth";
import { useAuth } from "../../../context/AuthContext";
import { ROUTES } from "../../../routes";

export default function SignInFormSection() {
  const { signUp } = useAuth()

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleEmailBlur() {
    if (!email) return;
    const taken = await checkEmailTaken(email);
    setEmailTaken(taken);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      // Re-check at submit — user may have edited email after blur.
      const taken = await checkEmailTaken(email);
      if (taken) {
        setEmailTaken(true);
        return;
      }

      const session = await signUp({
        firstName,
        lastName,
        email,
        password,
        confirm_password: confirmPassword,
      });

      if (!session) {
        setError("Unable to create account. Please try again.");
        return;
      }

      navigate(ROUTES.DASHBOARD);
    } catch {
      setError("Unable to create account. Please try again.");
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
          Create your account
        </h2>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Track your computer repair, message the shop, and keep your service history close.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex flex-row gap-4">
            <CommonInput
              id="lastName"
              label="Last Name"
              type="text"
              placeholder="e.g Cruz"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <CommonInput
              id="firstName"
              label="First Name"
              type="text"
              placeholder="e.g Juan"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <CommonInput
            id="email"
            label="Email address"
            type="email"
            placeholder="Enter email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailTaken) setEmailTaken(false);
            }}
            onBlur={handleEmailBlur}
            className={emailTaken ? "!border-red-500" : ""}
          />

          <CommonInput
            id="password"
            label="Password"
            variant="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <CommonInput
            id="confirmPassword"
            label="Confirm Password"
            variant="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {error && (
            <p className="text-xs font-medium text-red-500">{error}</p>
          )}

          {emailTaken && (
            <p className="text-xs font-medium text-red-500">
              This email is already registered.
            </p>
          )}

          <CommonButton
            type="submit"
            variant="secondary"
            disabled={submitting || emailTaken}
            className="flex w-full items-center justify-center gap-2"
          >
            {submitting
              ? "Creating Account..."
              : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )
            }
          </CommonButton>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            to="?type=signin"
            className="font-semibold text-[#2d65c8] hover:underline dark:text-blue-400"
          >
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-10 max-w-sm text-center text-xs text-slate-400 dark:text-slate-600">
        By continuing, you agree to the shop&apos;s service terms and
        privacy notice.
      </p>
    </div>
  )
}
