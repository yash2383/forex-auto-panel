"use client";

import { useEffect, useState } from "react";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import Link from "next/link";
import { apiFetch } from "../../../../lib/apiFetch";
import {
  Hexagon,
  Zap,
  Clock3,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  ArrowRight
} from "lucide-react";

export default function SubscriptionPage() {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      const res = await apiFetch("/api/user/subscription");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionData(data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="mx-auto mb-4 flex h-12 w-12 animate-spin items-center justify-center rounded-2xl border border-green-500/20 bg-green-950/40 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.15)]">
          <Hexagon className="h-6 w-6" />
        </div>
      </div>
    );
  }

  const hasSubscription = subscriptionData?.hasSubscription;
  const sub = subscriptionData?.subscription;
  const pending = subscriptionData?.pendingCheckout;

  // Render State 1: Active or Expired Subscription
  if (hasSubscription && sub) {
    const isActive = sub.status === "ACTIVE";
    const statusText = isActive ? "Active" : "Expired";
    const statusColor = isActive ? "text-green-400" : "text-red-400";
    const statusBg = isActive ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20";
    
    const expiryDateStr = sub.expiresAt
      ? new Date(sub.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "—";

    const startedDateStr = sub.startedAt
      ? new Date(sub.startedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "—";

    const totalDays = sub.totalDays || 30;
    const daysRemaining = sub.daysRemaining !== null ? sub.daysRemaining : 0;
    const progressPercent = Math.min(100, Math.max(0, Math.round(((totalDays - daysRemaining) / totalDays) * 100)));

    return (
      <>
        <PageIntro
          title="Subscription"
          description="Manage your active plan and access details about your subscription.">
          <p className="text-sm font-semibold text-green-300">Stay updated with your plan and access level.</p>
        </PageIntro>

        <div className="space-y-6">
          {/* If there is also a pending checkout (e.g. renewal/upgrade), show an alert banner */}
          {pending && (
            <div className="flex items-center gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                <Clock3 className="h-4 w-4 animate-pulse" />
              </span>
              <div className="flex-1 text-sm text-neutral-300">
                <span className="font-bold text-white">Upgrade Request Under Review:</span> You have submitted a payment of{" "}
                <span className="font-semibold text-white">
                  ${Number(pending.amount).toLocaleString("en-US")}
                </span>{" "}
                for the <span className="font-semibold text-white">{pending.planName}</span>. We are reviewing it.
              </div>
            </div>
          )}

          <SectionCard title="Your Subscription" description="Current active trading plan details, duration, and status.">
            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${statusBg} text-white shadow-lg`}>
                  {isActive ? <Zap className="h-7 w-7 text-green-400" /> : <AlertTriangle className="h-7 w-7 text-red-400" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{sub.planName}</h3>
                  <p className="text-xs text-neutral-500">Algorithmic trading license</p>
                </div>
              </div>
              <div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  isActive ? "border-green-500/30 bg-green-500/15 text-green-400" : "border-red-500/30 bg-red-500/15 text-red-400"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-400 animate-ping" : "bg-red-400"}`} />
                  {statusText}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Plan Amount</p>
                <strong className="mt-1 block text-lg text-white font-mono">
                  ${Number(sub.amount).toLocaleString("en-US")}
                </strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">License Started</p>
                <strong className="mt-1 block text-lg text-white">{startedDateStr}</strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Expiration Date</p>
                <strong className="mt-1 block text-lg text-white">{expiryDateStr}</strong>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Days Remaining</p>
                <strong className="mt-1 block text-lg text-white">{daysRemaining} Days</strong>
              </div>
            </div>

            {isActive && (
              <div className="mt-8 border-t border-white/5 pt-6">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span>Subscription Progress</span>
                  <span className="font-semibold text-green-400">{daysRemaining} days left</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 text-sm font-bold text-black transition-all hover:bg-green-400 active:scale-[0.98]"
              >
                Renew or Upgrade Plan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </SectionCard>
        </div>
        <Disclaimer />
      </>
    );
  }

  // Render State 2: Verification Pending (submitted payment but no active subscription yet)
  if (pending) {
    const formattedAmount = pending.amount
      ? `$${Number(pending.amount).toLocaleString("en-US")}`
      : "—";

    return (
      <>
        <PageIntro
          title="Subscription"
          description="Manage your active plan and access details about your subscription.">
          <p className="text-sm font-semibold text-yellow-300">Your recent transaction is being verified.</p>
        </PageIntro>

        <SectionCard title="Payment Under Review" description="Your subscription activation is waiting for administrator approval.">
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.02] p-8 text-center sm:p-12">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.1)] mb-6">
              <Clock3 className="h-8 w-8 animate-pulse" />
            </span>

            <h3 className="text-2xl font-bold text-white">⏳ Payment Submitted Successfully</h3>
            <p className="mt-2 text-sm text-neutral-400 max-w-md">
              We have received your payment details and are verifying the transaction. Your subscription will be activated automatically once approved.
            </p>

            <div className="mt-8 w-full max-w-sm rounded-xl border border-white/5 bg-black/30 p-6 text-left space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 font-medium">Selected Plan:</span>
                <span className="font-bold text-white">{pending.planName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 font-medium">Amount Submitted:</span>
                <span className="font-bold text-white font-mono">{formattedAmount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500 font-medium">Current Status:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-yellow-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-ping" />
                  {pending.status === "VERIFIED" ? "Verified (Pending Approval)" : "Pending Approval"}
                </span>
              </div>
            </div>

            <p className="mt-6 text-xs text-neutral-600 font-semibold">
              This process usually takes less than an hour. Feel free to navigate away; your dashboard will update dynamically.
            </p>

            <div className="mt-8 flex gap-4">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-6 text-sm font-bold text-white transition hover:bg-white/[0.08]"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={fetchSubscription}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </SectionCard>
        <Disclaimer />
      </>
    );
  }

  // Render State 3: Inactive / No Active Plan & No Pending Checkout
  return (
    <>
      <PageIntro
        title="Subscription"
        description="Manage your active plan and access details about your subscription.">
        <p className="text-sm font-semibold text-neutral-500">You do not have an active algorithmic trading license.</p>
      </PageIntro>

      <SectionCard title="Your Subscription" description="Get started with automated trading by choosing one of our algorithmic plans.">
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.01] p-8 text-center sm:p-12">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-900 border border-white/5 text-neutral-500 mb-6">
            <CreditCard className="h-8 w-8" />
          </span>

          <h3 className="text-xl font-bold text-white">No Active Subscription</h3>
          <p className="mt-2 text-sm text-neutral-500 max-w-sm">
            Unlock automated algorithmic trading execution, priority API bandwidth, and professional-grade performance trackers.
          </p>

          <Link
            href="/pricing"
            className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 text-sm font-bold text-black transition-all hover:bg-green-400 active:scale-[0.98]"
          >
            Browse Pricing Plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </SectionCard>
      <Disclaimer />
    </>
  );
}
