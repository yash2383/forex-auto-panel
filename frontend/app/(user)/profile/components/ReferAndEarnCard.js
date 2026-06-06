"use client";

import { Copy, Users, CheckCircle2, IndianRupee, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ReferAndEarnCard({ profile, stats }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fallback to placeholder if backend doesn't provide referral info yet
  const referralCode = stats?.referralCode || profile?.referralCode || "USER123";
  const referralLink = `http://localhost:3000/register?ref=${referralCode}`;
  const totalReferrals = stats?.stats?.totalReferrals ?? profile?.totalReferrals ?? 0;
  const activeReferrals = stats?.stats?.activeReferrals ?? profile?.activeReferrals ?? 0;
  const rewardsEarned = stats?.stats?.totalEarnings ?? profile?.rewardsEarned ?? 0;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <section className="rounded-2xl border border-white/5 bg-[#050B0A] p-6 shadow-xl backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white tracking-tight">Refer & Earn</h2>
          <p className="mt-1 text-sm font-medium text-neutral-400">
            Invite friends and earn rewards
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Referral Links Section */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Referral Code
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-11 flex-1 items-center rounded-lg border border-white/10 bg-black/20 px-4 font-mono text-sm text-white">
                {referralCode}
              </div>
              <button
                onClick={() => handleCopy(referralCode, "code")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                title="Copy Code"
              >
                {copiedCode ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Referral Link
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-11 flex-1 items-center overflow-hidden rounded-lg border border-white/10 bg-black/20 px-4 font-mono text-xs text-neutral-300">
                <span className="truncate">{referralLink}</span>
              </div>
              <button
                onClick={() => handleCopy(referralLink, "link")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
                title="Copy Link"
              >
                {copiedLink ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-blue-400" />
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Referrals</div>
            <div className="mt-1 text-xl font-bold text-white">{totalReferrals}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-400" />
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Active Referrals</div>
            <div className="mt-1 text-xl font-bold text-white">{activeReferrals}</div>
          </div>
          <div className="col-span-2 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
            <IndianRupee className="mx-auto mb-2 h-6 w-6 text-green-400" />
            <div className="text-xs font-semibold uppercase tracking-wider text-green-500">Rewards Earned</div>
            <div className="mt-1 text-2xl font-bold text-green-400 font-mono">
              ${rewardsEarned.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-white/5 pt-6">
        <Link
          href="/profile/refer-earn"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 transition-colors hover:text-green-300"
        >
          View Full Referral History <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
