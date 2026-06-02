"use client";
import { apiFetch } from "../../../lib/apiFetch";

import { WandSparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useAdminStore } from "../../../hooks/adminStore";

export default function SiteNavbar() {
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("tradebot-authenticated");
      localStorage.removeItem("tradebot-user");
      document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
      window.location.href = "/";
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  useEffect(() => {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return undefined;

    const setTheme = (mode) => {
      const isLight = mode === "light";
      document.body.classList.toggle("light-theme", isLight);
      toggle.setAttribute("aria-pressed", String(isLight));
      toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
      localStorage.setItem("tradebot-theme", isLight ? "light" : "dark");

      document.querySelectorAll(".quote-word").forEach((word) => {
        word.style.color = isLight ? "var(--text-primary)" : "rgb(255 255 255)";
      });
    };

    setTheme(localStorage.getItem("tradebot-theme") || "dark");

    const handleToggle = () => {
      setTheme(document.body.classList.contains("light-theme") ? "dark" : "light");
    };

    toggle.addEventListener("click", handleToggle);

    return () => {
      toggle.removeEventListener("click", handleToggle);
    };
  }, []);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#050505]/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2">
          <span className="h-[32px] w-[118px] bg-[url('/forex.png')] bg-contain bg-center bg-no-repeat text-sm font-semibold tracking-tight text-white sm:h-[40px] sm:w-[142px]"></span>
        </Link>
 
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden h-12 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-1.5 text-sm font-semibold text-neutral-400 lg:flex">
          <Link href="/infrastructure" className="inline-flex h-10 items-center rounded-full px-4 transition-colors hover:bg-white/10 hover:text-white">
            Infrastructure
          </Link>
          <Link href="/past-trades" className="inline-flex h-10 items-center rounded-full px-4 transition-colors hover:bg-white/10 hover:text-white">
            Past Trades
          </Link>
 
          <Link href="/profit-simulator" className="inline-flex h-10 items-center rounded-full px-4 transition-colors hover:bg-white/10 hover:text-white">
            Profit Simulator
          </Link>
          <Link href="/pricing" className="inline-flex h-10 items-center rounded-full px-4 transition-colors hover:bg-white/10 hover:text-white">
            Pricing
          </Link>
        </div>
 
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button className="theme-toggle" type="button" id="themeToggle" aria-label="Switch to light mode" aria-pressed="false">
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-toggle-icon moon-side">
                <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </span>
              <span className="theme-toggle-icon sun-side">
                <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
                </svg>
              </span>
              <span className="theme-toggle-thumb"></span>
            </span>
          </button>
          {currentUser ? (
            <>
              <div className="relative group hidden sm:inline-flex">
                <button className="h-12 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-5 text-sm font-bold text-white transition-colors hover:bg-white/10 inline-flex">
                  My Account <span className="text-[9px] text-neutral-500 ml-0.5">▼</span>
                </button>

                <div className="absolute right-0 top-full mt-1 hidden group-hover:block w-40 rounded-xl border border-white/10 bg-[#0B1110] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition font-medium"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="border-gradient relative inline-flex h-12 items-center whitespace-nowrap rounded-full bg-transparent px-5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="group hidden h-12 animate-[loginPulse_2.4s_ease-in-out_infinite] items-center gap-3 rounded-full border border-green-500/70 bg-black px-2.5 pr-5 text-sm font-bold text-white shadow-[0_0_22px_rgba(34,197,94,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-green-300 hover:shadow-[0_0_34px_rgba(34,197,94,0.52)] sm:inline-flex"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-green-300 transition-colors group-hover:bg-green-500 group-hover:text-black">
                  <WandSparkles className="h-4 w-4" />
                </span>
                Login
              </Link>
              <Link
                href="/signup"
                className="border-gradient relative inline-flex h-12 items-center whitespace-nowrap rounded-full bg-transparent px-5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
