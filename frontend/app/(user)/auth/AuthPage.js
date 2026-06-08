"use client";
import { apiFetch } from "../../../lib/apiFetch";

import { Eye, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminStore } from "../../../hooks/adminStore";

const steps = ["Register your identity", "Configure Forex Auto Panel", "Activate your profile"];

const AuthInput = ({ label, placeholder, type = "text", name, value, onChange, disabled }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-white">{label}</span>
    <span className="relative block">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-transparent bg-[#1B1B1B] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-green-500/40 focus:ring-2 focus:ring-green-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {type === "password" && (
        <Eye className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      )}
    </span>
    {type === "password" && (
      <span className="mt-1.5 block text-xs text-neutral-500">Requires at least 8 symbols.</span>
    )}
  </label>
);

const StepItem = ({ index, text, active }) => (
  <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${active ? "bg-white text-black" : "bg-[#1B1B1B] text-white"}`}>
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${active ? "bg-black text-white" : "bg-white/10 text-white/45"}`}>
      {index}
    </span>
    <span className="text-sm font-semibold">{text}</span>
  </div>
);

const OtpInput = ({ otp, setOtp }) => {
  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input box
    if (element.value !== "" && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      // Focus previous input box
      if (e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split("");
      setOtp(newOtp);
      // Focus the last input box
      const inputs = e.target.parentElement.querySelectorAll("input");
      if (inputs && inputs[5]) {
        inputs[5].focus();
      }
    }
  };

  return (
    <div className="flex justify-center gap-3">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          name={`otp-${index}`}
          maxLength="1"
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-14 w-12 rounded-xl border border-transparent bg-[#1B1B1B] text-center text-xl font-bold text-white outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/10"
        />
      ))}
    </div>
  );
};

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [refCode, setRefCode] = useState("");
  const [nextTarget, setNextTarget] = useState("");
  const [error, setError] = useState("");

  // Input states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Outage / Fallback States
  const [resendAttempts, setResendAttempts] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get("redirect") || params.get("next") || params.get("callbackUrl");
    let validatedTarget = "/";
    if (target) {
      const isSafe = target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/\\");
      if (isSafe) {
        validatedTarget = target;
      }
    }
    queueMicrotask(() => setNextTarget(validatedTarget));

    const ref = params.get("ref") || params.get("referralCode");
    if (ref) {
      setRefCode(ref);
    }

    const campaign = params.get("campaign");
    if (campaign) {
      localStorage.setItem("campaign", campaign);
    }
    
    // Pre-populate fields from query parameters
    const queryFirstName = params.get("firstName");
    if (queryFirstName) setFirstName(queryFirstName);
    const queryLastName = params.get("lastName");
    if (queryLastName) setLastName(queryLastName);
    const queryEmail = params.get("email");
    if (queryEmail) setEmail(queryEmail);
    const queryPassword = params.get("password");
    if (queryPassword) setPassword(queryPassword);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const completeLogin = async (token, user) => {
    localStorage.setItem("forex-auto-panel-user", JSON.stringify({ ...user, token }));
    localStorage.setItem("forex-auto-panel-authenticated", "true");
    document.cookie = `forex-auto-panel-token=${token}; path=/; max-age=86400; SameSite=Lax`;

    // Sync Zustand data
    await useAdminStore.getState().fetchData();

    const target = nextTarget || "/";
    router.push(target);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (isSignup) {
      if (!otpSent) {
        // Step 1: Send OTP for registration
        if (!firstName || !lastName || !email || !password) {
          setError("Please fill in all fields.");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }

        setIsSendingOtp(true);
        try {
          const savedCampaign = typeof window !== "undefined" ? localStorage.getItem("campaign") : null;
          const res = await apiFetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              firstName,
              lastName,
              referralCode: refCode || null,
              partnerSlug: savedCampaign || "alpha-traders"
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.message || "Failed to send verification OTP.");
            return;
          }

          setOtpSent(true);
          setCountdown(60);

          let errorMsg = "";
          if (data.emailDeliveryIssues) {
            errorMsg = data.message;
          }

          if (data.otp) {
            const devMsg = `[Development Mode] Verification code is: ${data.otp}`;
            errorMsg = errorMsg ? `${errorMsg}\n\n${devMsg}` : devMsg;
            setOtp(data.otp.split(""));
          }
          setError(errorMsg);
        } catch (err) {
          setError("A network error occurred. Please try again.");
          console.error(err);
        } finally {
          setIsSendingOtp(false);
        }
      } else {
        // Step 2: Verify OTP and register user
        const otpCode = otp.join("");
        if (otpCode.length < 6) {
          setError("Please enter the 6-digit verification code.");
          return;
        }

        try {
          const res = await apiFetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              password,
              otp: otpCode,
              firstName,
              lastName,
              referralCode: refCode || null,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.message || "Account creation failed.");
            return;
          }

          completeLogin(data.token, data.user);
        } catch (err) {
          setError("A network error occurred. Please try again.");
          console.error(err);
        }
      }
    } else {
      // Login Flow
      if (!otpSent) {
        // Step 1: Validate credentials, trigger login OTP
        if (!email || !password) {
          setError("Please enter your email and password.");
          return;
        }

        setIsSendingOtp(true);
        try {
          const res = await apiFetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.message || "Invalid credentials.");
            return;
          }

          if (data.otpRequired) {
            setOtpSent(true);
            setOtpToken(data.otpToken);
            setCountdown(60);
            if (data.otp) {
              setOtp(data.otp.split(""));
              setError(`[Development Mode] Verification code is: ${data.otp}`);
            }
          } else {
            // Falls back immediately if OTP is bypassed (Admin/Partners)
            completeLogin(data.token, data.user);
          }
        } catch (err) {
          setError("A network error occurred. Please try again.");
          console.error(err);
        } finally {
          setIsSendingOtp(false);
        }
      } else {
        // Step 2: Verify Login OTP
        const otpCode = otp.join("");
        if (otpCode.length < 6) {
          setError("Please enter the 6-digit verification code.");
          return;
        }

        try {
          const res = await apiFetch("/api/auth/verify-login-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otpToken, otp: otpCode }),
          });

          const data = await res.json();
          if (!res.ok) {
            setError(data.message || "Verification failed.");
            return;
          }

          completeLogin(data.token, data.user);
        } catch (err) {
          setError("A network error occurred. Please try again.");
          console.error(err);
        }
      }
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setIsSendingOtp(true);

    try {
      if (isSignup) {
        const savedCampaign = typeof window !== "undefined" ? localStorage.getItem("campaign") : null;
        const res = await apiFetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            firstName,
            lastName,
            referralCode: refCode || null,
            partnerSlug: savedCampaign || "alpha-traders"
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to resend verification code.");
          return;
        }

        setResendAttempts((prev) => prev + 1);

        let errorMsg = "";
        if (data.emailDeliveryIssues) {
          errorMsg = data.message;
        }

        if (data.otp) {
          const devMsg = `[Development Mode] Verification code is: ${data.otp}`;
          errorMsg = errorMsg ? `${errorMsg}\n\n${devMsg}` : devMsg;
          setOtp(data.otp.split(""));
        }
        setError(errorMsg);
      } else {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to resend verification code.");
          return;
        }

        if (data.otpRequired) {
          setOtpToken(data.otpToken);
          if (data.otp) {
            setOtp(data.otp.split(""));
            setError(`[Development Mode] Verification code is: ${data.otp}`);
          }
        }
      }

      setCountdown(60);
    } catch (err) {
      setError("Failed to resend verification code.");
      console.error(err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const authSwitchHref = `${isSignup ? "/login" : "/signup"}${nextTarget && nextTarget !== "/dashboard" ? `?redirect=${encodeURIComponent(nextTarget)}` : ""}`;

  return (
    <main className="min-h-screen bg-black p-3 pt-24 text-white sm:p-4 sm:pt-24">
      <div className="grid min-h-[calc(100vh-108px)] grid-cols-1 lg:min-h-[calc(100vh-112px)] lg:grid-cols-[52%_1fr]">
        <section className="relative mb-5 min-h-[260px] overflow-hidden rounded-[28px] border border-white/10 bg-[#07110d] shadow-2xl lg:mb-0 lg:min-h-full">
          <img
            src="https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=1800&auto=format&fit=crop"
            alt="Trading dashboard"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,197,94,0.38),transparent_38%),linear-gradient(to_bottom,rgba(5,5,5,0.15),rgba(5,5,5,0.94))]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.16),transparent_45%,rgba(20,184,166,0.12))]"></div>

          <Link href="/" className="absolute left-5 top-5 z-10 inline-flex">
            <img
              src="/forex.png"
              alt="Forex Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          <div className="relative z-10 flex min-h-[260px] items-end justify-center px-5 pb-8 pt-20 text-center lg:min-h-full lg:px-12 lg:pb-28">
            <div className="w-full max-w-sm">
              <div className="mx-auto mb-8 flex items-center justify-center gap-2 text-white">
                <span className="h-3 w-3 rounded-full bg-green-300 shadow-[0_0_18px_rgba(134,239,172,0.9)]"></span>
                <span className="text-xl font-semibold tracking-tight">Forex Auto Panel</span>
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                {isSignup ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="mx-auto mt-5 max-w-xs text-sm font-medium leading-relaxed text-white/60">
                {isSignup
                  ? "Join Forex Auto Panel and start your automated forex trading journey today."
                  : "Sign in to your Forex Auto Panel account to access your dashboard and trading portfolio."}
              </p>
              <div className="mt-8 flex flex-col gap-3 text-left">
                {steps.map((step, index) => (
                  <StepItem key={step} index={index + 1} text={step} active={isSignup ? index === 0 : index === 2} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-2 py-8 sm:px-8 lg:px-16 xl:px-24">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex items-center justify-end gap-4">
              <Link
                href={authSwitchHref}
                className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-300 transition hover:bg-green-500 hover:text-black">
                {isSignup ? "Sign In" : "Create Account"}
              </Link>
            </div>

              <>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {isSignup ? "Create Your Account" : "Welcome Back"}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {isSignup
                      ? "Join Forex Auto Panel and start your automated forex trading journey today."
                      : "Sign in to your Forex Auto Panel account to access your dashboard and trading portfolio."}
                  </p>
                </div>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-300 whitespace-pre-line">
                    {error}
                  </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleAuthSubmit}>
                  {!otpSent ? (
                    <>
                      {isSignup && (
                        <>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <AuthInput name="firstName" label="First Name" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                            <AuthInput name="lastName" label="Last Name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                          </div>
                          <AuthInput name="email" label="Email" placeholder="john@doe.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                          <div>
                            <AuthInput 
                              name="referralCode" 
                              label="Referral Code (Optional)" 
                              placeholder="Enter referral code" 
                              value={refCode} 
                              onChange={(e) => setRefCode(e.target.value)} 
                            />
                            <span className="mt-1.5 block text-xs text-neutral-500">
                              Have a referral code? Enter it to receive referral benefits.
                            </span>
                          </div>
                        </>
                      )}
                      {!isSignup && (
                        <AuthInput name="email" label="Email" placeholder="john@doe.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      )}
                      <AuthInput name="password" label="Password" placeholder="********" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

                      {!isSignup && (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
                          <label className="flex items-center gap-2 text-neutral-500">
                            <input type="checkbox" className="h-4 w-4 rounded border-white/10 bg-[#1B1B1B] accent-green-500" />
                            Remember me
                          </label>
                          <a href="#" className="font-semibold text-green-300 hover:text-green-200">
                            Forgot password?
                          </a>
                        </div>
                      )}

                      {isSignup && (
                        <label className="flex items-start gap-3 pt-1 text-xs leading-relaxed text-neutral-500">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/10 bg-[#1B1B1B] accent-green-500" required />
                          I understand trading involves financial risk and agree to receive account updates.
                        </label>
                      )}

                      <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="mt-4 h-14 w-full rounded-xl bg-white text-sm font-bold text-black transition hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50">
                        {isSendingOtp ? "Sending code..." : (isSignup ? "Send Verification OTP" : "Login")}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <p className="text-sm text-neutral-400 text-center">
                          We&apos;ve sent a 6-digit verification code to <span className="text-white font-semibold">{email}</span>.
                        </p>
                        <OtpInput otp={otp} setOtp={setOtp} />
                      </div>

                      <button
                        type="submit"





































































































                        
                        disabled={isSendingOtp}
                        className="mt-6 h-14 w-full rounded-xl bg-green-500 text-sm font-bold text-black transition hover:bg-green-400 active:scale-[0.98] disabled:opacity-50">
                        {isSendingOtp ? "Verifying..." : (isSignup ? "Verify & Create Account" : "Verify & Login")}
                      </button>

                      {countdown > 0 ? (
                        <p className="text-center text-sm text-neutral-500 mt-4">
                          Resend code in <span className="font-semibold text-white">{countdown}s</span>
                        </p>
                      ) : (
                        <div className="text-center mt-4">
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            className="text-sm font-semibold text-green-300 hover:text-green-200 underline underline-offset-4"
                            disabled={isSendingOtp}
                          >
                            {isSendingOtp ? "Resending..." : "Resend Verification Code"}
                          </button>
                        </div>
                      )}


                      <div className="text-center mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp(["", "", "", "", "", ""]);
                            setError("");
                          }}
                          className="text-xs text-neutral-500 hover:text-neutral-400"
                        >
                          ← Back to edit credentials
                        </button>
                      </div>
                    </>
                  )}
                </form>

                <p className="mt-8 text-center text-sm text-neutral-500 lg:text-left">
                  {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                  <Link href={authSwitchHref} className="font-semibold text-white underline underline-offset-4">
                    {isSignup ? "Sign In" : "Create Account"}
                  </Link>
                </p>
              </>

            <div className="mt-8 flex items-center gap-2 text-xs text-neutral-600">
              <ShieldCheck className="h-4 w-4 text-green-300" />
              Protected access for Forex Auto Panel accounts.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

