"use client";

import Image from "next/image";
import { Eye, EyeOff, TimerReset } from "lucide-react";
import { signIn } from "next-auth/react";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthStep =
  "login" | "signup" | "forgot-password" | "verify-otp" | "change-password";
type VerificationPurpose = "registration" | "password-reset";

interface ApiResponse<T> {
  data: T;
  message: string;
}

const OTP_LENGTH = 6;

const copy: Record<AuthStep, { title: string; description: string }> = {
  login: {
    title: "Welcome",
    description: "Sign in to oversee accounts, listings, and updates",
  },
  signup: {
    title: "Create Account",
    description: "Create an account to access the dashboard",
  },
  "forgot-password": {
    title: "Forgot Password",
    description: "Enter your email to recover your password",
  },
  "verify-otp": {
    title: "Verify Code",
    description: "Enter the six-digit code sent to your email",
  },
  "change-password": {
    title: "Create New Password",
    description: "Choose a new password with at least eight characters",
  },
};

async function postAuth<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(payload.message || "Request failed. Please try again.");
  }

  return payload.data;
}

function PasswordInput({
  id,
  label,
  autoComplete,
  value,
  onChange,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="********"
          required
          minLength={6}
          className="auth-input pr-12"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded text-[#555] hover:bg-[#eef1ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d2b4f]"
        >
          {isVisible ? (
            <EyeOff className="size-5" />
          ) : (
            <Eye className="size-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("login");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [verificationPurpose, setVerificationPurpose] =
    useState<VerificationPurpose>("password-reset");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);

  const goTo = (nextStep: AuthStep) => {
    setError("");
    setNotice("");
    setStep(nextStep);
    if (nextStep === "verify-otp") setOtp(Array(OTP_LENGTH).fill(""));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      if (step === "login") {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
          callbackUrl: "/dashboard",
        });

        if (!result || result.error) {
          throw new Error(result?.error || "Unable to sign in");
        }

        window.location.assign("/dashboard");
        return;
      }

      if (step === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        await postAuth("/auth/register", {
          email,
          fullName,
          password,
          role: "customer",
        });
        setVerificationPurpose("registration");
        goTo("verify-otp");
        setNotice("Check your email for the verification code.");
        return;
      }

      if (step === "forgot-password") {
        await postAuth("/auth/forgot-password", { email });
        setVerificationPurpose("password-reset");
        goTo("verify-otp");
        setNotice("If an account exists, a reset code has been sent.");
        return;
      }

      if (step === "verify-otp") {
        const code = otp.join("");
        if (code.length !== OTP_LENGTH) {
          throw new Error("Enter all six code digits");
        }

        if (verificationPurpose === "registration") {
          await postAuth("/auth/verify-email", { code, email });
          setPassword("");
          setConfirmPassword("");
          goTo("login");
          setNotice("Email verified. You can now sign in.");
          return;
        }

        const result = await postAuth<{ resetToken: string }>(
          "/auth/verify-reset-otp",
          {
            email,
            otp: code,
          },
        );
        setResetToken(result.resetToken);
        goTo("change-password");
        return;
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      await postAuth("/auth/reset-password", {
        newPassword: password,
        resetToken,
      });
      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      goTo("login");
      setNotice("Password updated. Sign in with your new password.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Request failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    setOtp((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? digit : item)),
    );
    if (digit && index < OTP_LENGTH - 1) otpInputs.current[index + 1]?.focus();
  };

  const resendCode = async () => {
    setError("");
    setNotice("");
    setIsSubmitting(true);

    try {
      if (verificationPurpose === "registration") {
        await postAuth("/auth/resend-verification", { email });
        setNotice("A new verification code has been sent.");
      } else {
        await postAuth("/auth/forgot-password", { email });
        setNotice("If an account exists, a new reset code has been sent.");
      }
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Unable to resend the code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white p-3 sm:p-6">
      <section className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1600px] gap-10 lg:grid-cols-[minmax(0,818px)_minmax(560px,681px)] lg:items-center lg:justify-center lg:gap-[clamp(3rem,9vw,12rem)]">
        <div className="relative hidden min-h-[720px] overflow-hidden rounded-[30px] lg:block xl:min-h-[976px]">
          <Image
            src="/images/auth/auth-panel.png"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1280px) 50vw, 0vw"
          />
        </div>

        <div className="mx-auto flex w-full max-w-[681px] flex-col items-center gap-8 py-10 sm:gap-10 lg:py-0">
          <Image
            src="/images/auth/auth-logo.png"
            alt="Kungfujew"
            width={128}
            height={128}
            priority
            className="size-24 sm:size-32"
          />
          <div className="w-full rounded-2xl border border-[#d9dffa] bg-white p-6 shadow-[0_4px_3px_rgba(0,0,0,0.1)] sm:p-10">
            <div className="text-center">
              <h1 className="font-serif text-[34px] leading-[1.5] text-[#1d2b4f] sm:text-[40px]">
                {copy[step].title}
              </h1>
              <p className="text-base leading-6 text-[#6c757d]">
                {copy[step].description}
              </p>
            </div>

            <form onSubmit={submit} className="mt-10 space-y-10">
              {step === "login" && (
                <LoginFields
                  email={email}
                  password={password}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onForgot={() => goTo("forgot-password")}
                />
              )}
              {step === "signup" && (
                <SignupFields
                  email={email}
                  fullName={fullName}
                  password={password}
                  confirmPassword={confirmPassword}
                  onEmailChange={setEmail}
                  onFullNameChange={setFullName}
                  onPasswordChange={setPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                />
              )}
              {step === "forgot-password" && (
                <EmailField email={email} onChange={setEmail} />
              )}
              {step === "verify-otp" && (
                <OtpFields
                  disabled={isSubmitting}
                  otp={otp}
                  inputs={otpInputs}
                  onChange={updateOtp}
                  onResend={resendCode}
                />
              )}
              {step === "change-password" && (
                <div className="space-y-4">
                  <PasswordInput
                    id="new-password"
                    label="Create New Password"
                    autoComplete="new-password"
                    value={password}
                    onChange={setPassword}
                  />
                  <PasswordInput
                    id="confirm-password"
                    label="Confirm New Password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                </div>
              )}

              {(error || notice) && (
                <p
                  role={error ? "alert" : "status"}
                  className={
                    error ? "text-sm text-red-600" : "text-sm text-green-700"
                  }
                >
                  {error || notice}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-12 w-full rounded-md bg-[#1d2b4f] text-base font-bold text-[#f7f8f8] shadow-none hover:bg-[#273962]"
              >
                {isSubmitting
                  ? "Please wait..."
                  : step === "login"
                    ? "Log In"
                    : step === "signup"
                      ? "Sign Up"
                      : step === "forgot-password"
                        ? "Send OTP"
                        : step === "verify-otp"
                          ? "Verify"
                          : "Change Password"}
              </Button>
            </form>

            {step === "login" && (
              <p className="mt-10 text-center text-base text-[#2b2b2b]">
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => goTo("signup")}
                  className="font-bold text-[#1d2b4f] hover:underline"
                >
                  Sign Up
                </button>
              </p>
            )}
            {step !== "login" && (
              <button
                type="button"
                onClick={() =>
                  goTo(step === "change-password" ? "verify-otp" : "login")
                }
                className="mt-8 w-full text-center text-sm font-medium text-[#1d2b4f] hover:underline"
              >
                Back to {step === "change-password" ? "verification" : "login"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function EmailField({
  email,
  onChange,
}: {
  email: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor="email" className="auth-label">
        Email Address
      </label>
      <Input
        id="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => onChange(event.target.value)}
        placeholder="hello@example.com"
        required
        className="auth-input"
      />
    </div>
  );
}

function LoginFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onForgot,
}: {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onForgot: () => void;
}) {
  return (
    <div className="space-y-4">
      <EmailField email={email} onChange={onEmailChange} />
      <PasswordInput
        id="password"
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={onPasswordChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onForgot}
          className="ml-auto text-base text-[#1d2b4f] underline underline-offset-2 hover:text-[#273962]"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}

function SignupFields({
  email,
  fullName,
  password,
  confirmPassword,
  onEmailChange,
  onFullNameChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="full-name" className="auth-label">
          Full Name
        </label>
        <Input
          id="full-name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          required
          className="auth-input"
        />
      </div>
      <EmailField email={email} onChange={onEmailChange} />
      <PasswordInput
        id="signup-password"
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={onPasswordChange}
      />
      <PasswordInput
        id="signup-confirm-password"
        label="Confirm Password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
      />
    </div>
  );
}

function OtpFields({
  disabled,
  otp,
  inputs,
  onChange,
  onResend,
}: {
  disabled: boolean;
  otp: string[];
  inputs: React.MutableRefObject<Array<HTMLInputElement | null>>;
  onChange: (index: number, value: string) => void;
  onResend: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 sm:gap-6">
        {otp.map((value, index) => (
          <Input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            value={value}
            onChange={(event) => onChange(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !value && index > 0)
                inputs.current[index - 1]?.focus();
            }}
            inputMode="numeric"
            maxLength={1}
            aria-label={`OTP digit ${index + 1}`}
            className={`aspect-square h-auto min-w-0 px-0 text-center text-lg font-medium text-[#1d2b4f] ${value ? "border-2 border-[#1d2b4f]" : "border-2 border-[#eaeaea]"}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-base">
        <span className="flex items-center gap-2 text-[#6c757d]">
          <TimerReset className="size-5" />
          Six-digit code
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={onResend}
          className="text-[#1d2b4f] hover:underline disabled:opacity-50"
        >
          <span className="text-[#6c757d]">Didn’t get a code? </span>Resend
        </button>
      </div>
    </div>
  );
}
