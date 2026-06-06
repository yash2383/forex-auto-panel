"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "../../../hooks/adminStore";
import { ChevronLeft, ChevronRight, Download, Filter, MoreVertical, Search, ArrowUpRight, Shield, ShieldCheck } from "lucide-react";

function PnLWidget({ stats, wallet }) {
  const realizedBalance = wallet ? Number(wallet.realizedBalance) : 0;
  const totalProfit = stats ? Number(stats.totalProfit) : 0;
  const growthPct = realizedBalance > 0 ? ((totalProfit / realizedBalance) * 100).toFixed(1) : "0.0";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-r from-[#06120e] to-[#020907] p-6 shadow-[0_0_50px_-25px_rgba(34,197,94,0.35)]">
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-3xl"></div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
            Performance Overview
          </span>
          <h2 className="mt-3 text-sm font-medium text-neutral-400">Withdrawable Balance (Cash Account)</h2>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
              ${realizedBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="inline-flex items-center gap-0.5 text-sm font-bold text-green-300">
              <ArrowUpRight className="h-4 w-4" />
              +{growthPct}% Growth
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center min-w-[110px] backdrop-blur">
            <p className="text-xs text-neutral-500 font-semibold">Total PnL</p>
            <p className={`mt-1 text-lg font-bold ${totalProfit >= 0 ? "text-green-300" : "text-red-400"}`}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString("en-US")}
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center min-w-[110px] backdrop-blur">
            <p className="text-xs text-neutral-500 font-semibold">Win Rate</p>
            <p className="mt-1 text-lg font-bold text-green-300">{stats?.winRate || "72.9"}%</p>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProfitOverviewWidget({ summary }) {
  const totalProfit = summary ? Number(summary.totalProfit) : 0;
  const pendingProfit = summary ? Number(summary.pendingProfit) : 0;
  const lastDistributionDate = summary?.lastDistribution
    ? new Date(summary.lastDistribution).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Never";

  return (
    <article className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-r from-[#06120e] to-[#020907] p-6 shadow-[0_0_50px_-25px_rgba(34,197,94,0.35)] h-full flex flex-col justify-between">
      <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-3xl"></div>
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/20">
          <ArrowUpRight className="h-3.5 w-3.5" />
          Profit Overview
        </span>
        
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs text-neutral-500 font-semibold">Total Profit Earned</p>
            <p className="text-2xl font-extrabold text-white font-mono mt-0.5">
              +${totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <div>
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Pending Profit</p>
              <p className="text-sm font-bold text-yellow-300 font-mono mt-0.5">
                ${pendingProfit.toLocaleString("en-US")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Last Payout</p>
              <p className="text-xs font-medium text-neutral-300 mt-0.5">
                {lastDistributionDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <a 
          href="/dashboard/profit-history" 
          className="w-full inline-flex h-9 items-center justify-center rounded-lg bg-green-500/10 text-xs font-bold text-green-300 border border-green-500/20 hover:bg-green-500 hover:text-black transition"
        >
          View Profit History &rarr;
        </a>
      </div>
    </article>
  );
}

function StatCard({ label, value, sub, tone, isLive }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)] relative overflow-hidden group">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-400 font-medium">{label}</p>
        {isLive && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        )}
      </div>
      <p className={`mt-4 text-2xl font-bold tracking-tight font-mono ${tone}`}>{value}</p>
      <p className="mt-2 text-xs text-neutral-500">{sub}</p>
    </article>
  );
}

function ResultBadge({ result }) {
  const styles = {
    WIN: "bg-green-500/10 text-green-300 border border-green-500/20",
    LOSS: "bg-red-500/10 text-red-300 border border-red-500/20",
    BE: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20",
  };

  return <span className={`rounded-md px-2.5 py-0.5 text-xs font-bold ${styles[result] || styles.BE}`}>{result}</span>;
}

export default function DashboardPage() {
  const stats = useAdminStore((s) => s.stats);
  const trades = useAdminStore((s) => s.trades || []);
  const wallet = useAdminStore((s) => s.wallet);
  const profitSummary = useAdminStore((s) => s.profitSummary);
  const currentUser = useAdminStore((s) => s.currentUser);
  const updateUserSettings = useAdminStore((s) => s.updateUserSettings);
  const fetchData = useAdminStore((s) => s.fetchData);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter closed trades
  const closedTrades = useMemo(() => {
    let list = trades.filter((t) => t.status === "Closed");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => 
        t.symbol.toLowerCase().includes(q) || 
        t.side.toLowerCase().includes(q)
      );
    }
    return list;
  }, [trades, searchQuery]);



  const userStats = [
    { label: "Total Profit", value: `$${(stats?.totalProfit || 0).toLocaleString("en-US")}`, sub: "Settled returns pool", tone: "text-green-300" },
    { label: "Unrealized PnL", value: `${(stats?.unrealizedPnL || 0) >= 0 ? "+" : ""}$${(stats?.unrealizedPnL || 0).toLocaleString("en-US")}`, sub: "Floating live trades profit", tone: "text-green-300", isLive: true },
    { label: "Realized PnL", value: `$${(stats?.realizedPnL || 0).toLocaleString("en-US")}`, sub: "Settled past trades profit", tone: "text-white" },
    { label: "Win Rate", value: `${stats?.winRate || "72.91"}%`, sub: "Execution accuracy", tone: "text-green-300" },
    { label: "Active Trades", value: String(stats?.activeTradesCount || 0), sub: "Running robot strategies", tone: "text-neutral-200" },
  ];

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3 items-stretch">
        <div className="lg:col-span-2">
          <PnLWidget stats={stats} wallet={wallet} />
        </div>
        <div className="lg:col-span-1">
          <ProfitOverviewWidget summary={profitSummary} />
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {userStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>



      {/* Past Trades Table */}
      <section className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_45px_-28px_rgba(34,197,94,0.6)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Past Trades</h2>
              <p className="mt-1 text-sm text-neutral-500">View your closed trades history</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-12 min-w-[280px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-neutral-500">
              <Search className="h-4 w-4" />
              <input 
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-neutral-600" 
                placeholder="Search by stock, type..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <button className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm font-bold text-white transition hover:bg-white/[0.08]">
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button className="inline-flex h-12 items-center gap-2 rounded-xl bg-green-500 px-5 text-sm font-bold text-black transition hover:bg-green-400">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-neutral-500">
              <tr>
                {["Stock", "Type", "Entry", "Exit", "Target", "Stop Loss", "Date", "Result", "Qty", "PnL", ""].map((head) => (
                  <th key={head} className="px-4 py-4 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {closedTrades.slice(0, 10).map((trade) => {
                const isWin = trade.result === "WIN";
                const isBuy = trade.side === "BUY";
                const isBe = trade.result === "BE";
                const pnlTone = isWin ? "text-green-300" : isBe ? "text-yellow-300" : "text-red-300";
                
                const rawPnlVal = trade.rawPnl;
                const formattedVal = `${rawPnlVal >= 0 ? "+" : "-"}$${Math.abs(Math.round(rawPnlVal)).toLocaleString("en-US")}`;

                return (
                  <tr key={trade.id} className="hover:bg-white/[0.025]">
                    <td className="px-4 py-5 font-bold text-white">{trade.symbol}</td>
                    <td className="px-4 py-5">
                      <span className={`rounded-md px-2 py-1 text-xs font-black ${isBuy ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-5 font-mono text-neutral-200 font-semibold">${trade.entry.toLocaleString()}</td>
                    <td className="px-4 py-5 font-mono text-neutral-200 font-semibold">${trade.exit.toLocaleString()}</td>
                    <td className="px-4 py-5 font-mono text-neutral-200">${trade.target.toLocaleString()}</td>
                    <td className="px-4 py-5 font-mono text-red-300">${trade.stopLoss.toLocaleString()}</td>
                    <td className="px-4 py-5 text-neutral-200">
                      <span className="block">{trade.date}</span>
                    </td>
                    <td className="px-4 py-5"><ResultBadge result={trade.result} /></td>
                    <td className="px-4 py-5 font-mono text-neutral-200">{trade.qty}</td>
                    <td className={`px-4 py-5 font-mono font-bold ${pnlTone}`}>
                      {isWin && <span className="inline-flex items-center gap-1.5 text-green-300">{formattedVal} <span className="text-[10px]">✅</span></span>}
                      {!isWin && !isBe && <span className="inline-flex items-center gap-1.5 text-red-300">{formattedVal} <span className="text-[10px]">❌</span></span>}
                      {isBe && <span className="inline-flex items-center gap-1.5 text-yellow-300">{formattedVal}</span>}
                    </td>
                    <td className="px-4 py-5 text-neutral-500">
                      <MoreVertical className="h-4 w-4" />
                    </td>
                  </tr>
                );
              })}
              {closedTrades.length === 0 && (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-neutral-500">No closed trades found. Try turning on Auto Trading to execute trades automatically.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
