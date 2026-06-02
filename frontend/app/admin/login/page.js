"use client";
import { apiFetch } from "../../../lib/apiFetch";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../../../hooks/adminStore";
import { Eye, EyeOff, ShieldCheck, Lock, Mail, ArrowRight, Terminal } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    const checkSession = async () => {
      const user = useAdminStore.getState().currentUser;
      if (user && ["SUPER_ADMIN", "MANAGER", "VIEWER"].includes(user.role)) {
        router.push("/admin/dashboard");
      }
    };
    checkSession();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials. Try again.");
        setLoading(false);
        return;
      }

      const { token, user } = data;

      // Restrict access to Admins only
      if (!["SUPER_ADMIN", "MANAGER", "VIEWER"].includes(user.role)) {
        // Log out immediately to clear cookie if user is not authorized
        await apiFetch("/api/auth/logout", { method: "POST" });
        document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
        setError("Access Denied: This portal is reserved for administrators.");
        setLoading(false);
        return;
      }

      // Store auth session
      localStorage.setItem("tradebot-user", JSON.stringify({ ...user, token }));
      localStorage.setItem("tradebot-authenticated", "true");
      document.cookie = `tradebot-token=${token}; path=/; max-age=86400; SameSite=Lax`;

      // Hydrate state
      await useAdminStore.getState().fetchData();

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("A connection error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#03070c] px-4 py-12 relative overflow-hidden font-sans select-none">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-900/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-teal-900/10 blur-[150px]" />
      
      {/* Visual background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand / Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-950/40 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.15)] animate-[pulse_3s_infinite]">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
            NEXUS PORTAL
          </h1>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-blue-400/70">
            Administrative Access Only
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.07] bg-[#070e17]/85 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle line decoration */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">System Login</h2>
            <p className="mt-1 text-sm text-neutral-400">Authenticate to enter the control panel.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm font-medium text-red-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl border border-green-500/20 bg-green-950/20 p-4 text-sm font-medium text-green-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              Authorization success. Accessing core systems...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Operator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nexus.capital"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/40 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-black/60"
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Security Key
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-black/40 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:bg-black/60"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  disabled={loading || success}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_20px_rgba(37,99,235,0.25)]"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-neutral-600">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          Encrypted, role-gated administrator system access.
        </div>
      </div>
    </div>
  );
}
