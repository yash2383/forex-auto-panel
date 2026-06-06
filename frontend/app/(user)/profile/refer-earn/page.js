"use client";

import { useEffect, useState, Fragment } from "react";
import { Copy, Gift, Hexagon, Share2, Users, CheckCircle, Clock, ShieldAlert, Award, Wallet, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch } from "../../../../lib/apiFetch";

export default function ReferEarnPage() {
  const [data, setData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [expandedRefId, setExpandedRefId] = useState(null);

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const [statsRes, refsRes, earningsRes] = await Promise.all([
          apiFetch("/api/user/referrals/stats"),
          apiFetch("/api/user/referrals"),
          apiFetch("/api/user/referrals/earnings"),
        ]);

        if (statsRes.ok) setData(await statsRes.json());
        if (refsRes.ok) {
          const res = await refsRes.json();
          setReferrals(Array.isArray(res) ? res : (res.referrals || []));
        }
        if (earningsRes.ok) {
          const res = await earningsRes.json();
          setEarnings(Array.isArray(res) ? res : (res.earnings || []));
        }
      } catch (err) {
        console.error("Referral fetch error:", err);
      }
      setLoading(false);
    };

    fetchReferralData();
  }, []);

  const handleCopyCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share && data?.referralLink) {
      try {
        await navigator.share({
          title: "Join and Earn",
          text: "Use my referral link to register!",
          url: data.referralLink,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "PAID":
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400"><CheckCircle className="h-3 w-3" /> {status}</span>;
      case "PENDING":
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs font-medium text-yellow-400"><Clock className="h-3 w-3" /> {status}</span>;
      case "REJECTED":
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400"><ShieldAlert className="h-3 w-3" /> {status}</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-neutral-500/10 px-2 py-1 text-xs font-medium text-neutral-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-950/40 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.15)] animate-spin">
              <Hexagon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Loading Referral Data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B1110] p-6 shadow-2xl sm:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-green-500/10 blur-[80px]"></div>

          <div className="relative flex flex-col md:flex-row gap-8 justify-between">
            <div className="max-w-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20 text-green-400">
                  <Gift className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Refer & Earn</h1>
              </div>
              <p className="text-neutral-400 mb-6 text-sm leading-relaxed">
                Invite your friends and earn rewards when they join and purchase a plan. The more you refer, the more you earn!
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Your Referral Code</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 flex-1 items-center rounded-xl border border-white/10 bg-black/40 px-4 font-mono text-green-400 font-bold tracking-widest">
                      {data?.referralCode || "---"}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex h-12 items-center gap-2 rounded-xl bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      {copiedCode ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                      <span className="hidden sm:inline">{copiedCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Your Referral Link</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 flex-1 items-center rounded-xl border border-white/10 bg-black/40 px-4 font-mono text-neutral-300 text-xs overflow-hidden truncate">
                      {data?.referralLink || "---"}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="flex h-12 items-center justify-center rounded-xl bg-white/5 w-12 text-white transition hover:bg-white/10"
                      title="Copy Link"
                    >
                      {copiedLink ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    {typeof navigator !== "undefined" && navigator.share && (
                      <button
                        onClick={handleShare}
                        className="flex h-12 items-center justify-center rounded-xl bg-green-500/20 text-green-400 w-12 transition hover:bg-green-500/30"
                        title="Share"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl" />
                <img src="/assets/illustrations/referral.svg" alt="Referral Illustration" className="relative h-48 w-48 object-contain opacity-80" onError={(e) => e.target.style.display = 'none'} />
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          <div className="rounded-2xl border border-white/5 bg-[#0B1110] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-neutral-400">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">Total Referrals</p>
            <p className="mt-1 text-2xl font-bold text-white">{data?.stats?.totalReferrals || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0B1110] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">Pending Referrals</p>
            <p className="mt-1 text-2xl font-bold text-white">{data?.stats?.pendingReferrals || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0B1110] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">Approved Referrals</p>
            <p className="mt-1 text-2xl font-bold text-white">{data?.stats?.approvedReferrals || 0}</p>
          </div>
          <div className="rounded-2xl border border-green-500/20 bg-green-950/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <Award className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-400">Total Earned</p>
            <p className="mt-1 text-2xl font-bold text-green-400">{formatCurrency(data?.stats?.totalRewardsEarned)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0B1110] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
              <Clock className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">Pending Rewards</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data?.stats?.pendingRewards)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0B1110] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">Available Balance</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data?.stats?.availableBalance)}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-[#0B1110] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <p className="text-xs font-medium text-neutral-500">Paid Rewards</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(data?.stats?.paidRewards)}</p>
          </div>
        </div>

        {/* Referral History Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1110]">
          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="font-bold text-white">Referral History</h3>
          </div>
          <div className="overflow-x-auto">
            {referrals.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-neutral-500">
                <Users className="mx-auto h-8 w-8 mb-3 opacity-20" />
                <p>You haven&apos;t referred anyone yet.</p>
                <p className="mt-1">Share your referral link and start earning rewards.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-neutral-400">
                <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Plan Purchased</th>
                    <th className="px-6 py-4">Join Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals.map((ref) => {
                    const isExpanded = expandedRefId === ref.id;
                    return (
                      <Fragment key={ref.id}>
                        <tr 
                          className="transition hover:bg-white/[0.02] cursor-pointer"
                          onClick={() => setExpandedRefId(isExpanded ? null : ref.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-neutral-500 shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-neutral-500 shrink-0" />
                              )}
                              <div>
                                <p className="font-medium text-white">{ref.referredUser.name}</p>
                                <p className="text-[11px] text-neutral-500">{ref.referredUser.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium">{ref.plan}</td>
                          <td className="px-6 py-4">
                            {new Date(ref.joinDate).toLocaleDateString("en-US", {
                              day: "2-digit", month: "short", year: "numeric"
                            })}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(ref.status)}</td>
                          <td className="px-6 py-4 text-right font-bold text-green-400">
                            {formatCurrency(ref.commission)}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-black/40 px-6 py-4 border-t border-b border-white/5">
                              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 text-xs">
                                <div>
                                  <p className="text-neutral-500 font-medium uppercase tracking-wider">Deposit Amount</p>
                                  <p className="mt-1 font-bold text-white text-sm">
                                    {ref.depositAmount ? formatCurrency(ref.depositAmount) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-500 font-medium uppercase tracking-wider">Platform Fee %</p>
                                  <p className="mt-1 font-bold text-white text-sm">
                                    {ref.platformFeePercent != null ? `${ref.platformFeePercent}%` : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-500 font-medium uppercase tracking-wider">Platform Fee Amount</p>
                                  <p className="mt-1 font-bold text-white text-sm">
                                    {ref.platformFeeAmount != null ? formatCurrency(ref.platformFeeAmount) : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-500 font-medium uppercase tracking-wider">Referral Rate</p>
                                  <p className="mt-1 font-bold text-white text-sm">
                                    {ref.referralRate != null ? `${ref.referralRate}%` : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-500 font-medium uppercase tracking-wider">Reward</p>
                                  <p className="mt-1 font-bold text-green-400 text-sm">{formatCurrency(ref.commission)}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Earnings History Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1110]">
          <div className="border-b border-white/10 px-6 py-5">
            <h3 className="font-bold text-white">Earnings History</h3>
          </div>
          <div className="overflow-x-auto">
            {earnings.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-neutral-500">
                <DollarSign className="mx-auto h-8 w-8 mb-3 opacity-20" />
                <p>No referral commissions have been generated yet.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-neutral-400">
                <thead className="bg-white/5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Referral User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {earnings.map((earn) => (
                    <tr key={earn.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        {new Date(earn.date).toLocaleDateString("en-US", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-white">{earn.referredUser}</td>
                      <td className="px-6 py-4">{getStatusBadge(earn.status)}</td>
                      <td className="px-6 py-4 text-right font-bold text-green-400">
                        {formatCurrency(earn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
