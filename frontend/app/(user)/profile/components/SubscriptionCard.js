"use client";

import { CreditCard, Clock, CheckCircle, AlertTriangle, Zap } from "lucide-react";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount, currency = "INR") {
  if (currency === "INR") return `₹${Number(amount).toLocaleString("en-IN")}`;
  return `$${Number(amount).toLocaleString("en-US")}`;
}

export default function SubscriptionCard({ subscription }) {
  // No subscription at all and no pending checkout
  if (!subscription?.hasSubscription && !subscription?.pendingCheckout) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0B1110]/95 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800/40 text-neutral-500 mb-4">
          <CreditCard className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Active Subscription</h3>
        <p className="mt-2 text-xs text-neutral-500 max-w-sm mx-auto">
          Get started with automated trading by choosing one of our algorithmic plans.
        </p>
        <a
          href="/pricing"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-green-500 px-4 text-xs font-bold text-black transition hover:bg-green-400"
        >
          View Plans
        </a>
      </div>
    );
  }

  // Pending checkout but no active plan
  if (!subscription?.hasSubscription && subscription?.pendingCheckout) {
    const checkout = subscription.pendingCheckout;
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
            <Clock className="h-4.5 w-4.5 text-amber-400" />
          </span>
          <div>
            <h3 className="text-base font-bold text-white">Verification Pending</h3>
            <p className="text-xs text-neutral-500">Your recent checkout is under review</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg bg-black/25 p-3.5 border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Plan</p>
            <p className="text-xs font-bold text-white">{checkout.planName}</p>
          </div>
          <div className="rounded-lg bg-black/25 p-3.5 border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Amount</p>
            <p className="text-xs font-bold text-white font-mono">{formatCurrency(checkout.amount)}</p>
          </div>
          <div className="rounded-lg bg-black/25 p-3.5 border border-white/[0.04]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Status</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Clock className="h-3 w-3" />
              {checkout.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription
  const sub = subscription.subscription;
  const isActive = sub.status === "ACTIVE";
  const progressPercent = Math.round(((sub.totalDays - sub.daysRemaining) / sub.totalDays) * 100);

  return (
    <div className={`rounded-xl border ${isActive ? "border-green-500/20 bg-green-500/[0.02]" : "border-red-500/20 bg-red-500/[0.02]"} p-6`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? "bg-green-500/10" : "bg-red-500/10"}`}>
            {isActive ? <Zap className="h-4.5 w-4.5 text-green-400" /> : <AlertTriangle className="h-4.5 w-4.5 text-red-400" />}
          </span>
          <div>
            <h3 className="text-base font-bold text-white">Current Subscription</h3>
            <p className="text-xs text-neutral-500">Details of your active trading license</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black border ${
          isActive 
            ? "border-green-500/30 bg-green-500/15 text-green-400" 
            : "border-red-500/30 bg-red-500/15 text-red-400"
        }`}>
          {isActive ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {sub.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Plan Name</p>
          <p className="text-xs font-bold text-white">{sub.planName}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Amount Paid</p>
          <p className="text-xs font-bold text-white font-mono">{formatCurrency(sub.amount, sub.currency)}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Paid On</p>
          <p className="text-xs font-bold text-white">{formatDate(sub.approvedAt)}</p>
        </div>
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Expires On</p>
          <p className={`text-xs font-bold ${isActive ? "text-white" : "text-red-400"}`}>{formatDate(sub.expiresAt)}</p>
        </div>
      </div>

      {isActive && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-neutral-500 font-semibold">Subscription Progress</span>
            <span className="text-green-400 font-bold">{sub.daysRemaining} days remaining</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[9px] text-neutral-600 font-semibold">
            <span>{formatDate(sub.approvedAt)}</span>
            <span>{formatDate(sub.expiresAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
