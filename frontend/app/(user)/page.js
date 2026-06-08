"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Handshake,
  Sparkles,
  Zap,
} from "lucide-react";
import { useAdminStore } from "../../hooks/adminStore";
import "../../app/globals.css"; // Ensure standard global CSS
import { apiFetch } from "../../lib/apiFetch";

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
  const isCurrent = plan.isCurrentPlan;

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

      <div className="mt-auto pt-8 w-full">
        {isCurrent ? (
          <button
            disabled
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-green-500/25 text-green-400 border border-green-500/30 text-sm font-bold cursor-not-allowed">
            Current Plan
            <Check className="h-4 w-4" />
          </button>
        ) : plan.href.startsWith("/signup") ? (
          <Link
            href={plan.href}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              plan.popular
                ? "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/10"
                : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            }`}>
            {plan.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            onClick={plan.onSelect}
            className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              plan.popular
                ? "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/10"
                : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            }`}>
            {plan.cta}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const storePlans = useAdminStore((s) => s.plans || []);
  const fetchPlans = useAdminStore((s) => s.fetchPlans);
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);
  const router = useRouter();
  const [activePlan, setActivePlan] = useState(null);
  const [trades, setTrades] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const handlePlanSelect = async (plan) => {
    const planId = plan.id;
    const minAmounts = { club: 10, individual: 1000, custom: 5000 };
    const planSlug = plan.slug || plan.name.split(" ")[0].toLowerCase();
    const amount = (plan.amount != null && Number(plan.amount) > 0)
      ? Number(plan.amount)
      : (minAmounts[planSlug] || 0);

    if (!currentUser) {
      router.push(`/signup?next=${encodeURIComponent(`/checkout?plan=${planSlug}`)}`);
      return;
    }
    try {
      const res = await apiFetch("/api/dashboard/initiate-payment", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, amount: amount, paymentGateway: "usdt", source: "Homepage - " + plan.name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.initiationId) {
          router.push(`/checkout?plan=${planSlug}&initId=${data.initiationId}`);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
    router.push(`/checkout?plan=${planSlug}`);
  };

  useEffect(() => {
    fetchPlans();
    fetchData();

    if (currentUser) {
      apiFetch("/api/user/subscription")
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.hasSubscription && data.subscription) {
              setActivePlan(data.subscription.planName);
            }
          }
        })
        .catch((err) => console.error("Error fetching subscription:", err));
    } else {
      setActivePlan(null);
    }
  }, [fetchPlans, fetchData, currentUser]);

  const activePlans = storePlans.filter((p) => p.isActive !== false);

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

    const planSlug = plan.slug || plan.name.split(" ")[0].toLowerCase();
    const href = currentUser
      ? `/checkout?plan=${planSlug}`
      : `/signup?next=${encodeURIComponent(`/checkout?plan=${planSlug}`)}`;

    const isCurrentPlan = activePlan && (activePlan === plan.name || activePlan.toLowerCase().includes(planSlug));

    return {
      ...plan,
      name: plan.name,
      tag: plan.subtitle,
      price: plan.capitalLabel,
      priceNote:
        plan.capitalLabel === "Custom Pricing" || plan.capitalLabel?.toLowerCase().includes("capital")
          ? ""
          : "capital",
      description: plan.desc,
      features: (plan.features || []).slice(0, 5),
      cta: plan.btnText || "Get Started",
      href,
      onSelect: () => handlePlanSelect(plan),
      icon,
      tone,
      popular: Boolean(plan.isPopular),
      isCurrentPlan: !!isCurrentPlan,
    };
  });

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await apiFetch("/api/trades/public");
        if (res.ok) {
          const data = await res.json();
          setTrades(data.trades || []);
          setIsSubscribed(data.isSubscribed || false);
        }
      } catch (e) {
        console.error("Failed to load public trades:", e);
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  useEffect(() => {
    // Scroll Animation Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>


      <div className="aura-background-component fixed top-0 w-full h-screen -z-10 opacity-50 brightness-75" data-alpha-mask="80"
        style={{ "display": "none", "maskImage": "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)", "WebkitMaskImage": "linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)" }}>
        <div className="aura-background-component top-0 w-full -z-10 absolute h-full">
          <div data-us-project="inzENTvhzS9plyop7Z6g" className="absolute w-full h-full left-0 top-0 -z-10"></div>

        </div>
      </div>


      <section className="overflow-hidden pt-32 pb-20 relative">

        <div
          className="-translate-x-1/2 blur-[100px] pointer-events-none -z-10 bg-green-900/20 w-[1000px] h-[400px] rounded-full absolute top-0 left-1/2"
        ></div>



        <div
          className="sm:px-6 lg:px-8 flex flex-col z-10 text-center max-w-7xl mr-auto ml-auto pr-6 pl-6 relative items-center">

          <div className="inline-flex animate-hero-element animate-badge mb-6 items-center">
            <div
              className="inline-flex gap-2 text-[11px] font-medium text-green-300 bg-green-500/10 border-green-500/20 border rounded-full pt-1 pr-3 pb-1 pl-3 backdrop-blur-sm gap-x-2 gap-y-2 items-center">
              Forex Auto Panel Report: Live market automation for modern traders</div>
          </div>


          <h1
            className="text-4xl sm:text-6xl lg:text-7xl leading-[1.1] animate-hero-element animate-title-1 font-medium text-white tracking-tighter mb-6">
            Automated Forex Trading <br className="hidden sm:block" /> <span className="text-[#ffffff]"><span
              className="text-green-300">Made Simple</span></span></h1>


          <p
            className="sm:text-lg leading-relaxed animate-hero-element animate-description text-base text-neutral-400 max-w-2xl mt-4 mr-auto ml-auto">
            Grow your capital through intelligent forex trading automation. Monitor performance in real time while our system executes trading strategies around the clock.</p>


          <div
            className="flex flex-col sm:flex-row gap-6 mt-10 gap-x-6 gap-y-6 items-center justify-center animate-hero-element animate-install">
            <a href="/dashboard"
              className="shiny-cta group overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 rounded-full relative shadow-2xl inline-block">


              <div className="z-10 flex gap-3 pt-1 pr-6 pb-1 pl-1 relative gap-x-3 gap-y-3 items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 group-hover:text-white transition-all duration-300 shadow-inner text-green-300 group-hover:bg-green-500 group-hover:border-green-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    className="transition-transform duration-300 group-hover:rotate-12">
                    <path
                      d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z">
                    </path>
                    <path d="M19 14v4"></path>
                    <path d="M21 16h-4"></path>
                  </svg>
                </div>
                <span
                  className="transition-colors group-hover:text-green-100 text-sm font-semibold text-white tracking-tight">Get Started</span>
              </div>
            </a>

            <a href="#pricing"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <span
                className="absolute inset-[-100%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_75%,#ffffff_100%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
              <span
                className="absolute inset-0 rounded-full bg-white/10 transition-opacity duration-300 group-hover:opacity-0"></span>
              <span
                className="flex items-center justify-center gap-2 transition-colors duration-300 group-hover:text-white text-sm font-medium text-neutral-400 bg-gradient-to-b from-neutral-900 to-black w-full h-full rounded-full pt-2.5 pr-5 pb-2.5 pl-5 relative shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">View Plans <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform duration-300 group-hover:translate-x-1">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg></span>
            </a>
          </div>


          <div className="animate-hero-element animate-terminal w-full max-w-5xl mt-20 mr-auto ml-auto relative">
            <div
              className="overflow-hidden sm:p-8 text-left bg-[#0A0A0A]/95 rounded-2xl ring-white/10 ring-1 pt-6 pr-6 pb-6 pl-6 relative backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(34,197,94,0.2)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center relative z-10">

                <div className="flex flex-col h-full justify-between">
                  <div className="">
                    <div
                      className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase mb-4 border-green-500/20 bg-green-500/10 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-400"></span>
                      Forex Auto Panel Platform
                    </div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl leading-[1.05] text-white tracking-tighter font-normal">
                      About Forex Auto Panel
                    </h2>
                    <div className="text-xs text-neutral-400 mt-4 leading-relaxed max-w-sm space-y-3">
                      <p>
                        Forex Auto Panel is an advanced automated forex trading platform designed to help users grow their capital through intelligent trading automation.
                      </p>
                      <p>
                        Our system operates 24/7, executing forex market strategies automatically while providing users with complete transparency, real-time portfolio monitoring, and scalable investment opportunities.
                      </p>
                      <p>
                        Whether you are a beginner or an experienced investor, Forex Auto Panel offers a simple and efficient way to participate in the forex market without requiring manual trading expertise.
                      </p>
                    </div>


                    <div className="mt-8 relative pl-2">

                      <div
                        className="absolute left-[11px] top-2 bottom-6 w-px bg-gradient-to-b to-transparent opacity-30 from-green-500 via-teal-500">
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {[
                          "Automated Forex Trading",
                          "Real-Time Portfolio Tracking",
                          "Secure Account Management",
                          "Instant Deposit Monitoring",
                          "Automated Profit Distribution",
                          "Multi-Level Referral Program",
                          "Scalable Investment Plans",
                          "24/7 Trading Operations",
                          "Professional Risk Management",
                          "Mobile & Desktop Accessibility"
                        ].map((feature) => (
                          <div key={feature} className="flex gap-3 items-center group cursor-default">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors border-green-500/30 bg-green-500/10 group-hover:border-green-400/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            </div>
                            <span className="text-xs font-semibold text-neutral-300 transition-colors group-hover:text-green-300">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 sm:mt-0 pt-4">
                    <a href="#"
                      className="inline-flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all active:scale-95 text-sm font-medium text-black bg-white rounded-full pt-2.5 pr-6 pb-2.5 pl-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                      Discover &rarr;
                    </a>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-3 sm:gap-4 relative h-full">

                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/5 group bg-neutral-900 animate-float-slow">
                    <img src="https://images.unsplash.com/photo-1640906152676-dace6710d24b?w=800&amp;q=80"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                      alt="Learning Interface" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-semibold font-mono border rounded pt-0.5 pr-2 pb-0.5 pl-2 backdrop-blur-md text-green-200 bg-green-500/20 border-green-500/30">
                          BINANCE
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          className="text-white/50 group-hover:text-white transition-colors">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                      <p
                        className="text-white text-sm font-medium mt-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        Binance execution
                      </p>
                    </div>
                  </div>


                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/5 group bg-neutral-900 mt-8 animate-float-medium delay-500">
                    <img src="https://images.unsplash.com/photo-1629946832022-c327f74956e0?w=800&amp;q=80"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                      alt="Code Analysis" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-mono font-semibold border px-2 py-0.5 rounded backdrop-blur-md text-teal-200 bg-teal-500/20 border-teal-500/30">
                          TRADINGVIEW
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          className="text-white/50 group-hover:text-white transition-colors">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                      <p
                        className="text-white text-sm font-medium mt-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        TradingView signals
                      </p>
                    </div>
                  </div>


                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/5 group bg-neutral-900 -mt-8 animate-float-slow delay-1000">
                    <img src="https://images.unsplash.com/photo-1724525647065-f948fc102e68?w=800&amp;q=80"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                      alt="Collaboration" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-mono font-semibold border px-2 py-0.5 rounded backdrop-blur-md text-lime-200 bg-lime-500/20 border-lime-500/30">
                          METATRADER
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          className="text-white/50 group-hover:text-white transition-colors">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                      <p
                        className="text-white text-sm font-medium mt-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        MetaTrader execution
                      </p>
                    </div>
                  </div>


                  <div
                    className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/5 group bg-neutral-900 animate-float-fast delay-1500">
                    <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&amp;q=80"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60 group-hover:opacity-100"
                      alt="Security Architecture" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[10px] font-mono font-semibold text-cyan-200 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded backdrop-blur-md">
                          KUCOIN
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2"
                          className="text-white/50 group-hover:text-white transition-colors">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </div>
                      <p
                        className="text-white text-sm font-medium mt-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        Fast execution
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>


      <section id="pricing" className="py-24 border-t border-white/5 bg-neutral-900/10">
        <div className="sm:px-6 lg:px-8 max-w-7xl mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center animate-on-scroll">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium font-geist border-green-500/30 bg-green-500/10 text-green-300">
              Pricing Plans
            </span>
            <h2 className="mt-6 text-4xl sm:text-5xl tracking-tight font-medium text-white font-geist">
              Simple pricing
            </h2>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto font-geist">
              Our pricing is clear and upfront. You only pay a flat platform fee on your deposit amount.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mt-16 mx-auto animate-on-scroll">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>


      <section className="bg-neutral-900/50 border-white/5 border-t pt-24 pb-24" id="integrations">
        <div className="sm:px-6 lg:px-8 max-w-7xl mr-auto ml-auto pr-4 pl-4">
          <div className="animate-on-scroll text-center animate">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] ring-1 uppercase tracking-tight font-medium bg-green-400/10 text-green-300 ring-green-300/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 22v-5"></path>
                <path d="M9 8V2"></path>
                <path d="M15 8V2"></path>
                <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>
              </svg>
              Infrastructure
            </span>
            <h2 className="sm:text-5xl text-4xl font-semibold text-white tracking-tight mt-6 mb-4">
              Built on powerful trading infrastructure
            </h2>
            <p className="text-base text-neutral-400 max-w-2xl mt-3 mr-auto ml-auto">
              Forex Auto Panel connects with leading platforms and APIs to ensure fast, reliable execution.
            </p>
          </div>

          <div className="animate-on-scroll max-w-4xl mt-16 mr-auto ml-auto relative">
            <div className="flex items-center justify-center gap-6 sm:gap-10 opacity-70">
              {[
                {
                  label: "Candlestick data",
                  path: (
                    <>
                      <path d="M6 3v18"></path>
                      <path d="M18 3v18"></path>
                      <rect x="4" y="7" width="4" height="8" rx="1"></rect>
                      <rect x="16" y="10" width="4" height="6" rx="1"></rect>
                    </>
                  )
                },
                {
                  label: "Market signals",
                  path: (
                    <>
                      <path d="M3 17l5-5 4 4 8-9"></path>
                      <path d="M14 7h6v6"></path>
                      <path d="M4 21h16"></path>
                    </>
                  )
                },
                {
                  label: "Trading bot",
                  path: (
                    <>
                      <rect x="5" y="8" width="14" height="10" rx="2"></rect>
                      <path d="M12 8V4"></path>
                      <path d="M9 4h6"></path>
                      <path d="M9 13h.01"></path>
                      <path d="M15 13h.01"></path>
                      <path d="M10 17h4"></path>
                    </>
                  )
                },
                {
                  label: "API execution",
                  path: (
                    <>
                      <path d="M7 7h10v10H7z"></path>
                      <path d="M3 12h4"></path>
                      <path d="M17 12h4"></path>
                      <path d="M12 3v4"></path>
                      <path d="M12 17v4"></path>
                    </>
                  )
                },
                {
                  label: "Exchange data",
                  path: (
                    <>
                      <ellipse cx="12" cy="5" rx="8" ry="3"></ellipse>
                      <path d="M4 5v10c0 1.7 3.6 3 8 3s8-1.3 8-3V5"></path>
                      <path d="M4 10c0 1.7 3.6 3 8 3s8-1.3 8-3"></path>
                    </>
                  )
                },
              ].map((item) => (
                <span
                  key={item.label}
                  title={item.label}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10 transition-colors hover:bg-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className="text-white">
                    {item.path}
                  </svg>
                </span>
              ))}
            </div>

            <div className="h-64 mt-12 relative">
              <svg viewBox="0 0 900 360" className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[896px] h-full"
                fill="none" strokeWidth="2" data-icon-replaced="true" style={{ "color": "rgb(255, 255, 255)" }}>

                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"></feGaussianBlur>
                    <feMerge>
                      <feMergeNode in="coloredBlur"></feMergeNode>
                      <feMergeNode in="SourceGraphic"></feMergeNode>
                    </feMerge>
                  </filter>
                </defs>

                <path d="M450 300 C 450 200, 300 120, 150 30" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"
                  fill="none" style={{ "strokeDasharray": "600", "strokeDashoffset": "600", "opacity": "0.3" }}>
                  <animate attributeName="stroke-dashoffset" values="600;0;600" dur="4s" begin="0s" repeatCount="indefinite"
                    calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"></animate>
                </path>
                <path d="M450 300 C 450 210, 360 130, 270 30" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"
                  fill="none" style={{ "strokeDasharray": "520", "strokeDashoffset": "520", "opacity": "0.3" }}>
                  <animate attributeName="stroke-dashoffset" values="520;0;520" dur="4s" begin="0.2s"
                    repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"></animate>
                </path>
                <path d="M450 300 C 450 150, 420 80, 390 30" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"
                  fill="none" style={{ "strokeDasharray": "450", "strokeDashoffset": "450", "opacity": "0.3" }}>
                  <animate attributeName="stroke-dashoffset" values="450;0;450" dur="4s" begin="0.4s"
                    repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"></animate>
                </path>
                <path d="M450 300 C 450 150, 480 80, 510 30" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"
                  fill="none" style={{ "strokeDasharray": "450", "strokeDashoffset": "450", "opacity": "0.3" }}>
                  <animate attributeName="stroke-dashoffset" values="450;0;450" dur="4s" begin="0.6s"
                    repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"></animate>
                </path>
                <path d="M450 300 C 450 210, 540 130, 630 30" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"
                  fill="none" style={{ "strokeDasharray": "520", "strokeDashoffset": "520", "opacity": "0.3" }} className="">
                  <animate attributeName="stroke-dashoffset" values="520;0;520" dur="4s" begin="0.8s"
                    repeatCount="indefinite" calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"></animate>
                </path>
                <path d="M450 300 C 450 200, 600 120, 750 30" stroke="#22c55e" strokeWidth="1" strokeLinecap="round"
                  fill="none" style={{ "strokeDasharray": "600", "strokeDashoffset": "600", "opacity": "0.3" }}>
                  <animate attributeName="stroke-dashoffset" values="600;0;600" dur="4s" begin="1s" repeatCount="indefinite"
                    calcMode="spline" keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"></animate>
                </path>


                <circle cx="150" cy="30" r="3" fill="#22c55e" filter="url(#glow)">
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite"></animate>
                </circle>
                <circle cx="750" cy="30" r="3" fill="#22c55e" filter="url(#glow)">
                  <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="1s" repeatCount="indefinite">
                  </animate>
                </circle>
              </svg>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span
                  className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 ring-1 z-10 relative ring-green-300/40">
                  <div className="absolute inset-0 blur-xl rounded-full bg-green-400/10"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="relative z-10 text-green-300">
                    <path
                      d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z">
                    </path>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="max-w-7xl mr-auto ml-auto pt-24 pr-6 pb-24 pl-6" id="courses">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
            Intelligent automation
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto">
            Advanced trading automation designed for every market condition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-on-scroll">
          <div
            className="group border-gradient relative rounded-2xl bg-neutral-900/40 p-1 hover:bg-neutral-900/60 transition-colors">
            <div className="relative h-48 rounded-xl overflow-hidden mb-4">
              <img
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4734259a-bad7-422f-981e-ce01e79184f2_800w.jpg"
                alt="Trend following automation" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div
                className="absolute top-3 left-3 bg-black/50 backdrop-blur text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-widest text-white">
                TREND
              </div>
            </div>
            <div className="px-2 pb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Trend Following</h3>
              <p className="text-sm text-neutral-400 mb-4 line-clamp-2">Trade with the direction of the market.</p>
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                <span>4h 20m</span>
                <span>12 Lessons</span>
              </div>
            </div>
          </div>

          <div
            className="group border-gradient relative rounded-2xl bg-neutral-900/40 p-1 hover:bg-neutral-900/60 transition-colors">
            <div className="relative h-48 rounded-xl overflow-hidden mb-4">
              <img
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/935f6f80-259a-48b3-bf46-64c87caac384_800w.jpg"
                alt="Fast execution automation" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div
                className="absolute top-3 left-3 bg-black/50 backdrop-blur text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-widest text-white">
                SCALP
              </div>
            </div>
            <div className="px-2 pb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Fast execution</h3>
              <p className="text-sm text-neutral-400 mb-4 line-clamp-2">Capture small price movements quickly.</p>
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                <span>6h 15m</span>
                <span>18 Lessons</span>
              </div>
            </div>
          </div>

          <div
            className="group border-gradient relative rounded-2xl bg-neutral-900/40 p-1 hover:bg-neutral-900/60 transition-colors">
            <div className="relative h-48 rounded-xl overflow-hidden mb-4">
              <img
                src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5efdef5c-e838-47d4-8b8c-b504146ec86e_800w.webp"
                alt="Breakout automation" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div
                className="absolute top-3 left-3 bg-black/50 backdrop-blur text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase tracking-widest text-white">
                BREAKOUT
              </div>
            </div>
            <div className="px-2 pb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Breakout</h3>
              <p className="text-sm text-neutral-400 mb-4 line-clamp-2">Enter trades at key breakout levels.</p>
              <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium">
                <span>5h 30m</span>
                <span>14 Lessons</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="past-trades" className="py-24 border-t border-white/5 bg-neutral-900/30">
        <div className="sm:px-6 lg:px-8 max-w-7xl mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center animate-on-scroll">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium font-geist border-green-500/30 bg-green-500/10 text-green-300">
              Past Trades
            </span>
            <h2 className="mt-6 text-4xl sm:text-5xl tracking-tight font-medium text-white font-geist">
              Recent trade performance
            </h2>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto font-geist">
              Review recent automated entries, exits, and results from Forex Auto Panel execution.
            </p>
          </div>

          <div className="mt-16 animate-on-scroll overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]/95 shadow-[0_0_50px_-10px_rgba(34,197,94,0.16)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Execution log</p>
                <h3 className="mt-1 text-xl font-semibold text-white">Past Trades</h3>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                Updated live
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-white/[0.03] text-[11px] uppercase tracking-widest text-neutral-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Pair</th>
                    <th className="px-5 py-4 font-semibold">Side</th>
                    <th className="px-5 py-4 font-semibold">Entry</th>
                    <th className="px-5 py-4 font-semibold">Exit</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Result</th>
                    <th className="px-5 py-4 text-right font-semibold">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {trades.slice(0, 10).map((trade) => {
                    const isWin = trade.result?.toUpperCase() === "WIN";
                    const isBuy = trade.side === "BUY";

                    return (
                      <tr key={trade.id} className="transition-colors hover:bg-white/[0.03]">
                        <td className="px-5 py-4 font-semibold text-white">{trade.pair}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-bold ${isBuy ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-neutral-300">${Number(trade.entryPrice).toLocaleString("en-US")}</td>
                        <td className="px-5 py-4 font-mono text-neutral-300">${Number(trade.exitPrice).toLocaleString("en-US")}</td>
                        <td className="px-5 py-4 text-neutral-400">{trade.tradeDate ? new Date(trade.tradeDate).toLocaleDateString("en-US") : "N/A"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-xs font-bold ${isWin ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                            {trade.result}
                          </span>
                        </td>
                        <td className={`px-5 py-4 text-right font-mono font-semibold ${isWin ? "text-green-300" : "text-red-300"}`}>
                          {trade.profitLoss >= 0 ? `+$${trade.profitLoss.toLocaleString("en-US")}` : `-$${Math.abs(trade.profitLoss).toLocaleString("en-US")}`}
                        </td>
                      </tr>
                    );
                  })}
                  {trades.length === 0 && !loading && (
                    <tr>
                      <td colSpan="7" className="px-5 py-8 text-center text-sm text-neutral-500">No published trade records found.</td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="7" className="px-5 py-8 text-center text-sm text-neutral-500">Loading trade records...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <a
              href={isSubscribed ? "/past-trades" : "#pricing"}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-6 py-3 text-sm font-semibold text-green-300 transition-colors hover:bg-green-500 hover:text-black">
              View All
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </section>


      <section id="dashboard" className="py-24 border-t border-white/5 bg-neutral-900/20">
        <div className="sm:px-6 lg:px-8 max-w-7xl mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center animate-on-scroll">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium font-geist border-green-500/30 bg-green-500/10 text-green-300">
              Analytics
            </span>
            <h2 className="mt-6 text-4xl sm:text-5xl tracking-tight font-medium text-white font-geist">
              Your trading dashboard
            </h2>
            <p className="mt-4 text-lg text-neutral-400 max-w-2xl mx-auto font-geist">
              Track your trades, monitor performance, and manage your account in real time.
            </p>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-on-scroll">


            <div
              className="group border-gradient relative rounded-2xl bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition-colors flex flex-col justify-between h-64 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest">
                    Account Overview
                  </span>
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                </div>
                <div className="mt-6">
                  <span className="text-xs text-neutral-400 block mb-1">Total Balance</span>
                  <h3 className="text-3xl font-semibold text-white tracking-tight font-geist">
                    $12,450.80
                  </h3>
                </div>
              </div>
              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-xs">
                <span className="text-neutral-400">Plan: <strong className="text-green-300 font-medium">Individual</strong></span>
                <span className="text-neutral-400">Status: <strong className="text-green-300 font-medium">Active</strong></span>
              </div>
            </div>


            <div
              className="group border-gradient relative rounded-2xl bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition-colors flex flex-col justify-between h-64 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest">
                    Recent Trades
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" className="text-neutral-500">
                    <path d="M12 20V4M5 11l7-7 7 7"></path>
                  </svg>
                </div>

                <div className="flex flex-col gap-3">

                  <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      <span className="text-white font-medium">BTC/USDT</span>
                    </div>
                    <span className="text-green-300 font-semibold font-mono">+$124.50</span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-white/5 rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      <span className="text-white font-medium">ETH/USDT</span>
                    </div>
                    <span className="text-green-300 font-semibold font-mono">+$85.20</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-center text-neutral-400 border-t border-white/5 pt-3">
                Real-time API executions
              </div>
            </div>


            <div
              className="group border-gradient relative rounded-2xl bg-neutral-900/40 p-6 hover:bg-neutral-900/60 transition-colors flex flex-col justify-between h-64 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-widest">
                    Profit &amp; Analytics
                  </span>
                  <span className="text-green-300 text-xs font-bold font-mono">+12.4%</span>
                </div>


                <div className="h-24 w-full flex items-end">
                  <svg viewBox="0 0 200 80" className="w-full h-full text-green-400 overflow-visible" fill="none">

                    <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="60" x2="200" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />


                    <path d="M 0,70 Q 25,60 50,55 T 100,35 T 150,25 T 200,10" stroke="var(--primary)" strokeWidth="3"
                      strokeLinecap="round" />


                    <path d="M 0,70 Q 25,60 50,55 T 100,35 T 150,25 T 200,10 L 200,80 L 0,80 Z" fill="url(#chartGrad)"
                      opacity="0.15" />

                    <defs>
                      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              <div className="text-xs text-neutral-400 border-t border-white/5 pt-3 flex items-center justify-between">
                <span>Growth trend (30d)</span>
                <span className="text-green-300">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="white-label" className="py-24 border-t border-white/5 bg-neutral-900/30">
        <div className="sm:px-6 lg:px-8 max-w-7xl mx-auto px-4">
          
          {/* Partnerships Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex gap-2 text-xs font-semibold text-green-300 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 backdrop-blur-sm items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400 mr-0.5"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4-4a1 1 0 0 0 0-1.4l-2-2"/><path d="m13 11-2-2a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 0 1.4l2 2"/><path d="m15 9-3-3a2 2 0 0 0-2.8 0L5 10.2a2 2 0 0 0 0 2.8l3 3"/></svg>
              Partnerships
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="mx-auto max-w-4xl text-center animate-on-scroll">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white font-geist">
              White Label <span className="text-green-400">Solutions</span>
            </h2>
            <div className="w-16 h-0.5 bg-green-500 mx-auto mt-4"></div>
            <p className="mt-6 text-base text-neutral-400 max-w-3xl mx-auto font-geist leading-relaxed">
              Launch your own branded trading platform with our White Label solution.
              Customize the platform with your logo, domain, branding, and business
              requirements while leveraging our secure and scalable trading infrastructure.
            </p>
          </div>

          {/* 5 Column Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-16 max-w-7xl mx-auto animate-on-scroll">
            {[
              {
                title: "Custom Branding",
                desc: "Fully customize the platform with your logo, themes, and personalized styling.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="m15 5 3 3"/></svg>
                )
              },
              {
                title: "Dedicated Domain",
                desc: "Use your own custom domain to establish your brand identity.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                )
              },
              {
                title: "Secure Infrastructure",
                desc: "Leverage our robust and secure trading infrastructure built for high performance.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6Z"/><path d="m9 12 2 2 4-4"/></svg>
                )
              },
              {
                title: "User & Fund Management",
                desc: "Complete control over users, roles, permissions and fund management.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                )
              },
              {
                title: "Technical Support",
                desc: "24/7 dedicated developers and operations support to grow with your business.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/></svg>
                )
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group border border-white/5 border-b-2 border-b-green-500/40 hover:border-b-green-400 relative rounded-2xl bg-neutral-900/40 p-6 pt-8 pb-8 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col justify-between shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(34,197,94,0.05)] text-center"
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4 text-green-400 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h4 className="text-sm font-semibold text-white tracking-tight">
                    {feature.title}
                  </h4>
                  <div className="w-8 h-px bg-green-500/30 mx-auto my-3 group-hover:w-12 transition-all duration-300"></div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-normal">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Banner CTA */}
          <div className="mt-16 max-w-5xl mx-auto px-4 animate-on-scroll">
            <div className="bg-[#0A0A0A]/80 border border-white/[0.06] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_30px_rgba(34,197,94,0.05)]">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 flex-shrink-0 animate-bounce-slow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white">Ready to build your brand?</h4>
                  <p className="text-sm text-neutral-400 mt-1">Let's create a powerful trading platform under your brand.</p>
                </div>
              </div>
              <a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3.5 transition-all active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] flex-shrink-0"
              >
                Contact Us
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
          </div>

        </div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20 quoteRevealSection animate-on-scroll"
        style={{ "--reveal": "100%" }}>
        <div className="relative overflow-hidden p-8 sm:p-12 ring-white/10 ring-1 bg-neutral-900 rounded-[2.5rem]">
          <div className="flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-wider uppercase border-green-500/20 bg-green-500/10 text-green-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
                stroke="none" className="w-3 h-3">
                <polygon
                  points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                </polygon>
              </svg>
              Trusted by traders
            </span>
          </div>

          <div className="relative mt-8 sm:mt-10 quoteReveal">
            <blockquote className="mx-auto max-w-5xl text-center text-3xl font-medium leading-tight tracking-tight text-white sm:text-5xl sm:leading-[1.08] lg:text-6xl">
              &quot;Forex Auto Panel made trading simple and automated.&quot;
            </blockquote>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:mt-12 sm:flex-row sm:gap-4 sm:text-left">
            <img alt="Author avatar"
              className="h-12 w-12 shrink-0 ring-2 ring-white/10 object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-300"
              src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/d09b944c-c71d-4c2c-9c16-e6e662b4a9d2_320w.webp" />
            <div className="min-w-0">
              <span className="block text-white font-semibold text-sm">
                &mdash; Harsh
              </span>
              <span className="block text-neutral-500 text-xs">
                Forex Auto Panel User
              </span>
            </div>
          </div>


          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-white/5 blur-[100px] pointer-events-none rounded-full">
          </div>
        </div>
      </section>


      <section
        className="sm:px-6 lg:px-8 md:py-20 animate-on-scroll w-full max-w-7xl border-white/5 border-t mr-auto ml-auto pt-14 pr-4 pb-14 pl-4">
        <div className="relative pt-20">
          <div className="flex items-center justify-center">
            <span
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wide border rounded-full px-3 py-1 text-neutral-300/80 bg-white/5 border-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="lucide lucide-rocket h-3.5 w-3.5 text-green-300">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z">
                </path>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
              </svg>
              Start growing your capital
            </span>
          </div>

          <div className="text-center max-w-3xl mt-6 mr-auto ml-auto">
            <h2 className="md:text-6xl text-4xl font-semibold text-white tracking-tight">
              Start growing your capital
            </h2>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-white mt-1">
              Join Forex Auto Panel and experience automated trading built for modern investors.
            </h2>
            <p className="mt-4 text-base md:text-lg text-neutral-400">
              Join Forex Auto Panel and experience automated trading built for modern investors.
            </p>


            <div className="relative inline-block group mt-8">
              <button
                className="z-10 overflow-hidden transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-green-500/50 text-white bg-[#0A0A0A] border-white/20 border rounded-xl pt-3 pr-8 pb-3 pl-8 relative hover:shadow-[0_0_30px_rgba(34,197,94,0.3)] shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                <span className="relative z-10 inline-flex items-center gap-2 font-semibold">
                  Get Started
                  <svg className="h-5 w-5 transition-transform duration-200 ease-out group-hover:translate-x-1" fill="none"
                    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7"></path>
                  </svg>
                </span>
                <span
                  className="pointer-events-none absolute bottom-0 left-1/2 right-1/2 h-px bg-gradient-to-r from-transparent to-transparent opacity-80 transition-[left,right] duration-500 ease-out group-hover:left-0 group-hover:right-0 via-green-400"></span>
              </button>
              <span aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 h-8 w-40 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                style={{ "background": "radial-gradient(60% 100% at 50% 50%, rgba(34,197,94,0.6), rgba(34,197,94,0.3) 35%, transparent 70%)", "filter": "blur(12px)" }}></span>
            </div>


            <div className="mt-8 flex items-center justify-center gap-6 text-neutral-400">
              <a href="mailto:hello@forex-auto-panel.com" className="group hover:text-white transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-mail h-4 w-4 transition-colors text-green-400 group-hover:text-green-300">
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
                hello@forex-auto-panel.com
              </a>
            </div>


            <div className="relative mt-16">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-6">
                <span className="block mx-auto w-80 h-10 rounded-full blur-2xl opacity-70 bg-green-500/10"></span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>
          </div>
        </div>

      </section>




    </>
  );
}
