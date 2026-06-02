"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChartNoAxesCombined,
  Check,
  CircleDollarSign,
  Handshake,
  ShieldAlert,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAdminStore } from "../../../hooks/adminStore";

const comparisonRows = [
  ["Capital Range", "$10-$100", "$1000+", "Flexible"],
  ["Profit Fee", "5%", "4%", "Custom"],
  ["Trading Access", "Basic", "Advanced", "Full"],
  ["Execution Speed", "Standard", "Priority", "Ultra"],
  ["Support", "Basic", "Priority", "Dedicated"],
];

const toneClasses = {
  green: {
    badge: "border-green-500/30 bg-green-500/10 text-green-300",
    icon: "border-green-500/20 bg-green-500/10 text-green-300",
    glow: "shadow-[0_0_50px_-18px_rgba(34,197,94,0.55)]",
  },
  violet: {
    badge: "border-violet-500/30 bg-violet-500/10 text-violet-200",
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-200",
    glow: "shadow-[0_0_58px_-18px_rgba(139,92,246,0.62)]",
  },
  cyan: {
    badge: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
    icon: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    glow: "shadow-[0_0_52px_-18px_rgba(34,211,238,0.48)]",
  },
};

function PlanCard({ plan }) {
  const Icon = plan.icon;
  const tone = toneClasses[plan.tone];

  return (
    <article
      className={`border-gradient relative flex h-full flex-col rounded-2xl bg-neutral-900/45 p-6 transition-colors hover:bg-neutral-900/65 sm:p-7 ${tone.glow}`}>
      {plan.popular && (
        <span className="absolute -top-3 right-5 inline-flex items-center gap-1 rounded-full bg-green-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-black shadow-md">
          <Sparkles className="h-3 w-3" />
          Most Popular
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${tone.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${tone.badge}`}>
          {plan.tag}
        </span>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white">{plan.name}</h2>
        <div className="mt-5 flex flex-wrap items-end gap-x-2 gap-y-1 text-white">
          <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
          {plan.priceNote && <span className="pb-1 text-xs font-medium text-neutral-500">{plan.priceNote}</span>}
        </div>
        <p className="mt-4 min-h-20 text-sm leading-relaxed text-neutral-400">{plan.description}</p>
      </div>

      <ul className="mt-6 grid gap-3 border-t border-white/5 pt-6 text-sm text-neutral-300">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={plan.href}
        className={`mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition active:scale-[0.98] ${
          plan.popular
            ? "bg-white text-black hover:bg-neutral-200"
            : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
        }`}>
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export default function PricingPage() {
  const storePlans = useAdminStore((s) => s.plans || []);
  const fetchPlans = useAdminStore((s) => s.fetchPlans);
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);

  useEffect(() => {
    fetchPlans();
    fetchData();
  }, [fetchPlans, fetchData]);

  const activePlans = storePlans.filter((p) => p.status === "Active");

  const plans = activePlans.map((plan, index) => {
    let icon = CircleDollarSign;
    let tone = "green";
    if (index === 1) {
      icon = Zap;
      tone = "violet";
    } else if (index > 1) {
      icon = Handshake;
      tone = "cyan";
    }

    const planSlug = plan.name.split(" ")[0].toLowerCase();
    const href = currentUser
      ? `/checkout?plan=${planSlug}`
      : `/signup?next=${encodeURIComponent(`/checkout?plan=${planSlug}`)}`;

    return {
      name: plan.name,
      tag: plan.subtitle,
      price: plan.capitalLabel,
      priceNote: plan.capitalLabel === "Custom Pricing" ? "" : "capital",
      description: plan.desc,
      features: plan.features || [],
      cta: plan.btnText || "Get Started",
      href,
      icon,
      tone,
      popular: Boolean(plan.isPopular),
    };
  });

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/95 px-5 py-12 shadow-[0_0_70px_-28px_rgba(34,197,94,0.65)] sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[760px] -translate-x-1/2 rounded-full bg-green-500/10 blur-[90px]"></div>
          <div className="relative mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
              <BadgeCheck className="h-3.5 w-3.5" />
              Simple, Transparent Pricing
            </span>
            <h1 className="mt-6 text-4xl font-medium tracking-tight text-white sm:text-6xl">
              Choose a plan that fits your capital and trading goals.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
              Our pricing is performance-based. You only pay a small fee on profits.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-2xl border border-green-500/20 bg-gradient-to-b from-green-500/10 to-[#0A0A0A] p-6 shadow-[0_0_50px_-18px_rgba(34,197,94,0.55)] sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 text-green-300">
              <ChartNoAxesCombined className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-green-300">How Pricing Works</p>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Performance-Based Model</h2>
            </div>
          </div>
          <p className="mt-5 text-lg font-semibold text-white">You only pay when you earn.</p>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm font-semibold text-neutral-200">
            Profit <span className="text-green-300">&rarr;</span> Small % Fee <span className="text-green-300">&rarr;</span> You keep the rest
          </div>
          <div className="mt-5 grid gap-3 text-sm text-neutral-300">
            {["No upfront hidden charges", "No fixed monthly cost", "Fully transparent system"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-green-300" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/95">
          <div className="border-b border-white/10 px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Comparison</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">Plan details at a glance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Feature</th>
                  <th className="px-5 py-4 font-semibold">Club Plan</th>
                  <th className="px-5 py-4 font-semibold">Individual</th>
                  <th className="px-5 py-4 font-semibold">Custom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {comparisonRows.map(([feature, club, individual, custom]) => (
                  <tr key={feature} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-semibold text-white">{feature}</td>
                    <td className="px-5 py-4 text-neutral-300">{club}</td>
                    <td className="px-5 py-4 text-green-300">{individual}</td>
                    <td className="px-5 py-4 text-cyan-200">{custom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl rounded-2xl border border-white/10 bg-neutral-900/40 p-6 text-center sm:p-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
          <Sparkles className="h-3.5 w-3.5" />
          Start Growing Your Capital
        </span>
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Join Tradebot and experience automated trading built for modern investors.
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={currentUser ? "/dashboard" : "/signup"} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-black transition hover:bg-neutral-200 sm:w-auto">
            Start Trading
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/past-trades" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-green-500/40 bg-green-500/10 px-6 text-sm font-bold text-green-200 transition hover:bg-green-500 hover:text-black sm:w-auto">
            View Performance
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-5 max-w-7xl rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
          <p className="text-sm leading-relaxed text-neutral-400">
            Trading involves financial risk. Returns are based on market conditions and trading performance. Always invest responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}
