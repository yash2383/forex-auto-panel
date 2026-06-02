"use client";
import { apiFetch } from "../../../lib/apiFetch";

import { Eye, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdminStore } from "../../../hooks/adminStore";

const steps = ["Register your identity", "Configure Tradebot", "Activate your profile"];

const AuthInput = ({ label, placeholder, type = "text", name, value, onChange }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-white">{label}</span>
    <span className="relative block">
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-xl border border-transparent bg-[#1B1B1B] px-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-green-500/40 focus:ring-2 focus:ring-green-500/10"
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

export default function AuthPage({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [refCode, setRefCode] = useState("");
  const [nextTarget, setNextTarget] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || params.get("callbackUrl");
    if (next && next.startsWith("/")) {
      queueMicrotask(() => setNextTarget(next));
    }
    const ref = params.get("ref");
    if (ref) {
      setRefCode(ref);
    }
  }, []);

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const referralCode = String(formData.get("referralCode") || "").trim();

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup 
        ? { email, password, firstName, lastName, referralCode: referralCode || null } 
        : { email, password };

      const res = await apiFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Authentication failed. Check your details.");
        return;
      }

      const { token, user } = await res.json();
      localStorage.setItem("tradebot-user", JSON.stringify({ ...user, token }));
      localStorage.setItem("tradebot-authenticated", "true");
      document.cookie = `tradebot-token=${token}; path=/; max-age=86400; SameSite=Lax`;

      // Sync Zustand data
      await useAdminStore.getState().fetchData();

      const target = nextTarget || "/dashboard";
      router.push(target);
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      console.error(err);
    }
  };

  const authSwitchHref = `${isSignup ? "/login" : "/signup"}${nextTarget ? `?next=${encodeURIComponent(nextTarget)}` : ""}`;

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

          <Link href="/" className="absolute left-5 top-5 z-10 inline-flex h-10 w-[142px] bg-[url('/forex.png')] bg-contain bg-left bg-no-repeat"></Link>

          <div className="relative z-10 flex min-h-[260px] items-end justify-center px-5 pb-8 pt-20 text-center lg:min-h-full lg:px-12 lg:pb-28">
            <div className="w-full max-w-sm">
              <div className="mx-auto mb-8 flex items-center justify-center gap-2 text-white">
                <span className="h-3 w-3 rounded-full bg-green-300 shadow-[0_0_18px_rgba(134,239,172,0.9)]"></span>
                <span className="text-xl font-semibold tracking-tight">Tradebot</span>
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
                {isSignup ? "Join Tradebot" : "Welcome back"}
              </h1>
              <p className="mx-auto mt-5 max-w-xs text-sm font-medium leading-relaxed text-white/60">
                {isSignup
                  ? "Follow these 3 quick phases to activate your automated trading space."
                  : "Access your automated trading dashboard, execution logs, and risk controls."}
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
              <a
                href={authSwitchHref}
                className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs font-semibold text-green-300 transition hover:bg-green-500 hover:text-black">
                {isSignup ? "Log in" : "Sign up"}
              </a>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {isSignup ? "Create New Profile" : "Log in to Tradebot"}
              </h2>
              <p className="text-sm text-neutral-500">
                {isSignup ? "Input your basic details to begin the journey." : "Enter your account details to continue trading."}
              </p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-4" onSubmit={handleAuthSubmit}>
              {isSignup && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <AuthInput name="firstName" label="First Name" placeholder="John" />
                  <AuthInput name="lastName" label="Last Name" placeholder="Doe" />
                </div>
              )}
              <AuthInput name="email" label="Email" placeholder="john@doe.com" type="email" />
              {isSignup && (
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
              )}
              <AuthInput name="password" label="Password" placeholder="********" type="password" />

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
                  <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-white/10 bg-[#1B1B1B] accent-green-500" />
                  I understand trading involves financial risk and agree to receive account updates.
                </label>
              )}

              <button
                type="submit"
                className="mt-4 h-14 w-full rounded-xl bg-white text-sm font-bold text-black transition hover:bg-neutral-200 active:scale-[0.98]">
                {isSignup ? "Create Account" : "Login"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-neutral-500 lg:text-left">
              {isSignup ? "Member of the team?" : "New to Tradebot?"}{" "}
              <a href={authSwitchHref} className="font-semibold text-white underline underline-offset-4">
                {isSignup ? "Log in" : "Create account"}
              </a>
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs text-neutral-600">
              <ShieldCheck className="h-4 w-4 text-green-300" />
              Protected access for Tradebot accounts.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
