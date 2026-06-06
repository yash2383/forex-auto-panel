"use client";

import { Bell, CalendarDays, ChevronDown, Crown, ExternalLink, Globe2, Hexagon, Moon, Search, Sun, X, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminNavGroups } from "./adminData";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";
import NotificationDropdown from "../../../(user)/components/NotificationDropdown";
import DateRangePicker from "../../../(user)/components/DateRangePicker";

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const section = searchParams.get("section");
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return document.body.classList.contains("light-theme") ? "light" : "dark";
    }
    return "dark";
  });
  const [showResults, setShowResults] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Zustand auth parameters
  const currentUser = useAdminStore((s) => s.currentUser);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const fetchData = useAdminStore((s) => s.fetchData);
  const searchQuery = useAdminStore((s) => s.searchQuery || "");
  const setSearchQuery = useAdminStore((s) => s.setSearchQuery);
  const users = useAdminStore((s) => s.users);
  const payments = useAdminStore((s) => s.payments);
  const trades = useAdminStore((s) => s.trades);
  const partners = useAdminStore((s) => s.partners);
  const transactions = useAdminStore((s) => s.transactions || []);

  useEffect(() => {
    if (!mounted) return;
    const authenticate = async () => {
      // Direct return if on login page to avoid redirect loops
      if (pathname === "/admin/login") {
        setAuthLoading(false);
        return;
      }

      const isAuthenticated = localStorage.getItem("tradebot-authenticated") === "true";
      if (!isAuthenticated) {
        setTimeout(() => router.push("/admin/login"), 0);
        return;
      }

      try {
        await fetchData();
        const user = useAdminStore.getState().currentUser;
        
        if (!user || !["SUPER_ADMIN", "MANAGER", "VIEWER"].includes(user.role)) {
          // Not authorized admin! Clear storage and redirect
          localStorage.removeItem("tradebot-user");
          localStorage.removeItem("tradebot-authenticated");
          document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
          useAdminStore.setState({ currentUser: null });
          setTimeout(() => router.push("/admin/login"), 0);
          return;
        }
        
        setAuthLoading(false);
      } catch (err) {
        console.error("Auth check error:", err);
        setTimeout(() => router.push("/admin/login"), 0);
      }
    };

    authenticate();
  }, [mounted, router, fetchData, pathname]);



  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout API error:", e);
    }
    localStorage.removeItem("tradebot-user");
    localStorage.removeItem("tradebot-authenticated");
    document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
    useAdminStore.setState({ currentUser: null });
    router.push("/admin/login");
  };

  // Early returns below all React Hooks to comply with Rules of Hooks
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-[#050a0f] text-white">{children}</div>;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#03070c] px-4 font-sans select-none relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-blue-900/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-teal-900/10 blur-[150px]" />
        
        {/* Visual background grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />

        <div className="text-center z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-950/40 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.15)] animate-spin">
            <Hexagon className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold tracking-wider text-white bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
            VERIFYING OPERATOR CREDENTIALS...
          </h2>
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-blue-400/70">
            Establishing Secure Session
          </p>
        </div>
      </div>
    );
  }


  const pendingWithdrawalCount = transactions.filter((t) => t.type === "Withdrawal" && t.status === "Pending").length;

  // Search Results calculations
  const navMatches = searchQuery ? [] : []; // Let's populate it below
  const activeSearch = searchQuery.toLowerCase();
  
  const matchesNav = [];
  if (searchQuery) {
    adminNavGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.label.toLowerCase().includes(activeSearch)) {
          matchesNav.push(item);
        }
      });
    });
  }

  const userMatches = searchQuery ? users.filter((u) =>
    u.name.toLowerCase().includes(activeSearch) ||
    u.email.toLowerCase().includes(activeSearch)
  ) : [];

  const paymentMatches = searchQuery ? payments.filter((p) =>
    p.id.toLowerCase().includes(activeSearch) ||
    p.user.toLowerCase().includes(activeSearch) ||
    (p.utr && p.utr.toLowerCase().includes(activeSearch))
  ) : [];

  const tradeMatches = searchQuery ? trades.filter((t) =>
    t.pair.toLowerCase().includes(activeSearch)
  ) : [];

  const partnerMatches = searchQuery ? partners.filter((p) =>
    p.name.toLowerCase().includes(activeSearch) ||
    p.companyName.toLowerCase().includes(activeSearch)
  ) : [];

  const transactionMatches = searchQuery ? transactions.filter((t) =>
    t.id.toLowerCase().includes(activeSearch) ||
    t.userName.toLowerCase().includes(activeSearch) ||
    t.method.toLowerCase().includes(activeSearch) ||
    (t.txRef && t.txRef.toLowerCase().includes(activeSearch))
  ) : [];

  const hasAnyMatches =
    matchesNav.length > 0 ||
    userMatches.length > 0 ||
    paymentMatches.length > 0 ||
    tradeMatches.length > 0 ||
    partnerMatches.length > 0 ||
    transactionMatches.length > 0;

  const handleItemClick = (href, termToSet) => {
    setSearchQuery(termToSet);
    setShowResults(false);
    router.push(href);
  };

  const renderSearchResults = () => {
    if (!showResults || !searchQuery) return null;
    return (
      <div className="absolute top-13 left-0 w-full max-h-[380px] overflow-y-auto rounded-xl border border-white/[0.09] bg-[#0b141b] p-4 shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin">
        {!hasAnyMatches && (
          <div className="py-6 text-center text-sm text-neutral-500">
            No results found for &ldquo;{searchQuery}&rdquo;
          </div>
        )}

        {matchesNav.length > 0 && (
          <div className="py-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Navigation</h4>
            <div className="space-y-0.5">
              {matchesNav.map((item) => (
                <div 
                  key={item.href}
                  onClick={() => handleItemClick(item.label === "Dashboard" ? "/admin/dashboard" : item.href, "")}
                  className="flex items-center justify-between rounded-lg p-2 text-sm text-neutral-300 hover:bg-white/[0.04] cursor-pointer transition"
                >
                  <span className="font-semibold text-white">{item.label}</span>
                  <span className="text-xs text-neutral-500 font-semibold">Go to section</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {userMatches.length > 0 && (
          <div className="py-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Users</h4>
            <div className="space-y-0.5">
              {userMatches.slice(0, 4).map((u) => (
                <div 
                  key={u.id}
                  onClick={() => handleItemClick("/admin/dashboard?section=users", u.name)}
                  className="flex items-center justify-between rounded-lg p-2 text-sm text-neutral-300 hover:bg-white/[0.04] cursor-pointer transition"
                >
                  <div>
                    <p className="font-semibold text-white">{u.name}</p>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                  </div>
                  <span className="text-xs font-bold text-green-300 bg-green-500/10 px-2 py-0.5 rounded">{u.plan}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentMatches.length > 0 && (
          <div className="py-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Payments</h4>
            <div className="space-y-0.5">
              {paymentMatches.slice(0, 4).map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleItemClick("/admin/dashboard?section=payments", p.id)}
                  className="flex items-center justify-between rounded-lg p-2 text-sm text-neutral-300 hover:bg-white/[0.04] cursor-pointer transition"
                >
                  <div>
                    <p className="font-semibold text-white">{p.id} - {p.user}</p>
                    <p className="text-xs text-neutral-500">{p.plan}</p>
                  </div>
                  <span className="text-xs text-white font-mono">{p.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tradeMatches.length > 0 && (
          <div className="py-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Trades</h4>
            <div className="space-y-0.5">
              {tradeMatches.slice(0, 4).map((t) => (
                <div 
                  key={t.id}
                  onClick={() => handleItemClick("/admin/dashboard?section=trades", t.pair)}
                  className="flex items-center justify-between rounded-lg p-2 text-sm text-neutral-300 hover:bg-white/[0.04] cursor-pointer transition"
                >
                  <span className="font-semibold text-white">{t.pair}</span>
                  <span className={`text-xs font-bold ${t.type === "BUY" ? "text-green-300" : "text-red-400"}`}>{t.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {partnerMatches.length > 0 && (
          <div className="py-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">WL Partners</h4>
            <div className="space-y-0.5">
              {partnerMatches.slice(0, 4).map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleItemClick("/admin/white-label", p.name)}
                  className="flex items-center justify-between rounded-lg p-2 text-sm text-neutral-300 hover:bg-white/[0.04] cursor-pointer transition"
                >
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.companyName}</p>
                  </div>
                  <span className="text-xs text-green-300">{p.domain}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {transactionMatches.length > 0 && (
          <div className="py-2.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Transactions</h4>
            <div className="space-y-0.5">
              {transactionMatches.slice(0, 4).map((t) => (
                <div 
                  key={t.id}
                  onClick={() => handleItemClick("/admin/dashboard?section=transactions", t.id)}
                  className="flex items-center justify-between rounded-lg p-2 text-sm text-neutral-300 hover:bg-white/[0.04] cursor-pointer transition"
                >
                  <div>
                    <p className="font-semibold text-white">{t.userName} ({t.type})</p>
                    <p className="text-xs text-neutral-500">{t.method} - {t.txRef || "N/A"}</p>
                  </div>
                  <span className="text-xs text-red-400 font-mono">₹{t.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Theme hook moved to top of component to satisfy Rules of Hooks

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.body.classList.toggle("light-theme", nextTheme === "light");
    localStorage.setItem("tradebot-theme", nextTheme);
    setTheme(nextTheme);
  };

  const getCleanRoleLabel = (role) => {
    if (role === "SUPER_ADMIN") return "Super Admin";
    if (role === "MANAGER") return "Manager";
    if (role === "VIEWER") return "Viewer (Read-Only)";
    return role;
  };

  return (
    <main className="super-admin-theme min-h-screen bg-[#050a0f] text-white">
      <div className="grid min-h-screen xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/[0.07] bg-[#071018]/95 xl:flex xl:flex-col">
          <div className="flex h-[86px] items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-neutral-200 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <Hexagon className="h-6 w-6 fill-white/20" />
              </span>
              <div>
                <span className="block text-xl font-bold tracking-tight">Nexus Capital</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-neutral-400 font-semibold">
                  <Crown className="h-3 w-3 text-yellow-300" />
                  {getCleanRoleLabel(currentUser?.role)}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-2">
            {adminNavGroups.map((group) => {
              // Filter navigation elements dynamically based on user role permissions
              const allowedItems = group.items.filter((item) => {
                const itemSectionRaw = item.href.includes("?section=") ? item.href.split("?section=").at(-1) : "";
                const itemSection = itemSectionRaw.includes("&filter=") ? itemSectionRaw.split("&filter=")[0] : itemSectionRaw;

                let permissionKey = itemSection || (
                  item.href.includes("plans") ? "plans" : 
                  item.href.includes("profit-distribution") ? "profit-distribution" : 
                  item.href.includes("white-label") ? "partners" : 
                  item.href.includes("withdrawals") ? "payments" : 
                  item.href.includes("initiated-payments") ? "payments" : 
                  item.href.includes("inquiries") ? "inquiries" : 
                  item.href.includes("notifications") ? "notifications" : 
                  "dashboard"
                );

                if (permissionKey === "transactions") permissionKey = "payments";
                if (item.label === "Dashboard") return true;
                if (item.label === "Create Partner") {
                  return hasPermission("partners", "create");
                }
                return hasPermission(permissionKey, "view");
              });

              if (allowedItems.length === 0) return null;

              return (
                <div key={group.title}>
                  <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-neutral-500">{group.title}</p>
                  <div className="mt-3 space-y-1">
                    {allowedItems.map((item) => {
                      const Icon = item.icon;
                      const itemSectionRaw = item.href.includes("?section=") ? item.href.split("?section=").at(-1) : "";
                      const itemSection = itemSectionRaw.includes("&filter=") ? itemSectionRaw.split("&filter=")[0] : itemSectionRaw;
                      const itemFilter = item.href.includes("&filter=") ? item.href.split("&filter=").at(-1) : "";
                      const activeFilter = searchParams.get("filter") || "All";
                      const active =
                        (item.href === "/admin/dashboard" && pathname === "/admin/dashboard" && !section) ||
                        (itemSection && section === itemSection && (!itemFilter || activeFilter === itemFilter)) ||
                        (!itemSection && item.href !== "/admin/dashboard" && pathname?.startsWith(item.href));
                      const badgeValue = item.label === "Withdraw Requests"
                        ? (pendingWithdrawalCount > 0 ? pendingWithdrawalCount.toString() : null)
                        : item.badge;
                      return (
                        <Link
                          key={`${group.title}-${item.label}`}
                          href={item.label === "Dashboard" ? "/admin/dashboard" : item.href}
                          className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                            active ? "bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]" : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"
                          }`}>
                          <Icon className={`h-4 w-4 ${active ? "text-neutral-100" : "text-neutral-400"}`} />
                          <span className="min-w-0 flex-1">{item.label}</span>
                          {badgeValue && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{badgeValue}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="px-4 pb-5">
            <div className="rounded-xl border border-white/[0.08] bg-[#0b141b] p-4 shadow-[0_18px_50px_-40px_rgba(0,208,156,0.65)]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
                  <Globe2 className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Platform Status</h3>
                  <p className="mt-1 text-sm font-semibold text-green-300">All Systems Operational</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">Updated: 2 minutes ago</p>
              <svg viewBox="0 0 160 34" className="mt-3 h-8 w-full" aria-hidden="true">
                <path d="M0 25 L14 22 L28 24 L42 20 L56 23 L70 16 L84 21 L98 19 L112 23 L126 18 L140 20 L160 9" fill="none" stroke="rgb(34 197 94)" strokeWidth="2" />
                <path d="M0 34 L0 25 L14 22 L28 24 L42 20 L56 23 L70 16 L84 21 L98 19 L112 23 L126 18 L140 20 L160 9 L160 34 Z" fill="rgba(34,197,94,0.12)" />
              </svg>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050a0f]/88 px-4 py-4 backdrop-blur-xl sm:px-6">
            <div className="flex flex-wrap xl:flex-nowrap items-center justify-between gap-4">
              <div className="relative hidden max-w-[460px] flex-1 lg:block z-40">
                <label className="flex h-11 w-full items-center gap-2 rounded-full border border-white/[0.09] bg-black/10 px-4 text-sm text-neutral-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus-within:border-green-500/35 transition">
                  <Search className="h-4 w-4" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-neutral-600" 
                    placeholder="Search anything..." 
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </label>
                {showResults && searchQuery && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowResults(false)} />
                    {renderSearchResults()}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                
                <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/[0.09] bg-white/[0.03] px-3 sm:px-4 text-sm font-bold text-white transition hover:border-green-500/30 hover:text-green-300">
                  <span className="hidden lg:inline">Visit Website</span>
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <DateRangePicker />
                <button
                  onClick={toggleTheme}
                  className="flex shrink-0 h-11 w-11 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-white transition hover:bg-white/[0.08]"
                  aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
                </button>
                <NotificationDropdown />
                <div className="relative shrink-0">
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex h-11 items-center gap-2 sm:gap-3 rounded-lg border border-white/[0.09] bg-white/[0.03] px-2 sm:px-3 text-left text-sm text-white hover:bg-white/[0.06] active:scale-[0.98] transition cursor-pointer select-none"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neutral-200 to-neutral-600 text-xs font-black text-black">SA</span>
                    <span className="hidden sm:block">
                      <span className="block font-bold leading-tight max-w-[100px] truncate">{getCleanRoleLabel(currentUser?.role)}</span>
                      <span className="text-xs text-neutral-500">Operator</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${showProfileMenu ? "rotate-180" : ""}`} />
                  </button>
                  
                  {showProfileMenu && (
                    <>
                      {/* Invisible backdrop to close dropdown on outside click */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      
                      <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.09] bg-[#0b141b] p-2 shadow-2xl backdrop-blur-xl z-50 animate-[fadeIn_0.15s_ease-out]">
                        <div className="px-3 py-2 text-xs border-b border-white/[0.06] mb-1">
                          <p className="font-semibold text-white truncate">{currentUser?.name || "System Operator"}</p>
                          <p className="text-neutral-500 truncate mt-0.5">{currentUser?.email || "admin@nexus.capital"}</p>
                          <p className="text-blue-400 font-bold mt-1 uppercase tracking-wider text-[10px]">{getCleanRoleLabel(currentUser?.role)}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          Log Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {pathname === "/admin/dashboard" && !section && (
            <div className="mt-5 px-4 sm:px-6">
              <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back, Operator!</h1>
              <p className="mt-1 text-sm text-neutral-400">Here&apos;s what&apos;s happening with your platform today.</p>
              <div className="relative mt-4 block lg:hidden w-full z-40">
                <label className="flex h-11 w-full items-center gap-2 rounded-full border border-white/[0.09] bg-black/10 px-4 text-sm text-neutral-500 focus-within:border-green-500/35 transition">
                  <Search className="h-4 w-4" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-neutral-600" 
                    placeholder="Search anything..." 
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </label>
                {showResults && searchQuery && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowResults(false)} />
                    {renderSearchResults()}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="space-y-5 px-4 py-5 sm:px-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
