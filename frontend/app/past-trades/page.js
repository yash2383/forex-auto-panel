import {
  Bot,
  ChartNoAxesCombined,
  Clock3,
  Download,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { pastTrades } from "../data/pastTrades";

export const metadata = {
  title: "Past Trades - Tradebot",
  description: "Review recent automated entries, exits, and results from Tradebot execution.",
};

const heroStats = [
  {
    label: "Total PnL",
    value: "+$24,650.75",
    detail: "+18.4% this month",
    align: "left",
  },
  {
    label: "Win Rate",
    value: "72.91%",
    detail: "+5.8% this month",
    align: "right",
  },
];

const pillars = [
  {
    icon: Sparkles,
    title: "AI-Powered Trading",
    text: "Advanced algorithms analyze market trends in real-time.",
  },
  {
    icon: Clock3,
    title: "24/7 Automation",
    text: "Trading runs automatically day and night.",
  },
  {
    icon: ShieldCheck,
    title: "Risk Managed",
    text: "Built-in risk management protects your capital.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Proven Results",
    text: "Backtested automation with consistent performance.",
  },
];

const whyChoose = [
  {
    icon: Bot,
    title: "Advanced AI",
    text: "Machine learning algorithms analyze millions of data points to find the best opportunities.",
  },
  {
    icon: Target,
    title: "Real-time Execution",
    text: "Lightning-fast trade execution ensures you never miss profitable opportunities.",
  },
  {
    icon: SlidersHorizontal,
    title: "Transparent Results",
    text: "100% transparent performance tracking with verified results and detailed analytics.",
  },
  {
    icon: LockKeyhole,
    title: "Secure & Reliable",
    text: "Bank-level security with 99.9% uptime. Your capital is always protected.",
  },
];

const parsePrice = (value) => Number(String(value).replace(/,/g, ""));

const formatPrice = (value, fallback) => {
  if (!Number.isFinite(value)) return fallback;
  return value >= 100 ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toFixed(5);
};

const formatPoints = (value) => {
  if (!Number.isFinite(value)) return "0.0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
};

const enrichedTrades = pastTrades.map((trade, index) => {
  const entry = parsePrice(trade.entry);
  const exit = parsePrice(trade.exit);
  const isBuy = trade.side === "BUY";
  const isWin = trade.result === "WIN";
  const movement = Math.abs(exit - entry);
  const target = isBuy ? entry + movement * 1.4 : entry - movement * 1.4;
  const stopLoss = isBuy ? entry - movement * 0.8 : entry + movement * 0.8;
  const breakeven = isBuy ? entry + movement * 0.25 : entry - movement * 0.25;
  const points = Math.abs(exit - entry) * (entry > 1000 ? 10 : entry > 100 ? 100 : 10000);

  return {
    ...trade,
    target: formatPrice(target, trade.exit),
    stopLoss: formatPrice(stopLoss, trade.entry),
    breakeven: formatPrice(breakeven, trade.entry),
    points: `${isWin ? "" : "-"}${formatPoints(points)}`,
    qty: index === 3 ? "0.10" : "1.00",
  };
});

const MiniChart = ({ positive = true }) => (
  <svg viewBox="0 0 120 42" className={`mt-3 h-10 w-full ${positive ? "text-green-400" : "text-red-400"}`} fill="none">
    <path d="M2 34 C18 28, 24 35, 38 25 S62 12, 76 18 S96 27, 118 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M2 40 C18 32, 24 38, 38 28 S62 16, 76 22 S96 30, 118 12 L118 42 L2 42 Z" fill="currentColor" opacity="0.12" />
  </svg>
);

export default function PastTradesPage() {
  return (
    <main className="min-h-screen bg-[#020505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[28px] border border-white/5 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),transparent_42%)] px-4 py-12 sm:px-8 lg:px-12">
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:34px_34px]"></div>
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 text-[11px] font-bold text-green-300">
              Automated Trading - Smart Execution - Real Results
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Your Trading Works <span className="text-green-400">Automated. Intelligent. Profitable.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-neutral-400">
              Tradebot is an intelligent automated trading system that analyzes the market 24/7 and executes high-probability trades for consistent results.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/signup" className="inline-flex h-12 items-center rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-300 active:scale-[0.98]">
                Get Started
              </a>
              <a href="#recent-trades" className="inline-flex h-12 items-center rounded-full border border-white/15 bg-black/40 px-6 text-sm font-bold text-white transition hover:bg-white/10">
                View Performance
              </a>
            </div>
          </div>

          <div className="relative mt-10 grid gap-4 lg:absolute lg:inset-x-6 lg:top-20 lg:mt-0 lg:grid-cols-2">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border border-white/10 bg-[#0B1110]/95 p-4 shadow-[0_0_30px_-18px_rgba(34,197,94,0.45)] lg:w-40 ${
                  stat.align === "right" ? "lg:ml-auto" : ""
                }`}>
                <p className="text-[11px] font-semibold text-neutral-500">{stat.label}</p>
                <p className="mt-1 text-xl font-bold text-green-300">{stat.value}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{stat.detail}</p>
                <MiniChart />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 rounded-xl border border-white/10 bg-[#0B1110]/95 p-4 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex gap-3 rounded-lg p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-300">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">{pillar.title}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">{pillar.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <section id="recent-trades" className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#0B1110]/95 shadow-[0_0_45px_-24px_rgba(34,197,94,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Recent Trades</h2>
              <p className="mt-1 text-xs text-neutral-500">Real-time trades executed by Tradebot</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href="/past-trades" className="inline-flex h-9 items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-bold text-white">
                View All Trades
              </a>
              <div className="hidden h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-neutral-500 sm:inline-flex">
                <Search className="h-3.5 w-3.5" />
                Search trades...
              </div>
              <button type="button" className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-xs font-bold text-white">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </button>
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white" aria-label="Download trades">
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Stock</th>
                  <th className="px-5 py-4 font-semibold">Type</th>
                  <th className="px-5 py-4 font-semibold">Entry</th>
                  <th className="px-5 py-4 font-semibold">Exit</th>
                  <th className="px-5 py-4 font-semibold">Target</th>
                  <th className="px-5 py-4 font-semibold">Stop Loss</th>
                  <th className="px-5 py-4 font-semibold">Breakeven</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Result</th>
                  <th className="px-5 py-4 text-right font-semibold">Points</th>
                  <th className="px-5 py-4 text-right font-semibold">Qty</th>
                  <th className="px-5 py-4 text-right font-semibold">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {enrichedTrades.map((trade) => {
                  const isWin = trade.result === "WIN";
                  const isBuy = trade.side === "BUY";

                  return (
                    <tr key={`${trade.symbol}-${trade.date}-${trade.pnl}`} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-4 font-semibold text-white">{trade.symbol}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-[11px] font-black ${isBuy ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{trade.entry}</td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{trade.exit}</td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{trade.target}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-red-300">{trade.stopLoss}</td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{trade.breakeven}</td>
                      <td className="px-5 py-4 text-xs text-neutral-400">
                        <span className="block">{trade.date}</span>
                        <span className="text-neutral-600">10:45 AM</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-[11px] font-black ${isWin ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                          {trade.result}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-right font-mono font-semibold ${isWin ? "text-green-300" : "text-red-300"}`}>
                        {trade.points}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-neutral-300">{trade.qty}</td>
                      <td className={`px-5 py-4 text-right font-mono font-bold ${isWin ? "text-green-300" : "text-red-300"}`}>
                        {trade.pnl}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-xs text-neutral-500">
            <span>Showing 1 to {enrichedTrades.length} of {enrichedTrades.length} trades</span>
            <div className="flex items-center gap-1">
              {["1", "2", "3", "...", "6"].map((item) => (
                <span key={item} className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 ${item === "1" ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-white/10 bg-white/[0.03] text-neutral-500"}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-[#0B1110]/95 p-5 sm:p-7">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Why Choose Tradebot?</h2>
            <p className="mt-2 text-sm text-neutral-500">Everything you need to trade smarter and grow faster</p>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-green-500/20 bg-green-500/10 text-green-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl border border-green-500/10 bg-[linear-gradient(135deg,rgba(34,197,94,0.12),rgba(11,17,16,0.98)_52%,rgba(3,8,7,0.98))] p-8 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Ready to Start Your Trading Journey?</h2>
            <p className="mt-3 text-sm text-neutral-400">Join thousands of traders who trust Tradebot for automated trading success.</p>
            <a href="/signup" className="mt-6 inline-flex h-12 items-center rounded-full bg-green-500 px-7 text-sm font-bold text-black transition hover:bg-green-300 active:scale-[0.98]">
              Get Started Now
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
