"use client";

import { Wallet, Coins, Gift } from "lucide-react";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function ProfileBalances({ profile }) {
  if (!profile) return null;

  const totalBalance = Number(profile.totalBalance || 0);
  const availableBalance = Number(profile.balance || 0);
  const rewardBalance = Number(profile.rewardBalance || 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Balance */}
      <div className="rounded-xl border border-white/10 bg-[#0B1110]/95 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-green-500/10 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Total Balance</p>
            <p className="mt-1 text-2xl font-black text-white">{formatCurrency(totalBalance)}</p>
            <p className="mt-0.5 text-[10px] font-medium text-green-400/80">(Includes rewards)</p>
          </div>
        </div>
      </div>

      {/* Available Balance */}
      <div className="rounded-xl border border-white/10 bg-[#0B1110]/95 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Available Balance</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(availableBalance)}</p>
          </div>
        </div>
      </div>

      {/* Reward Balance */}
      <div className="rounded-xl border border-white/10 bg-[#0B1110]/95 p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Reward Balance</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(rewardBalance)}</p>
            <p className="mt-0.5 text-[10px] font-medium text-teal-400/80">(Breakdown of Total)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
