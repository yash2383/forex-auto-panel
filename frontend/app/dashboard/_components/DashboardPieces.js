"use client";

import { Download, Filter, MoreVertical, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminStore } from "../../../hooks/adminStore";

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
  const formattedVal = `${numericVal >= 0 ? "+" : "-"}₹${Math.abs(numericVal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  
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
  const pnlText = `${isProfit ? "+" : "-"}₹${Math.abs(livePnl).toLocaleString("en-IN")} (${isProfit ? "+" : ""}${livePct.toFixed(1)}%)`;

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
  const trades = useAdminStore((s) => s.trades || []);
  const fetchData = useAdminStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const closedTrades = trades
    .filter((trade) => trade.status === "Closed")
    .map((trade) => ({
      id: trade.id,
      symbol: trade.symbol || trade.pair,
      side: trade.side || trade.type,
      entry: trade.entry,
      exit: trade.exit,
      target: trade.target,
      stopLoss: trade.stopLoss,
      breakeven: trade.breakeven ?? trade.entry,
      date: trade.date || "",
      result: trade.result || (Number(trade.rawPnl ?? trade.pnl ?? trade.profit) > 0 ? "WIN" : Number(trade.rawPnl ?? trade.pnl ?? trade.profit) < 0 ? "LOSS" : "BE"),
      points: trade.points ?? Number(trade.rawPnl ?? trade.pnl ?? trade.profit ?? 0).toFixed(2),
      qty: trade.qty || "1.00",
      rawPnl: Number(trade.rawPnl ?? trade.pnl ?? trade.profit ?? 0),
    }));

  const visibleTrades = compact ? closedTrades.slice(0, 4) : closedTrades;

  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead className="bg-white/[0.03] text-xs uppercase text-neutral-500">
          <tr>
            {["Stock", "Type", "Entry", "Exit", "Target", "Stop Loss", "Breakeven", "Date", "Result", "Points", "Qty", "PnL", ""].map((head) => (
              <th key={head || "menu"} className="px-4 py-4 font-semibold">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {visibleTrades.map((trade) => {
            const isWin = trade.result === "WIN";
            const isBuy = trade.side === "BUY";
            const isBe = trade.result === "BE";
            return (
              <tr key={trade.id} className="hover:bg-white/[0.03]">
                <td className="px-4 py-4 font-bold text-white">{trade.symbol}</td>
                <td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-xs font-black ${isBuy ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>{trade.side}</span></td>
                <td className="px-4 py-4 font-mono">{formatPrice(trade.entry)}</td>
                <td className="px-4 py-4 font-mono">{formatPrice(trade.exit)}</td>
                <td className="px-4 py-4 font-mono">{formatPrice(trade.target)}</td>
                <td className="px-4 py-4 font-mono text-red-300">{formatPrice(trade.stopLoss)}</td>
                <td className="px-4 py-4 font-mono">{formatPrice(trade.breakeven)}</td>
                <td className="px-4 py-4 text-xs text-neutral-400"><span className="block">{trade.date || "Recently"}</span></td>
                <td className="px-4 py-4"><span className={`rounded-md px-2 py-1 text-xs font-black ${isWin ? "bg-green-500/10 text-green-300" : isBe ? "bg-yellow-500/10 text-yellow-300" : "bg-red-500/10 text-red-300"}`}>{trade.result}</span></td>
                <td className={`px-4 py-4 font-mono font-bold ${isWin ? "text-green-300" : isBe ? "text-yellow-300" : "text-red-300"}`}>{trade.points}</td>
                <td className="px-4 py-4 font-mono">{trade.qty}</td>
                <td className="px-4 py-4">
                  {formatPastPnL(trade.rawPnl, trade.result)}
                </td>
                <td className="px-4 py-4 text-neutral-500"><MoreVertical className="h-4 w-4" /></td>
              </tr>
            );
          })}
          {visibleTrades.length === 0 && (
            <tr>
              <td colSpan="13" className="px-4 py-8 text-center text-neutral-500">No closed trades found yet.</td>
            </tr>
          )}
        </tbody>
      </table>
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
