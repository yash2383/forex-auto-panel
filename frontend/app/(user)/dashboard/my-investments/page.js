"use client";

import { useState, useEffect } from "react";
import { Coins, Loader2, Calendar, Landmark, TrendingUp, HelpCircle, CheckCircle2, ChevronRight } from "lucide-react";
import { apiFetch } from "../../../../lib/apiFetch";

export default function MyInvestmentsPage() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const loadInvestments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/investments/active");
      if (res.ok) {
        const data = await res.json();
        setInvestments(data);
      } else {
        triggerToast("Failed to fetch your investment portfolio.", "error");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error loading investments portfolio.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, []);

  // Aggregate Metrics calculations
  const activeInvestments = investments.filter((i) => i.status === "ACTIVE");
  const totalInvested = activeInvestments.reduce((sum, i) => sum + i.amount, 0);
  const weeklyEarnings = activeInvestments.reduce((sum, i) => sum + (i.amount * i.profitRate) / 100, 0);
  const activeCount = activeInvestments.length;
  const completedCount = investments.filter((i) => i.status === "COMPLETED").length;

  return (
    <section className="space-y-6 font-sans">
      {/* Toast popup */}
      {toast.show && (
        <div
          className={`fixed right-5 top-24 z-50 rounded-lg border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all duration-300 transform scale-100 ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header card */}
      <article className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-r from-[#06120e] to-[#020907] p-6 shadow-[0_0_50px_-25px_rgba(34,197,94,0.35)]">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-3xl"></div>
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/20">
            <Coins className="h-3.5 w-3.5" />
            My Investments Portfolio
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white font-mono">Position Tracking Panel</h1>
          <p className="mt-2 text-sm text-neutral-400 max-w-xl">
            Audit your active yield contracts, inspect expected payouts, and track capital lock-up schedules.
          </p>
        </div>
      </article>

      {/* Summary Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Active Locked</span>
            <Coins className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white font-mono">₹{totalInvested.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Sum of active principal lockups</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Est. Weekly Return</span>
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-green-400 font-mono">+₹{weeklyEarnings.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Calculated cumulative returns</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
            <Landmark className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">{activeCount}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Running yields earning profits</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Plans</span>
            <CheckCircle2 className="h-5 w-5 text-neutral-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">{completedCount}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Contracts matured & returned to cash</p>
        </div>
      </div>

      {/* Positions Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        </div>
      ) : (
        <section className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_45px_-28px_rgba(34,197,94,0.6)]">
          <h2 className="text-lg font-semibold text-white mb-4">Investment Contracts Ledger</h2>
          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#050c09]">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-white/[0.02] text-xs uppercase text-neutral-500 border-b border-white/[0.08]">
                <tr>
                  <th className="px-5 py-4 font-semibold">Plan Name</th>
                  <th className="px-4 py-4 font-semibold text-center">Amount Invested</th>
                  <th className="px-4 py-4 font-semibold text-center">Weekly Yield Rate</th>
                  <th className="px-4 py-4 font-semibold text-center">Estimated Yield</th>
                  <th className="px-4 py-4 font-semibold text-center">Start Date</th>
                  <th className="px-4 py-4 font-semibold text-center">Next Yield Cycle</th>
                  <th className="px-5 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-neutral-300">
                {investments.map((inv) => {
                  const isActive = inv.status === "ACTIVE";
                  const weeklyAmt = (inv.amount * inv.profitRate) / 100;
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.015] transition">
                      <td className="px-5 py-4 font-bold text-white">{inv.planName}</td>
                      <td className="px-4 py-4 text-center font-mono text-white font-semibold">₹{inv.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-4 text-center text-green-400 font-bold">{inv.profitRate}%</td>
                      <td className="px-4 py-4 text-center text-green-300 font-bold font-mono">₹{weeklyAmt.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-4 text-center text-neutral-400">
                        {new Date(inv.startDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-4 text-center text-amber-300 font-medium">
                        {isActive
                          ? new Date(inv.nextProfitDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
                          : "Completed"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            isActive
                              ? "bg-green-500/10 text-green-300 border border-green-500/20"
                              : "bg-neutral-500/10 text-neutral-400 border border-white/5"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {investments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-neutral-500 bg-white/[0.005]">
                      You have no active investment positions. Subscriptions to yield plans will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
