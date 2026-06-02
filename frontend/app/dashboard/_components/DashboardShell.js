"use client";

import { Bell, CalendarDays, ChevronDown, Crown, Globe2, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { userNavItems, adminNavGroups } from "./dashboardData";
import { useAdminStore } from "../../../hooks/adminStore";

export default function DashboardShell({ children }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState("dark");
  
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <main className="min-h-screen bg-[#020806] text-white">
      <div className="grid min-h-screen lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/10 bg-[#05100c]/95 lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-7">
            <span className="h-9 w-9 bg-[url('/forex.png')] bg-contain bg-center bg-no-repeat"></span>
            <span className="text-2xl font-bold tracking-tight">Tradebot</span>
          </div>

          <nav className="flex-1 space-y-1 px-5 py-7 overflow-y-auto">
            {userNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-11 items-center justify-between rounded-xl px-4 text-sm font-medium transition ${
                    active
                      ? "bg-green-500/20 text-white shadow-[inset_0_0_0_1px_rgba(34,197,94,0.18)]"
                      : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                  }`}>
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="flex h-5 items-center justify-center rounded-full bg-green-500/20 px-2 text-[10px] font-bold text-green-300">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-5 border-t border-white/10 px-5 py-6">
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15 text-green-300">
                <Crown className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-sm font-bold text-white">Unlock Premium</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">Get full access to all features and insights.</p>
              <Link href="/pricing" className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-green-400 text-sm font-bold text-black">
                Upgrade Now
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                {(currentUser?.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{currentUser?.name || "User"}</p>
                <p className="text-xs font-semibold text-green-300">
                  {currentUser?.status === "VIP" 
                    ? "Premium Plan" 
                    : currentUser?.status === "ACTIVE" 
                      ? "Basic Plan" 
                      : currentUser?.status === "EXPIRED" 
                        ? "Expired Plan" 
                        : "No Active Plan"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#020806]/88 px-4 py-4 backdrop-blur-xl sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back, {currentUser?.name || "User"}</h1>
                <p className="mt-1 text-sm text-neutral-500">Here&apos;s what&apos;s happening with your trades today.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 text-sm font-bold text-green-300 transition hover:bg-green-500 hover:text-black">
                  <Globe2 className="h-4 w-4" />
                  Visit Website
                </Link>
                <button className="hidden h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white md:flex">
                  <CalendarDays className="h-4 w-4" />
                  May 19, 2025 - May 25, 2025
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </button>
                <button
                  onClick={toggleTheme}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/[0.08]"
                  aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
                </button>
                <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-400 text-xs font-black text-black">3</span>
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-4 py-8 sm:px-8">{children}</div>
        </div>
      </div>
    </main>
  );
}
