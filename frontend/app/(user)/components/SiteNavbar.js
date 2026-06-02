"use client";
import { apiFetch } from "../../../lib/apiFetch";

import { WandSparkles, Menu, X, LayoutDashboard, User, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAdminStore } from "../../../hooks/adminStore";

const NAV_LINKS = [
  { href: "/infrastructure", label: "Infrastructure" },
  { href: "/past-trades", label: "Past Trades" },
  { href: "/profit-simulator", label: "Profit Simulator" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact Us" },
];

export default function SiteNavbar() {
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close mobile menu on resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    const onOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem("tradebot-authenticated");
    localStorage.removeItem("tradebot-user");
    document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
    window.location.href = "/";
  };

  // Theme toggle
  useEffect(() => {
    const toggle = document.getElementById("themeToggle");
    if (!toggle) return;

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
    return () => toggle.removeEventListener("click", handleToggle);
  }, []);

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#050505]/90 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* ── Logo ── */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="h-[36px] w-[128px] bg-[url('/forex.png')] bg-contain bg-center bg-no-repeat sm:h-[40px] sm:w-[142px]" />
          </Link>

          {/* ── Desktop Nav Links (centred) ── */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden h-11 items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] px-1.5 text-sm font-medium text-neutral-400 lg:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex h-9 items-center rounded-full px-4 transition-colors hover:bg-white/10 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* ── Right Controls ── */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">

            {/* Theme toggle */}
            <button
              className="theme-toggle"
              type="button"
              id="themeToggle"
              aria-label="Switch to light mode"
              aria-pressed="false"
            >
              <span className="theme-toggle-track" aria-hidden="true">
                <span className="theme-toggle-icon moon-side">
                  <svg className="moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </span>
                <span className="theme-toggle-icon sun-side">
                  <svg className="sun-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                </span>
                <span className="theme-toggle-thumb" />
              </span>
            </button>

            {/* Logged-in state */}
            {currentUser ? (
              <>
                {/* Account dropdown — desktop */}
                <div className="relative hidden lg:block" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen((v) => !v)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    My Account
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {accountOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-white/10 bg-[#0B1110] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
                      <Link
                        href="/profile"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white"
                      >
                        <User className="h-4 w-4" /> Profile
                      </Link>
                      <button
                        onClick={() => { setAccountOpen(false); handleLogout(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  )}
                </div>

                {/* Dashboard button — desktop */}
                <Link
                  href="/dashboard"
                  className="border-gradient relative hidden h-10 items-center gap-2 whitespace-nowrap rounded-full bg-transparent px-4 text-sm font-bold text-white transition hover:bg-white/10 lg:inline-flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                {/* Login — desktop */}
                <Link
                  href="/login"
                  className="group hidden h-10 animate-[loginPulse_2.4s_ease-in-out_infinite] items-center gap-2.5 rounded-full border border-green-500/70 bg-black px-2.5 pr-5 text-sm font-bold text-white shadow-[0_0_22px_rgba(34,197,94,0.28)] transition-all hover:-translate-y-0.5 hover:border-green-300 hover:shadow-[0_0_34px_rgba(34,197,94,0.52)] sm:inline-flex"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-green-300 transition group-hover:bg-green-500 group-hover:text-black">
                    <WandSparkles className="h-3.5 w-3.5" />
                  </span>
                  Login
                </Link>

                {/* Sign Up — desktop */}
                <Link
                  href="/signup"
                  className="border-gradient relative hidden h-10 items-center whitespace-nowrap rounded-full bg-transparent px-4 text-sm font-bold text-white transition hover:bg-white/10 sm:inline-flex"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* ── Hamburger (mobile / tablet) ── */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white transition hover:bg-white/10 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen
                ? <X className="h-5 w-5" />
                : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer panel ── */}
      <div
        className={`fixed left-0 top-[68px] z-50 w-full lg:hidden transition-all duration-300 ease-in-out ${
          mobileOpen
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "-translate-y-3 opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-3 mt-2 rounded-2xl border border-white/10 bg-[#090f0d]/98 shadow-[0_16px_48px_rgba(0,0,0,0.7)] backdrop-blur-xl overflow-hidden">

          {/* Nav links */}
          <div className="flex flex-col p-2">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex h-12 items-center rounded-xl px-4 text-sm font-semibold text-neutral-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-white/8" />

          {/* Auth section */}
          <div className="flex flex-col gap-2 p-3">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center gap-3 rounded-xl bg-green-500/10 px-4 text-sm font-bold text-green-300 transition hover:bg-green-500/20"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-neutral-300 transition hover:bg-white/5 hover:text-white"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 text-sm font-bold text-green-300 transition hover:bg-green-500 hover:text-black"
                >
                  <WandSparkles className="h-4 w-4" />
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
