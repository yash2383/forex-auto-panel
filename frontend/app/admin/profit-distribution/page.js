"use client";

import { Activity, AlertTriangle, Check, ChevronRight, DollarSign, RefreshCw, Search, Settings, ShieldAlert, User, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { useAdminStore } from "../../../hooks/adminStore";
import Link from "next/link";

function calculateDistribution(usersList, settings, includeLoss) {
  let totalAdmin = 0;
  let totalUserNet = 0;
  let activeUsersCount = 0;
  let totalProfit = 0;

  const result = usersList.map(user => {
    // Determine fee percentage based on plan
    let percent = settings.financials.platformFee / 100;
    if (user.plan === "Basic") percent = 0.25;
    if (user.plan === "Pro") percent = 0.30;
    if (user.plan === "VIP") percent = 0.20;

    // Associate static profits for mock users, or default to $150 profit for new users
    let profitVal = 150;
    if (user.name.includes("Rahul")) profitVal = 500;
    else if (user.name.includes("Priya")) profitVal = 200;
    else if (user.name.includes("Aman") || user.plan === "VIP") profitVal = 1200;
    else if (user.name.includes("Neha")) profitVal = 750;
    else if (user.name.includes("Karan")) profitVal = -50;
    else if (user.name.includes("Aditi")) profitVal = 100;

    let profitCents = Math.round(profitVal * 100);
    let adminCents = 0;
    
    if (profitCents > 0) {
      adminCents = Math.floor(profitCents * percent);
      activeUsersCount++;
      totalProfit += profitCents;
    }

    let userCents = profitCents - adminCents;

    if (profitCents > 0 || includeLoss) {
      totalAdmin += adminCents;
      totalUserNet += userCents;
    }

    return {
      ...user,
      initials: user.name.split(" ").map(n => n[0]).join("").toUpperCase(),
      profitFormatted: profitCents / 100,
      admin: adminCents / 100,
      userNet: userCents / 100,
      percentage: percent,
      isLoss: profitCents <= 0
    };
  }).filter(u => includeLoss || !u.isLoss);

  return {
    result,
    totalAdmin: totalAdmin / 100,
    totalUserNet: totalUserNet / 100,
    activeUsersCount,
    totalProfit: totalProfit / 100
  };
}

export default function ProfitDistributionPage() {
  const users = useAdminStore((s) => s.users);
  const settings = useAdminStore((s) => s.settings);
  const editUser = useAdminStore((s) => s.editUser);
  const distributeProfit = useAdminStore((s) => s.distributeProfit);
  const hasPermission = useAdminStore((s) => s.hasPermission);

  const [includeLoss, setIncludeLoss] = useState(false);
  const [distributed, setDistributed] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { result: calculatedUsers, totalAdmin, totalUserNet, activeUsersCount, totalProfit } = useMemo(() => {
    return calculateDistribution(users, settings, includeLoss);
  }, [users, settings, includeLoss]);

  if (!hasPermission("profit-distribution", "view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6 text-white">
        <ShieldAlert className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-md">
          You do not have the required permissions to view the <strong>Profit Distribution</strong> section. 
          Please contact a Super Admin if you believe this is an error.
        </p>
        <Link href="/admin/dashboard" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-white/[0.08] px-4 text-xs font-bold text-white hover:bg-white/[0.15] transition">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const canDistribute = hasPermission("profit-distribution", "edit");

  const handleDistribute = () => {
    // Execute distribution run in store (adds activity log)
    distributeProfit();

    // Mark all users' statuses as distributed in state
    users.forEach((u) => {
      editUser(u.id, { status: "Distributed" });
    });

    setDistributed(true);
  };
  
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";

  return (
    <div className="space-y-5">
      <div className={`${adminPanel} p-6 relative overflow-hidden`}>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-300">Financial Ops</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Profit Distribution</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
              Calculate and distribute platform earnings from user profits. Values are calculated dynamically to prevent floating point errors.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${distributed ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${distributed ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              {distributed ? 'Distributed' : 'Pending Review'}
            </span>
            <p className="text-[11px] text-neutral-500">Last run: {distributed ? 'Just now' : '27 May 2026 - 11:45 PM'}</p>
          </div>
        </div>
      </div>

      {!distributed && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-300">Important: Distribution is irreversible</h3>
              <p className="mt-1 text-sm text-yellow-500/80">
                Review the calculated platform fees and user net profits carefully. Once executed, this action will lock the values and write to the permanent financial ledger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${adminPanel} p-5 relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/10 blur-2xl transition duration-500 group-hover:bg-blue-500/20"></div>
          <p className="relative z-10 text-sm font-medium text-neutral-400">Total User Profit (Pool)</p>
          <p className="relative z-10 mt-3 flex items-baseline gap-1 text-2xl font-semibold tracking-tight text-white">
            {formatMoney(totalProfit)}
          </p>
          <div className="relative z-10 mt-3 flex items-center gap-2">
            <span className="flex h-5 items-center rounded bg-white/[0.04] px-1.5 text-xs font-medium text-neutral-400 ring-1 ring-inset ring-white/[0.08]">
              <User className="mr-1 h-3 w-3" />
              {activeUsersCount} Active Clients
            </span>
          </div>
        </article>

        <article className={`${adminPanel} p-5 relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-2xl transition duration-500 group-hover:bg-green-500/20"></div>
          <p className="relative z-10 text-sm font-medium text-neutral-400">Platform Earnings</p>
          <p className="relative z-10 mt-3 flex items-baseline gap-1 text-2xl font-semibold tracking-tight text-green-300">
            {formatMoney(totalAdmin)}
          </p>
          <div className="relative z-10 mt-3 flex items-center gap-2">
            <span className="flex h-5 items-center rounded bg-green-500/10 px-1.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
              Avg {formatMoney(totalAdmin / (activeUsersCount || 1))} per user
            </span>
          </div>
        </article>

        <article className={`${adminPanel} p-5 relative overflow-hidden group`}>
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500/10 blur-2xl transition duration-500 group-hover:bg-violet-500/20"></div>
          <p className="relative z-10 text-sm font-medium text-neutral-400">Total Distributed (Net)</p>
          <p className="relative z-10 mt-3 flex items-baseline gap-1 text-2xl font-semibold tracking-tight text-white">
            {formatMoney(totalUserNet)}
          </p>
          <div className="relative z-10 mt-3 flex items-center gap-2">
            <span className="flex h-5 items-center rounded bg-white/[0.04] px-1.5 text-xs font-medium text-neutral-400 ring-1 ring-inset ring-white/[0.08]">
              After Platform Fees
            </span>
          </div>
        </article>
        
        <article className={`${adminPanel} p-5 relative overflow-hidden flex flex-col justify-between`}>
          <p className="text-sm font-medium text-neutral-400">Distribution Action</p>
          
          <div className="mt-4">
            <button 
              onClick={handleDistribute}
              disabled={distributed || !canDistribute}
              className={`w-full flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all ${
                (distributed || !canDistribute)
                  ? 'bg-white/[0.03] text-neutral-500 border border-white/[0.05] cursor-not-allowed' 
                  : 'bg-green-500 text-black hover:bg-green-400 hover:shadow-[0_0_20px_-5px_rgba(34,197,94,0.4)]'
              }`}
            >
              {distributed ? (
                <>
                  <Check className="h-4 w-4" />
                  Distributed Successfully
                </>
              ) : !canDistribute ? (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  Read-Only Access
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Distribute Now
                </>
              )}
            </button>
          </div>
        </article>
      </div>
      
      <div className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <section className={`${adminPanel} p-5`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                  <Users className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold text-white">User Profit Breakdown</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-neutral-400">
                  <input 
                    type="checkbox" 
                    checked={includeLoss} 
                    onChange={(e) => setIncludeLoss(e.target.checked)}
                    className="rounded border-white/[0.1] bg-black/20 text-green-500 focus:ring-green-500 focus:ring-offset-black"
                  />
                  Include Loss Users
                </label>
                <div className="h-4 w-px bg-white/10"></div>
                <label className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500">
                  <Search className="h-3.5 w-3.5" />
                  <input className="min-w-[150px] bg-transparent text-white outline-none placeholder:text-neutral-600" placeholder="Search..." />
                </label>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-4 font-semibold">User</th>
                    <th className="px-4 py-4 font-semibold">Plan / %</th>
                    <th className="px-4 py-4 font-semibold">Total Profit</th>
                    <th className="px-4 py-4 font-semibold">Admin Cut</th>
                    <th className="px-4 py-4 font-semibold">User Net</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {calculatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/[0.025]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                            user.plan === 'VIP' ? 'bg-amber-500/20 text-amber-300' :
                            user.plan === 'Pro' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {user.initials}
                          </span>
                          <div>
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-[11px] text-neutral-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs font-medium text-neutral-300 border border-white/[0.05]">
                            {user.plan}
                          </span>
                          <span className="text-xs text-neutral-500">{(user.percentage * 100).toFixed(0)}% fee</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${user.isLoss ? 'text-red-400' : 'text-white'}`}>
                          {formatMoney(user.profitFormatted)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.isLoss ? (
                          <span className="text-neutral-600">-</span>
                        ) : (
                          <span className="font-medium text-green-300">{formatMoney(user.admin)}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-semibold ${user.isLoss ? 'text-red-400' : 'text-white'}`}>
                          {formatMoney(user.userNet)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.status === 'Distributed' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-1 text-[11px] font-bold text-green-300 border border-green-500/20">
                            <Check className="h-3 w-3" />
                            Distributed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2 py-1 text-[11px] font-bold text-yellow-300 border border-yellow-500/20">
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button 
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex h-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs font-medium text-neutral-300 hover:bg-white/[0.05] hover:text-white"
                        >
                          View Calc
                        </button>
                      </td>
                    </tr>
                  ))}
                  {calculatedUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-neutral-500">
                        No profitable users found. Try enabling {"Include Loss Users"}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        
        <div className="space-y-5">
          <section className={`${adminPanel} p-5`}>
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                <Settings className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-semibold text-white">Profit Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-white mb-2">Default Platform Fee</p>
                <div className="relative">
                  <input type="text" readOnly value={`${settings.financials.platformFee}%`} className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-neutral-300" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-neutral-500">Global</div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-white/[0.05]">
                <p className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">Plan Overrides</p>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 px-3 text-sm">
                    <span className="text-neutral-300 font-medium">Basic Plan Fee</span>
                    <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-xs">25%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 px-3 text-sm">
                    <span className="text-neutral-300 font-medium">Pro Plan Fee</span>
                    <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-xs">30%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] p-2 px-3 text-sm">
                    <span className="text-neutral-300 font-medium">VIP Plan Fee</span>
                    <span className="font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded text-xs border border-amber-500/20">20%</span>
                  </div>
                </div>
              </div>
              
              <Link href="/admin/dashboard?section=settings" className="w-full flex justify-center items-center mt-2 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-white hover:bg-white/[0.06] transition-colors">
                Update Settings
              </Link>
            </div>
          </section>
        </div>
      </div>
      
      {/* View Calculation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.05] p-5">
              <h3 className="text-lg font-semibold text-white">Calculation Breakdown</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-sm font-black text-blue-300">
                  {selectedUser.initials}
                </span>
                <div>
                  <p className="font-semibold text-white">{selectedUser.name}</p>
                  <p className="text-xs text-neutral-400">Plan: {selectedUser.plan}</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-white/[0.05] bg-black/20 p-4 space-y-3 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Base Profit:</span>
                  <span className="text-white">{formatMoney(selectedUser.profitFormatted)}</span>
                </div>
                <div className="flex justify-between border-b border-white/[0.05] pb-3">
                  <span className="text-neutral-400">Platform Fee Rate:</span>
                  <span className="text-white">{(selectedUser.percentage * 100).toFixed(0)}%</span>
                </div>
                
                <div className="flex justify-between pt-1">
                  <span className="text-neutral-400">Admin Cut:</span>
                  <span className="text-green-300 font-semibold">{formatMoney(selectedUser.admin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">User Net Profit:</span>
                  <span className="text-blue-300 font-semibold">{formatMoney(selectedUser.userNet)}</span>
                </div>
              </div>
              
              <div className="mt-2 text-[11px] text-neutral-500 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                <strong className="text-neutral-400">Formula:</strong> Values are calculated using cent-based integer math and floored to avoid floating point precision errors.
                <br />
                <code>Math.floor({selectedUser.profitFormatted} * 100 * {selectedUser.percentage}) / 100</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
