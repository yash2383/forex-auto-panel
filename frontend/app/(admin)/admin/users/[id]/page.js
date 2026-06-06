"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Ban, Shield, User, Wallet, Sparkles, CreditCard, Activity, FileText, 
  Lock, CheckCircle2, XCircle, Clock, Key, ShieldAlert, Cpu
} from "lucide-react";
import { useAdminStore } from "../../../../../hooks/adminStore";
import { apiFetch } from "../../../../../lib/apiFetch";

const tabItems = [
  { id: "overview", label: "Overview", icon: User },
  { id: "subscription", label: "Subscription", icon: Sparkles },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "trades", label: "Trades", icon: Activity },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "security", label: "Security", icon: Lock }
];

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 p-6 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatCurrency(amount, currency = "USD") {
  if (currency === "USD") return `$${Number(amount).toLocaleString("en-US")}`;
  return `$${Number(amount).toLocaleString("en-US")}`;
}

export default function UserDetailPage({ params }) {
  const { id } = React.use(params);
  const router = useRouter();
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch(`/api/admin/users/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load user profile");
        }
        const payload = await res.json();
        setData(payload);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (!hasPermission("users", "view")) {
    return (
      <main className="min-h-screen bg-[#050a0f] p-6 text-white flex items-center justify-center">
        <div className="max-w-md w-full text-center rounded-2xl border border-red-500/20 bg-red-500/5 p-8">
          <Ban className="h-12 w-12 text-red-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Access Denied</h3>
          <p className="mt-2 text-sm text-neutral-400">
            You do not have the required administrative permissions to inspect user profiles.
          </p>
          <Link href="/admin/dashboard" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-white/[0.08] border border-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/[0.15]">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050a0f] p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-950/40 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.15)] animate-spin">
            <Cpu className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Loading User Profile...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#050a0f] p-6 text-white flex items-center justify-center">
        <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <ShieldAlert className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">Profile Load Error</h3>
          <p className="mt-2 text-sm text-neutral-400">{error || "User record not found"}</p>
          <Link href="/admin/dashboard?section=users" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-green-500 px-5 text-sm font-bold text-black transition hover:bg-green-400">
            Back to User Management
          </Link>
        </div>
      </main>
    );
  }

  const { profile, subscription, wallet, trading, payments, trades, reports, security } = data;

  return (
    <main className="min-h-screen bg-[#050a0f] p-4 md:p-6 text-white space-y-6">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard?section=users"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase ${
                profile.status === "ACTIVE" || profile.status === "VIP" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                profile.status === "BLOCKED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              } border`}>
                {profile.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">{profile.email} • {profile.partnerName}</p>
          </div>
        </div>
      </div>

      {/* Tabs Sub-navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] overflow-x-auto pb-px">
        {tabItems.map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold transition whitespace-nowrap ${
                active 
                  ? "border-green-500 text-green-400" 
                  : "border-transparent text-neutral-400 hover:text-white hover:border-white/10"
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Panels based on activeTab */}
      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Primary Details Card */}
            <div className={adminPanel}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">User Information</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Full Name</p>
                  <p className="font-bold text-white mt-0.5">{profile.name}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Email Address</p>
                  <p className="font-bold text-white mt-0.5">{profile.email}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Account Status</p>
                  <p className="font-bold text-white mt-0.5">{profile.status}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Registration Date</p>
                  <p className="font-bold text-white mt-0.5">{formatDate(profile.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Financial Card */}
            <div className={adminPanel}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Financial Status</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Current Wallet Balance</p>
                  <p className="font-bold text-white mt-0.5 font-mono">{formatCurrency(wallet.balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Total Deposits</p>
                  <p className="font-bold text-green-400 mt-0.5 font-mono">{formatCurrency(wallet.totalDeposits)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Total Withdrawals</p>
                  <p className="font-bold text-red-400 mt-0.5 font-mono">{formatCurrency(wallet.totalWithdrawals)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Unrealized Balance</p>
                  <p className="font-bold text-white mt-0.5 font-mono">{formatCurrency(wallet.unrealizedBalance)}</p>
                </div>
              </div>
            </div>

            {/* Trading Metrics Card */}
            <div className={adminPanel}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Trading Performance</h3>
              <div className="space-y-3.5 text-sm">
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Total Trades</p>
                  <p className="font-bold text-white mt-0.5">{trading.totalTrades}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Win Rate</p>
                  <p className="font-bold text-green-400 mt-0.5 font-mono">{trading.winRate.toFixed(2)}%</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold">Wins</p>
                    <p className="font-bold text-white mt-0.5 text-green-300">{trading.winningTrades}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold">Losses</p>
                    <p className="font-bold text-white mt-0.5 text-red-300">{trading.losingTrades}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-semibold">Current Equity</p>
                  <p className="font-bold text-white mt-0.5 font-mono">{formatCurrency(wallet.equity)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className={adminPanel}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Subscription Info</h3>
              {subscription ? (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Current Plan:</span>
                    <span className="font-bold text-white">{subscription.planName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Status:</span>
                    <span className="rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-xs font-bold text-green-400 uppercase">
                      {subscription.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Plan Start Date:</span>
                    <span className="font-bold text-white">{formatDate(subscription.paidAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Plan Expiry Date:</span>
                    <span className="font-bold text-white">{formatDate(subscription.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Days Remaining:</span>
                    <span className="font-bold text-green-400">{subscription.daysRemaining} Days</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  User does not have an active subscription license.
                </div>
              )}
            </div>

            <div className={adminPanel}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Latest Checkout Info</h3>
              {payments.length > 0 ? (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Last Submission:</span>
                    <span className="font-bold text-white">{payments[0].planName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Verification Status:</span>
                    <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                      payments[0].status === "APPROVED" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                      payments[0].status === "REJECTED" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                      payments[0].status === "VERIFIED" ? "bg-blue-500/10 text-blue-300 border-blue-500/20" :
                      "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                    } border`}>
                      {payments[0].status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Transaction ID / Reference:</span>
                    <span className="font-mono text-xs text-amber-300 select-all">{payments[0].txnHash}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-neutral-500 font-semibold">Submitted On:</span>
                    <span className="font-bold text-white">{formatDateTime(payments[0].createdAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500 text-sm">
                  No payment submissions found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Wallet Balance</p>
                <p className="mt-2 text-2xl font-bold font-mono text-white">{formatCurrency(wallet.balance)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Unrealized Balance</p>
                <p className="mt-2 text-2xl font-bold font-mono text-white">{formatCurrency(wallet.unrealizedBalance)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Current Equity</p>
                <p className="mt-2 text-2xl font-bold font-mono text-white">{formatCurrency(wallet.equity)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-green-500/[0.03] p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-500">Total Deposits</p>
                <p className="mt-2 text-2xl font-bold font-mono text-green-400">{formatCurrency(wallet.totalDeposits)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-red-500/[0.03] p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Total Withdrawals</p>
                <p className="mt-2 text-2xl font-bold font-mono text-red-400">{formatCurrency(wallet.totalWithdrawals)}</p>
              </div>
            </div>
            
            <div className={adminPanel}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Financial Records Overview</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                This wallet maintains double-entry records mapping onto system deposits and withdrawals. 
                Profits and losses from completed automatic trade signals are credited and debited directly to the realized balance upon close. 
                Pending withdrawals block the user from accessing relevant margin assets.
              </p>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className={adminPanel}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">All Payment Submissions</h3>
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-sm min-w-[760px]">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Transaction ID / Ref</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{p.planName}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-white whitespace-nowrap">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-neutral-400 border border-white/10">{p.paymentType}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-amber-300 select-all whitespace-nowrap">{p.txnHash || "N/A"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                          p.status === "APPROVED" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                          p.status === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          p.status === "VERIFIED" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-sm text-neutral-500">No payment records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRADES TAB */}
        {activeTab === "trades" && (
          <div className={adminPanel}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Active & Completed Trade History</h3>
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-sm min-w-[760px]">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Pair</th>
                    <th className="px-4 py-3 font-semibold">Side</th>
                    <th className="px-4 py-3 font-semibold">Entry Price</th>
                    <th className="px-4 py-3 font-semibold">Current/Exit</th>
                    <th className="px-4 py-3 font-semibold">Profit/Loss</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300">
                  {trades.map((t) => {
                    const isWin = t.pnl > 0;
                    return (
                      <tr key={t.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                        <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{t.pair}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${t.type === "BUY" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap">{formatCurrency(t.entryPrice)}</td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap">{formatCurrency(t.status === "CLOSED" ? t.exitPrice : t.currentPrice)}</td>
                        <td className={`px-4 py-3 font-mono font-bold whitespace-nowrap ${t.status === "CLOSED" ? (isWin ? "text-green-400" : "text-red-400") : "text-neutral-400"}`}>
                          {t.status === "CLOSED" ? `${isWin ? "+" : ""}${formatCurrency(t.pnl)}` : "Floating..."}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            t.status === "CLOSED" ? "bg-white/5 text-neutral-400 border border-white/10" : "bg-green-500/10 text-green-400 border border-green-500/20 animate-pulse"
                          } border`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {trades.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-sm text-neutral-500">No trading records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === "reports" && (
          <div className={adminPanel}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Generated Reports & Audits</h3>
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Report Name</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Date Generated</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-semibold text-white">{r.fileName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-neutral-400 border border-white/10">{r.reportType}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <a 
                          href={r.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-green-400 hover:text-green-300 transition"
                        >
                          View File
                        </a>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-neutral-500">No generated reports files found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Meta Cards */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Last Login Date & Time</p>
                <p className="mt-1.5 text-sm font-semibold text-white">{formatDateTime(security.lastLoginAt)}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Last Registered Login IP</p>
                <p className="mt-1.5 text-sm font-semibold font-mono text-white">{security.lastLoginIP || "Unknown"}</p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Security Parameters</p>
                <div className="mt-2.5 space-y-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-neutral-500">Email Verified:</span>
                    <span className="text-green-400">Yes</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-neutral-500">2FA Authenticator:</span>
                    <span className="text-neutral-400">Disabled</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Audit List */}
            <div className={`md:col-span-2 ${adminPanel}`}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-green-300 mb-4 border-b border-white/5 pb-2">Operator Security Events</h3>
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {security.events.map((event) => (
                  <div key={event.id} className="text-xs rounded-lg border border-white/[0.04] bg-black/10 p-3 flex justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{event.action}</p>
                      <p className="text-neutral-500">{event.reason}</p>
                      <p className="text-[10px] text-neutral-600 font-mono">IP: {event.ipAddress || "127.0.0.1"}</p>
                    </div>
                    <span className="shrink-0 text-neutral-500 font-medium font-mono">{formatDateTime(event.createdAt)}</span>
                  </div>
                ))}
                {security.events.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-8">No security override events logged.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
