"use client";

import { Calculator, CircleDollarSign, Gauge, ShieldAlert, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { getPlatformFeePercent } from "../../../lib/platformFee";

const plans = {
  club: {
    label: "Club Plan",
    detail: "Beginner",
    fee: 0.05,
    returns: {
      "1w": 0.025,
      "1m": 0.08,
      "3m": 0.22,
    },
  },
  individual: {
    label: "Individual Plan",
    detail: "Advanced",
    fee: 0.05,
    returns: {
      "1w": 0.04,
      "1m": 0.12,
      "3m": 0.34,
    },
  },
};

const durations = [
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
];

const risks = {
  low: { label: "Low", detail: "Safe returns", multiplier: 0.75 },
  medium: { label: "Medium", detail: "Balanced", multiplier: 1 },
  high: { label: "High", detail: "Aggressive", multiplier: 1.35 },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);

export default function ProfitSimulatorPage() {
  const [investment, setInvestment] = useState(1000);
  const [planKey, setPlanKey] = useState("club");
  const [durationKey, setDurationKey] = useState("1m");
  const [riskKey, setRiskKey] = useState("medium");

  const result = useMemo(() => {
    const amount = Number.isFinite(Number(investment)) ? Math.max(Number(investment), 0) : 0;
    const plan = plans[planKey];
    const expectedReturn = plan.returns[durationKey] * risks[riskKey].multiplier;
    const profit = amount * expectedReturn;
    
    // Dynamic platform fee percentage calculation
    const feePct = getPlatformFeePercent(planKey === "individual" ? "INDIVIDUAL" : "CLUB", amount);
    const fee = profit * (feePct / 100);
    const netProfit = profit - fee;
    const finalBalance = amount + netProfit;

    return {
      amount,
      plan: {
        ...plan,
        fee: feePct / 100,
      },
      expectedReturn,
      profit,
      fee,
      netProfit,
      finalBalance,
    };
  }, [durationKey, investment, planKey, riskKey]);

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
              <Calculator className="h-3.5 w-3.5" />
              Profit Simulator
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-medium tracking-tight text-white sm:text-6xl">
              Estimate returns before you subscribe.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
              Enter an investment, choose a plan, select a duration, and see estimated profit, platform fee, net profit, and final balance instantly.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 shadow-[0_0_50px_-10px_rgba(34,197,94,0.16)] sm:p-6">
            <div className="grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Investment Amount</span>
                <span className="relative block">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-500">$</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={investment}
                    onChange={(event) => setInvestment(event.target.value)}
                    className="h-14 w-full rounded-xl border border-white/10 bg-[#111] px-8 text-lg font-semibold text-white outline-none transition placeholder:text-neutral-600 focus:border-green-500/50 focus:ring-2 focus:ring-green-500/10"
                  />
                </span>
              </label>

              <div>
                <span className="mb-3 block text-sm font-semibold text-white">Select Plan</span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {Object.entries(plans).map(([key, plan]) => {
                    const amount = Number.isFinite(Number(investment)) ? Math.max(Number(investment), 0) : 0;
                    const feePct = getPlatformFeePercent(key === "individual" ? "INDIVIDUAL" : "CLUB", amount);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPlanKey(key)}
                        className={`rounded-xl border p-4 text-left transition ${
                          planKey === key
                            ? "border-green-400 bg-green-500/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]"
                        }`}>
                        <span className="block text-sm font-bold">{plan.label}</span>
                        <span className="mt-1 block text-xs text-neutral-500">{plan.detail}</span>
                        <span className="mt-3 block text-xs font-semibold text-green-300">Fee {formatPercent(feePct / 100)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="mb-3 block text-sm font-semibold text-white">Select Duration</span>
                <div className="grid grid-cols-3 gap-3">
                  {durations.map((duration) => (
                    <button
                      key={duration.value}
                      type="button"
                      onClick={() => setDurationKey(duration.value)}
                      className={`h-12 rounded-xl border text-sm font-semibold transition ${
                        durationKey === duration.value
                          ? "border-green-400 bg-green-500/10 text-green-200"
                          : "border-white/10 bg-white/[0.03] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                      }`}>
                      {duration.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-3 block text-sm font-semibold text-white">Risk Level</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {Object.entries(risks).map(([key, risk]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRiskKey(key)}
                      className={`rounded-xl border p-4 text-left transition ${
                        riskKey === key
                          ? "border-green-400 bg-green-500/10 text-white"
                          : "border-white/10 bg-white/[0.03] text-neutral-300 hover:bg-white/[0.06]"
                      }`}>
                      <span className="block text-sm font-bold">{risk.label}</span>
                      <span className="mt-1 block text-xs text-neutral-500">{risk.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-green-500/20 bg-gradient-to-b from-green-500/10 to-[#0A0A0A] p-5 shadow-[0_0_50px_-10px_rgba(34,197,94,0.22)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-green-300">Estimated Result</p>
                <h2 className="text-xl font-semibold text-white">Live projection</h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-neutral-500">You Invested</p>
                <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(result.amount)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-neutral-500">Expected Profit</p>
                <p className="mt-1 text-2xl font-semibold text-green-300">+{formatCurrency(result.profit)}</p>
                <p className="mt-1 text-xs text-neutral-500">Expected return: {formatPercent(result.expectedReturn)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-neutral-500">Platform Fee ({formatPercent(result.plan.fee)})</p>
                <p className="mt-1 text-2xl font-semibold text-red-300">-{formatCurrency(result.fee)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-neutral-500">Net Profit</p>
                <p className="mt-1 text-2xl font-semibold text-green-300">+{formatCurrency(result.netProfit)}</p>
              </div>
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <p className="text-xs text-green-200/80">Final Balance</p>
                <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(result.finalBalance)}</p>
              </div>
            </div>

            <a
              href="/signup"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-black transition hover:bg-neutral-200 active:scale-[0.98]">
              Start Trading
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
              <p className="text-sm leading-relaxed text-neutral-400">
                Returns are estimates based on trading performance. Trading involves risk.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5">
          <CircleDollarSign className="h-6 w-6 text-green-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">User Flow</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Visit website, open profit calculator, enter investment, select plan, see profit, then decide to subscribe.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5">
          <Gauge className="h-6 w-6 text-green-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Calculation</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            Profit = Investment x Expected Return. Fee = Profit x Plan Fee. Net Profit = Profit - Fee.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5">
          <TrendingUp className="h-6 w-6 text-green-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Decision Trigger</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            A simple earnings preview removes confusion, shows transparency, and helps users choose a plan with confidence.
          </p>
        </div>
      </section>
    </main>
  );
}
