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
import { validateConfirmPassword, validateEmail, validateFirstName, validateLastName, validatePassword } from "./validation";



export default function SignInFormSection() {
  const { signUp } = useAuth()

  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleEmailBlur() {
    const message = validateEmail(email);
    if (message) {
      setEmailError(message);
      return;
    }

    setEmailError("");

    const taken = await checkEmailTaken(email);
    setEmailTaken(taken);
    if (taken) setEmailError("This email is already registered.");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    // run every validator and collect the results
    const nextFirstNameError = validateFirstName(firstName);
    const nextLastNameError = validateLastName(lastName);
    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError = validateConfirmPassword(password, confirmPassword);

    setFirstNameError(nextFirstNameError);
    setLastNameError(nextLastNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);

    const hasError =
      nextFirstNameError ||
      nextLastNameError ||
      nextEmailError ||
      nextPasswordError ||
      nextConfirmPasswordError;

    if (hasError) return;

    setSubmitting(true);
    try {
      // Re-check at submit — user may have edited email after blur.
      const taken = await checkEmailTaken(email);
      if (taken) {
        setEmailTaken(true);
        setEmailError("This email is already registered.");
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

      navigate(ROUTES.DASHBOARD.ROOT);
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
              onChange={(e) => {
                setLastName(e.target.value);
                if (lastNameError) setLastNameError("");
              }}
              onBlur={() => setLastNameError(validateLastName(lastName))}
              error={lastNameError}
            />
            <CommonInput
              id="firstName"
              label="First Name"
              type="text"
              placeholder="e.g Juan"
              required
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (firstNameError) setFirstNameError("");
              }}
              onBlur={() => setFirstNameError(validateFirstName(firstName))}
              error={firstNameError}
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
              if (emailError) setEmailError("");
              if (emailTaken) setEmailTaken(false);
            }}
            onBlur={handleEmailBlur}
            error={emailError}
          />

          <CommonInput
            id="password"
            label="Password"
            variant="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            onBlur={() => setPasswordError(validatePassword(password))}
            error={passwordError}
          />

          <CommonInput
            id="confirmPassword"
            label="Confirm Password"
            variant="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError("");
            }}
            onBlur={() =>
              setConfirmPasswordError(validateConfirmPassword(password, confirmPassword))
            }
            error={confirmPasswordError}
          />

          {error && (
            <p className="text-xs font-medium text-red-500">{error}</p>
          )}

          <CommonButton
            type="submit"
            variant="secondary"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2"
          >
            {submitting ? (
              "Creating Account..."
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
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
  );
}
