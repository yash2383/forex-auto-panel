"use client";

import { Download, Filter, MoreVertical, Search, LockKeyhole } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";

// Mock live trades data with rupee start values
const initialLiveTrades = [
  { pair: "BTC/USD", type: "BUY", entry: 68240.00, current: 68920.00, target: 70000.00, stop: 67800.00, initialPnl: 320, initialPct: 2.1, startSeconds: 134 },
  { pair: "ETH/USD", type: "BUY", entry: 3730.50, current: 3710.20, target: 3840.00, stop: 3650.00, initialPnl: -85, initialPct: -0.7, startSeconds: 345 },
  { pair: "XAU/USD", type: "SELL", entry: 2376.80, current: 2370.10, target: 2360.00, stop: 2386.00, initialPnl: 510, initialPct: 1.4, startSeconds: 750 },
];

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "-";
  return numericValue >= 100
    ? numericValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : numericValue.toFixed(5);
};

const formatPastPnL = (pnlValue, result) => {
  const numericVal = Number(pnlValue);
  if (!Number.isFinite(numericVal)) return "";
  const formattedVal = `${numericVal >= 0 ? "+" : "-"}$${Math.abs(numericVal).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  
  if (result === "WIN") {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-green-300">
        {formattedVal} <span className="text-xs">✅</span>
      </span>
    );
  } else if (result === "LOSS") {
    return (
      <span className="inline-flex items-center gap-1.5 font-bold text-red-300">
        {formattedVal} <span className="text-xs">❌</span>
      </span>
    );
  }
  return <span className="font-bold text-yellow-300">{formattedVal}</span>;
};

const LiveTradeRow = ({ trade }) => {
  const [seconds, setSeconds] = useState(trade.startSeconds);
  const [livePnl, setLivePnl] = useState(trade.initialPnl);
  const [livePct, setLivePct] = useState(trade.initialPct);
  const [curPrice, setCurPrice] = useState(trade.current);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pnlTimer = setInterval(() => {
      const pnlChange = Math.round((Math.random() - 0.5) * 8);
      setLivePnl((prevPnl) => {
        const nextPnl = prevPnl + pnlChange;
        setLivePct((prevPct) => prevPct + (pnlChange / 120));
        setCurPrice((prevPrice) => {
          const priceChange = (pnlChange / 12) * (trade.type === "BUY" ? 1.5 : -1.5);
          return parseFloat((prevPrice + priceChange).toFixed(2));
        });
        return nextPnl;
      });
    }, 2500);
    return () => clearInterval(pnlTimer);
  }, [trade.type]);

  const formatDuration = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return `${pad(mins)}:${pad(secs)}`;
  };

  const isProfit = livePnl >= 0;
  const pnlTone = isProfit ? "text-green-300" : "text-red-300";
  const pnlText = `${isProfit ? "+" : "-"}$${Math.abs(livePnl).toLocaleString("en-US")} (${isProfit ? "+" : ""}${livePct.toFixed(1)}%)`;

  return (
    <tr className="hover:bg-white/[0.03]">
      <td className="px-4 py-4 font-bold text-white">{trade.pair}</td>
      <td className="px-4 py-4">
        <span className={`rounded-md px-2 py-1 text-xs font-black ${trade.type === "BUY" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
          {trade.type}
        </span>
      </td>
      <td className="px-4 py-4 font-mono text-neutral-300">{trade.entry.toLocaleString()}</td>
      <td className="px-4 py-4 font-mono text-neutral-300">{curPrice.toLocaleString()}</td>
      <td className="px-4 py-4 font-mono text-neutral-300">{trade.target.toLocaleString()}</td>
      <td className="px-4 py-4 font-mono text-red-300">{trade.stop.toLocaleString()}</td>
      <td className={`px-4 py-4 font-mono font-bold ${pnlTone}`}>{pnlText}</td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-300 border border-green-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
          LIVE • {formatDuration(seconds)} min
        </span>
      </td>
    </tr>
  );
};

export const SectionCard = ({ title, description, children, action }) => (
  <section className="rounded-2xl border border-white/10 bg-[#0B1110]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const PageIntro = ({ title, description, children }) => (
  <section className="rounded-2xl border border-white/10 bg-[#0B1110]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
    <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-400">{description}</p>
    {children && <div className="mt-5">{children}</div>}
  </section>
);

export const StatCard = ({ item }) => {
  const Icon = item.icon;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1110]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.04] ${item.tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm text-neutral-400">{item.label}</p>
      </div>
      <p className={`mt-5 text-3xl font-semibold tracking-tight ${item.tone}`}>{item.value}</p>
      <p className="mt-3 text-sm text-neutral-500">{item.sub}</p>
    </div>
  );
};

export const MiniBars = () => (
  <div className="mt-5 flex h-28 items-end gap-2">
    {[44, 58, 36, 76, 64, 92, 72, 104, 88, 118, 98, 126].map((height, index) => (
      <span key={`${height}-${index}`} className="flex-1 rounded-t-md bg-gradient-to-t from-green-500/20 to-green-300" style={{ height }} />
    ))}
  </div>
);

export const LiveTradesTable = () => {
  const trades = useAdminStore((s) => s.trades || []);
  const activeDbTrades = trades.filter((t) => t.status === "Active");

  const liveRows = activeDbTrades.length > 0 ? activeDbTrades.map((t) => ({
    pair: t.symbol,
    type: t.side,
    entry: t.entry,
    current: t.currentPrice || t.entry,
    target: t.target,
    stop: t.stopLoss,
    initialPnl: Number(t.points),
    initialPct: t.entry > 0 ? (Number(t.points) / t.entry) * 100 : 0,
    startSeconds: 15,
    id: t.id,
  })) : initialLiveTrades;

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-xs uppercase text-neutral-500">
          <tr className="border-b border-white/10">
            {["Pair", "Type", "Entry", "Current Price", "Target", "Stop Loss", "Live PnL", "Status & Time"].map((head) => (
              <th key={head} className="px-4 py-3 font-semibold">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {liveRows.map((trade, idx) => (
            <LiveTradeRow key={trade.id || trade.pair || idx} trade={trade} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const PastTradesTable = ({ compact = false }) => {
  const [trades, setTrades] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function loadTrades() {
      try {
        const res = await apiFetch("/api/trades/public");
        if (res.ok) {
          const data = await res.json();
          setTrades(data.trades || []);
          setIsSubscribed(data.isSubscribed || false);
          setTotalCount(data.totalCount || 0);
        }
      } catch (e) {
        console.error("Failed to load public trades in dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadTrades();
  }, []);

  const formatPoints = (value) => {
    if (!Number.isFinite(value)) return "0.0";
    return value.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  };

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
        symbol: trade.pair,
        side: trade.side,
        entry: trade.entryPrice,
        exit: trade.exitPrice,
        target,
        stopLoss,
        breakeven,
        points: `${isWin ? "" : "-"}${formatPoints(points)}`,
        qty: "1.00",
        rawPnl: trade.profitLoss,
        date: dateStr,
        time: timeStr,
        result: trade.result?.toUpperCase() || (trade.profitLoss > 0 ? "WIN" : trade.profitLoss < 0 ? "LOSS" : "BE")
      };
    });
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return enrichedTrades.filter((trade) => {
      const matchesSearch = trade.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSide = sideFilter === "ALL" || trade.side === sideFilter;
      const matchesResult = resultFilter === "ALL" || trade.result === resultFilter;
      return matchesSearch && matchesSide && matchesResult;
    });
  }, [enrichedTrades, searchQuery, sideFilter, resultFilter]);

  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);

  const paginatedTrades = useMemo(() => {
    if (compact) {
      return filteredTrades.slice(0, 4);
    }
    if (!isSubscribed) {
      return filteredTrades.slice(0, 10);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTrades.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTrades, currentPage, isSubscribed, compact]);

  const downloadCSV = () => {
    if (!isSubscribed) {
      alert("Upgrade your subscription to download trade records.");
      return;
    }
    const headers = ["Pair", "Side", "Entry Price", "Exit Price", "Target", "Stop Loss", "Breakeven", "Date", "Result", "Points", "PnL"];
    const csvRows = [headers.join(",")];
    
    filteredTrades.forEach(t => {
      const row = [
        t.symbol,
        t.side,
        t.entry,
        t.exit,
        t.target,
        t.stopLoss,
        t.breakeven,
        t.tradeDate ? new Date(t.tradeDate).toLocaleDateString() : "",
        t.result,
        t.points,
        t.rawPnl
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
    <div className="mt-5">
      {!compact && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/10 p-3">
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

          <div className="flex flex-wrap items-center gap-2">
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
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-xs font-bold text-white hover:bg-white/[0.03] transition-colors"
              title="Download CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase text-neutral-500">
            <tr>
              {["Stock", "Type", "Entry", "Exit", "Target", "Stop Loss", "Breakeven", "Date", "Result", "Points", "Qty", "PnL", ""].map((head) => (
                <th key={head || "menu"} className="px-4 py-4 font-semibold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedTrades.map((trade) => {
              const isWin = trade.result === "WIN";
              const isBuy = trade.side === "BUY";
              const isBe = trade.result === "BE";
              return (
                <tr key={trade.id} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-4 font-bold text-white">{trade.symbol}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-md px-2 py-1 text-xs font-black ${isBuy ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono">{formatPrice(trade.entry)}</td>
                  <td className="px-4 py-4 font-mono">{formatPrice(trade.exit)}</td>
                  <td className="px-4 py-4 font-mono">{formatPrice(trade.target)}</td>
                  <td className="px-4 py-4 font-mono text-red-300">{formatPrice(trade.stopLoss)}</td>
                  <td className="px-4 py-4 font-mono">{formatPrice(trade.breakeven)}</td>
                  <td className="px-4 py-4 text-xs text-neutral-400">
                    <span className="block">{trade.date}</span>
                    {trade.time && <span className="text-neutral-600">{trade.time}</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-md px-2 py-1 text-xs font-black ${isWin ? "bg-green-500/10 text-green-300" : isBe ? "bg-yellow-500/10 text-yellow-300" : "bg-red-500/10 text-red-300"}`}>
                      {trade.result}
                    </span>
                  </td>
                  <td className={`px-4 py-4 font-mono font-bold ${isWin ? "text-green-300" : isBe ? "text-yellow-300" : "text-red-300"}`}>
                    {trade.points}
                  </td>
                  <td className="px-4 py-4 font-mono">{trade.qty}</td>
                  <td className="px-4 py-4">
                    {formatPastPnL(trade.rawPnl, trade.result)}
                  </td>
                  <td className="px-4 py-4 text-neutral-500"><MoreVertical className="h-4 w-4" /></td>
                </tr>
              );
            })}
            {paginatedTrades.length === 0 && !loading && (
              <tr>
                <td colSpan="13" className="px-4 py-8 text-center text-neutral-500">No matching trade records found.</td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="13" className="px-4 py-8 text-center text-neutral-500">Loading trade records...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-4 text-xs text-neutral-500 mt-4">
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
      )}

      {!compact && !isSubscribed && !loading && (
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
    </div>
  );
};

export const TableActions = () => (
  <div className="flex flex-wrap gap-2">
    <div className="hidden h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-neutral-500 sm:inline-flex">
      <Search className="h-3.5 w-3.5" /> Search by stock, type...
    </div>
    <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-xs font-bold text-white"><Filter className="h-3.5 w-3.5" /> Filters</button>
    <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-500/20 px-4 text-xs font-bold text-green-300"><Download className="h-3.5 w-3.5" /> Export</button>
  </div>
);

export const Disclaimer = () => (
  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 text-sm leading-relaxed text-neutral-400">
    <strong className="text-yellow-300">Disclaimer:</strong> Trading involves financial risk. Performance shown is based on past data and does not guarantee future results.
  </div>
);
