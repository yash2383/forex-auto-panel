"use client";

import { useEffect, useState, useMemo } from "react";
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
import { apiFetch } from "../../../lib/apiFetch";

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

const formatPrice = (value, fallback) => {
  if (value === undefined || value === null || !Number.isFinite(value)) return fallback;
  return value >= 100 ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toFixed(5);
};

const formatPoints = (value) => {
  if (!Number.isFinite(value)) return "0.0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
};

const MiniChart = ({ positive = true }) => (
  <svg viewBox="0 0 120 42" className={`mt-3 h-10 w-full ${positive ? "text-green-400" : "text-red-400"}`} fill="none">
    <path d="M2 34 C18 28, 24 35, 38 25 S62 12, 76 18 S96 27, 118 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M2 40 C18 32, 24 38, 38 28 S62 16, 76 22 S96 30, 118 12 L118 42 L2 42 Z" fill="currentColor" opacity="0.12" />
  </svg>
);

export default function PastTradesPage() {
  const [trades, setTrades] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    document.title = "Past Trades - Forex Auto Panel";
  }, []);

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await apiFetch("/api/trades/public");
        if (res.ok) {
          const data = await res.json();
          setTrades(data.trades || []);
          setTotalCount(data.totalCount || 0);
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

  const enrichedTrades = useMemo(() => {
    return trades.map((trade, index) => {
      const entry = Number(trade.entryPrice || 0);
      const exit = Number(trade.exitPrice || 0);
      const isBuy = trade.side === "BUY";
      const isWin = trade.result?.toUpperCase() === "WIN";
      const movement = Math.abs(exit - entry);
      const target = isBuy ? entry + movement * 1.4 : entry - movement * 1.4;
      const stopLoss = isBuy ? entry - movement * 0.8 : entry + movement * 0.8;
      const breakeven = isBuy ? entry + movement * 0.25 : entry - movement * 0.25;
      const points = Math.abs(exit - entry) * (entry > 1000 ? 10 : entry > 100 ? 100 : 10000);

      const formattedPnl = trade.profitLoss >= 0
        ? `+$${trade.profitLoss.toLocaleString("en-US")}`
        : `-$${Math.abs(trade.profitLoss).toLocaleString("en-US")}`;

      const dateStr = trade.tradeDate ? new Date(trade.tradeDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }) : "N/A";

      const timeStr = trade.tradeDate ? new Date(trade.tradeDate).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
      }) : "";

      return {
        ...trade,
        target: formatPrice(target, trade.exitPrice),
        stopLoss: formatPrice(stopLoss, trade.entryPrice),
        breakeven: formatPrice(breakeven, trade.entryPrice),
        points: `${isWin ? "" : "-"}${formatPoints(points)}`,
        qty: "1.00",
        pnl: formattedPnl,
        dateStr,
        timeStr,
      };
    });
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return enrichedTrades.filter((trade) => {
      const matchesSearch = trade.pair?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSide = sideFilter === "ALL" || trade.side === sideFilter;
      const matchesResult = resultFilter === "ALL" || trade.result?.toUpperCase() === resultFilter;
      return matchesSearch && matchesSide && matchesResult;
    });
  }, [enrichedTrades, searchQuery, sideFilter, resultFilter]);

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  const paginatedTrades = useMemo(() => {
    if (!isSubscribed) {
      return filteredTrades.slice(0, 10);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrades, currentPage, isSubscribed]);

  // Compute dynamic stats based on all loaded trades (10 for free, up to 1000 for subscribers)
  const heroStats = useMemo(() => {
    const totalPnlVal = trades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const winTrades = trades.filter((t) => t.result?.toUpperCase() === "WIN").length;
    const winRateVal = trades.length > 0 ? (winTrades / trades.length) * 100 : 0;

    return [
      {
        label: "Total PnL",
        value: `${totalPnlVal >= 0 ? "+" : "-"}$${Math.abs(totalPnlVal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        detail: isSubscribed ? "Calculated from all trade records" : "Showing stats for 10 trades",
        align: "left",
        positive: totalPnlVal >= 0,
      },
      {
        label: "Win Rate",
        value: `${winRateVal.toFixed(2)}%`,
        detail: `${winTrades} wins out of ${trades.length} trades`,
        align: "right",
        positive: winRateVal >= 50,
      },
    ];
  }, [trades, isSubscribed]);

  const downloadCSV = () => {
    if (!isSubscribed) {
      alert("Upgrade your subscription to download trade records.");
      return;
    }
    const headers = ["Pair", "Side", "Entry Price", "Exit Price", "Target", "Stop Loss", "Breakeven", "Date", "Result", "Points", "PnL"];
    const csvRows = [headers.join(",")];
    
    filteredTrades.forEach(t => {
      const row = [
        t.pair,
        t.side,
        t.entryPrice,
        t.exitPrice,
        t.target,
        t.stopLoss,
        t.breakeven,
        t.tradeDate ? new Date(t.tradeDate).toLocaleDateString() : "",
        t.result,
        t.points,
        t.profitLoss
      ];
      csvRows.push(row.join(","));
    });
    
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `forex-auto-panel_history_${Date.now()}.csv`);
    a.click();
  };

  const startNum = isSubscribed ? (filteredTrades.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0) : 1;
  const endNum = isSubscribed ? Math.min(currentPage * itemsPerPage, filteredTrades.length) : Math.min(10, filteredTrades.length);
  const totalNum = isSubscribed ? filteredTrades.length : totalCount;

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
              Forex Auto Panel is an intelligent automated trading system that analyzes the market 24/7 and executes high-probability trades for consistent results.
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
                <MiniChart positive={stat.positive} />
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
              <p className="mt-1 text-xs text-neutral-500">Real-time trades executed by Forex Auto Panel</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 h-9 text-xs text-neutral-300">
                <Search className="h-3.5 w-3.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search pair..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent border-none outline-none text-white placeholder-neutral-500 w-28 sm:w-40"
                />
              </div>

              <select
                value={sideFilter}
                onChange={(e) => { setSideFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-white/10 bg-[#0B1110] px-3 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/[0.03]"
              >
                <option value="ALL">All Sides</option>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>

              <select
                value={resultFilter}
                onChange={(e) => { setResultFilter(e.target.value); setCurrentPage(1); }}
                className="h-9 rounded-lg border border-white/10 bg-[#0B1110] px-3 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/[0.03]"
              >
                <option value="ALL">All Results</option>
                <option value="WIN">WIN</option>
                <option value="LOSS">LOSS</option>
              </select>

              <button
                type="button"
                onClick={downloadCSV}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-white hover:bg-white/[0.03] transition-colors"
                title="Download CSV"
                aria-label="Download trades"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="border-b border-white/10 text-[11px] uppercase tracking-widest text-neutral-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Pair</th>
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
                {paginatedTrades.map((trade) => {
                  const isWin = trade.result?.toUpperCase() === "WIN";
                  const isBuy = trade.side === "BUY";

                  return (
                    <tr key={trade.id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-5 py-4 font-semibold text-white">{trade.pair}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex min-w-12 justify-center rounded-md px-2 py-1 text-[11px] font-black ${isBuy ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{formatPrice(trade.entryPrice, trade.entryPrice)}</td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{formatPrice(trade.exitPrice, trade.exitPrice)}</td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{trade.target}</td>
                      <td className="px-5 py-4 font-mono font-semibold text-red-300">{trade.stopLoss}</td>
                      <td className="px-5 py-4 font-mono text-neutral-300">{trade.breakeven}</td>
                      <td className="px-5 py-4 text-xs text-neutral-400">
                        <span className="block">{trade.dateStr}</span>
                        {trade.timeStr && <span className="text-neutral-600">{trade.timeStr}</span>}
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
                {paginatedTrades.length === 0 && !loading && (
                  <tr>
                    <td colSpan="12" className="px-5 py-8 text-center text-sm text-neutral-500">No matching trade records found.</td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan="12" className="px-5 py-8 text-center text-sm text-neutral-500">Loading trade records...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-xs text-neutral-500">
            <span>Showing {startNum} to {endNum} of {totalNum} trades</span>
            {isSubscribed && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &larr;
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 ${currentPage === pageNum ? "border-green-500/40 bg-green-500/10 text-green-300" : "border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white"}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-neutral-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>
        </section>

        {!isSubscribed && !loading && (
          <div className="relative mt-6 overflow-hidden rounded-xl border border-green-500/25 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,197,94,0.15),transparent_60%)] bg-[#0B1110] p-6 text-center shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
            <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row sm:text-left sm:justify-between">
              <div className="flex items-center gap-4 text-left">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-300 ring-4 ring-green-500/5 animate-pulse">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Unlock Complete Trade History</h4>
                  <p className="mt-1 text-xs text-neutral-400 max-w-md">
                    Showing 10 of {totalCount} published trades. Upgrade your subscription to view all past trades, analytics, win rate, and performance reports.
                  </p>
                </div>
              </div>
              <a
                href="/#pricing"
                className="inline-flex h-10 items-center justify-center rounded-full bg-green-500 px-6 text-xs font-bold text-black transition-all hover:bg-green-300 hover:scale-105 active:scale-[0.98] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
              >
                Upgrade Subscription
              </a>
            </div>
          </div>
        )}

        <section className="mt-8 rounded-xl border border-white/10 bg-[#0B1110]/95 p-5 sm:p-7">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Why Choose Forex Auto Panel?</h2>
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
            <p className="mt-3 text-sm text-neutral-400">Join thousands of traders who trust Forex Auto Panel for automated trading success.</p>
            <a href="/signup" className="mt-6 inline-flex h-12 items-center rounded-full bg-green-500 px-7 text-sm font-bold text-black transition hover:bg-green-300 active:scale-[0.98]">
              Get Started Now
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
