"use client";

import { Bell, CalendarDays, ChevronDown, Crown, Globe2, Moon, Sun, LogOut, Menu, X, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { userNavItems } from "./dashboardData";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";
import NotificationDropdown from "../../components/NotificationDropdown";
import DateRangePicker from "../../components/DateRangePicker";
import { useFcmToken } from "../../../../hooks/useFcmToken";

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentUser = useAdminStore((s) => s.currentUser);
  const payments = useAdminStore((s) => s.payments || []);
  const fetchData = useAdminStore((s) => s.fetchData);
  const isInitialized = useAdminStore((s) => s.isInitialized);

  // Subscription state from backend API
  const [activePlan, setActivePlan] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  // Initialize FCM and register device token automatically
  useFcmToken();

  const isAdminOrPartner = currentUser && ["SUPER_ADMIN", "MANAGER", "VIEWER", "PARTNER"].includes(currentUser.role);
  const hasActivePlan = isAdminOrPartner || (activePlan !== null && activePlan.status === "ACTIVE");

  const getWeekRange = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endOfWeek.toLocaleDateString('en-US', options)}`;
  };

  const getPageHeader = () => {
    switch (pathname) {
      case "/dashboard":
        return { title: `Welcome back, ${currentUser?.name || "User"}`, subtitle: "Here's what's happening with your trades today." };
      case "/dashboard/wallet":
        return { title: "Wallet & Funds", subtitle: "Manage your deposits, withdrawals, and balances." };
      case "/dashboard/profit-history":
        return { title: "Profit History", subtitle: "Track your earnings and distributed profits." };
      case "/dashboard/past-trades":
        return { title: "Past Trades", subtitle: "View the history of your closed trading positions." };
      case "/dashboard/reports":
        return { title: "Reports & Analytics", subtitle: "Analyze your trading performance and metrics." };
      case "/dashboard/subscription":
        return { title: "Subscription Plan", subtitle: "Manage your active plan and billing details." };
      case "/dashboard/support":
        return { title: "Help & Support", subtitle: "Get assistance with your account or trading." };
      default:
        return { title: `Welcome back, ${currentUser?.name || "User"}`, subtitle: "Manage your trading dashboard." };
    }
  };

  const { title, subtitle } = getPageHeader();

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem("tradebot-user");
    localStorage.removeItem("tradebot-authenticated");
    document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
    useAdminStore.setState({ currentUser: null });
    window.location.href = "/login";
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auth redirect guard
  useEffect(() => {
    if (isInitialized && !currentUser) {
      window.location.href = "/login";
    }
  }, [isInitialized, currentUser]);

  const userId = currentUser?.id;

  // Fetch subscription info
  useEffect(() => {
    if (userId) {
      setLoadingSub(true);
      apiFetch("/api/user/subscription")
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.hasSubscription && data.subscription) {
              setActivePlan(data.subscription);
            } else {
              setActivePlan(null);
            }
          }
        })
        .catch((err) => console.error("Error fetching subscription:", err))
        .finally(() => setLoadingSub(false));
    } else if (isInitialized) {
      setLoadingSub(false);
    }
  }, [fetchData, userId, isInitialized]);

  useEffect(() => {
    const currentTheme = document.body.classList.contains("light-theme") ? "light" : "dark";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const isLight = theme === "light";
    const nextTheme = isLight ? "dark" : "light";
    document.body.classList.toggle("light-theme", !isLight);
    localStorage.setItem("tradebot-theme", nextTheme);
    setTheme(nextTheme);
  };

  const isSubscriptionPage = pathname === "/dashboard/subscription";
  const isSupportPage = pathname === "/dashboard/support";
  const shouldLock = !hasActivePlan && !isSubscriptionPage && !isSupportPage;

  if (!isInitialized || (currentUser && loadingSub)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020806]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-2xl border border-green-500/20 bg-green-950/40 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <span className="h-6 w-6 border-2 border-green-400 border-t-transparent rounded-full"></span>
          </div>
          <p className="text-sm font-semibold text-neutral-400 tracking-wide animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020806] text-white">
      <div className="grid min-h-screen lg:grid-cols-[300px_minmax(0,1fr)] relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside className={`fixed inset-y-0 left-0 z-50 w-[300px] flex flex-col border-r border-white/10 bg-[#05100c]/95 transform transition-transform duration-300 lg:static lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-20 items-center justify-between border-b border-white/10 px-7">
            <div className="flex items-center gap-3">
              <Image
                src="/forex.png"
                alt="Forex Logo"
                width={1536}
                height={1024}
                className="h-9 w-auto object-contain"
                priority
              />
              <span className="text-2xl font-bold tracking-tight">Tradebot</span>
            </div>
            <button className="lg:hidden text-neutral-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-5 py-7 overflow-y-auto">
            {userNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              const isLockedItem = !hasActivePlan && item.href !== "/dashboard/subscription" && item.href !== "/dashboard/support";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex h-11 items-center justify-between rounded-xl px-4 text-sm font-medium transition ${active
                      ? "bg-green-500/20 text-white shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]"
                      : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                    }`}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span className={isLockedItem ? "text-neutral-500" : ""}>{item.label}</span>
                  </div>
                  {isLockedItem ? (
                    <Lock className="h-3.5 w-3.5 text-neutral-500" />
                  ) : item.badge ? (
                    <span className="flex h-5 items-center justify-center rounded-full bg-green-500/20 px-2 text-[10px] font-bold text-green-300">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-5 border-t border-white/10 px-5 py-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                {(currentUser?.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{currentUser?.name || "User"}</p>
                <p className={`text-xs font-semibold ${hasActivePlan ? "text-green-300" : "text-neutral-400"}`}>
                  {hasActivePlan ? "Premium Active" : "No Active Plan"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/[0.06] hover:text-red-400 transition"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#020806]/88 px-4 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">{title}</h1>
                  <p className="mt-1 hidden sm:block text-sm text-neutral-500">{subtitle}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 text-sm font-bold text-green-300 transition hover:bg-green-500 hover:text-black">
                  <Globe2 className="h-4 w-4" />
                  Visit Website
                </Link>
                <DateRangePicker />
                <button
                  onClick={toggleTheme}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.08]"
                  aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
                </button>
                <NotificationDropdown />
              </div>
            </div>
          </header>

          <div className="space-y-8 px-4 py-8 sm:px-8">
            {shouldLock ? (
              <DashboardLockScreen />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardLockScreen() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-[#06120e] via-[#030a07] to-[#010503] p-6 md:p-8 shadow-[0_0_50px_-20px_rgba(34,197,94,0.25)] max-w-2xl mx-auto my-8 text-center">
      {/* Background radial glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full bg-green-500/10 blur-[50px] pointer-events-none"></div>
      
      {/* Locked Padlock Visual */}
      <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/5 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
        <span className="absolute inset-0 rounded-xl bg-green-500/5 animate-ping opacity-25"></span>
        <Lock className="h-8 w-8 text-green-400" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-white animate-pulse">
        Dashboard Access Locked
      </h2>
      <p className="mt-2 text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
        Algorithmic trading automation, signal execution, cash balances, and performance metrics require an active plan license.
      </p>

      {/* Grid: Tighter, cleaner list of restrictions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 text-left max-w-lg mx-auto">
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-start gap-2.5">
          <span className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0 animate-pulse"></span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Execution Locked</h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Automated robots will not execute trades on your account.</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-start gap-2.5">
          <span className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0 animate-pulse"></span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Telemetry & Stats Hidden</h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Real-time signals, win rates, and trading logs are disabled.</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-start gap-2.5">
          <span className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0 animate-pulse"></span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Wallet Options Disabled</h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Deposits and withdrawals are locked until license is activated.</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.01] p-3.5 flex items-start gap-2.5">
          <span className="h-2 w-2 rounded-full bg-green-400 mt-1.5 shrink-0 animate-pulse"></span>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Premium Metrics Suspended</h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">Growth trackers and distribution histories are restricted.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-xs mx-auto">
        <Link
          href="/pricing"
          className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 text-xs font-bold text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          View Plans
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-5 text-[10px] text-neutral-600 font-semibold tracking-wide">
        Already purchased a plan? Verification requests are processed in under 1 hour.
      </p>
    </div>
  );
}
