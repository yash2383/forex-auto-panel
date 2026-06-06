"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../../../../lib/apiFetch";
import { useAdminStore } from "../../../../hooks/adminStore";
import {
  TrendingUp,
  FileText,
  Wallet,
  BarChart3,
  Download,
  CheckCircle2,
  Loader2,
  Shield,
  AlertTriangle,
  RefreshCw,
  FileBarChart,
  Receipt,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// ─── Helper ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  `$${Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, tone = "text-green-300", loading }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-neutral-600" />
        ) : null}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      {loading ? (
        <div className="mt-1 h-7 w-28 animate-pulse rounded bg-white/5" />
      ) : (
        <p className={`mt-1 text-2xl font-extrabold tracking-tight font-mono ${tone}`}>{value}</p>
      )}
      {sub && <p className="mt-1 text-xs text-neutral-600">{sub}</p>}
    </article>
  );
}

// ─── Export Button ────────────────────────────────────────────────────────────
function ExportBtn({ label, icon: Icon, onClick, loading, variant = "ghost" }) {
  const base =
    "inline-flex h-9 items-center gap-2 rounded-lg px-4 text-xs font-bold transition disabled:opacity-50";
  const styles = {
    primary: "bg-green-500 text-black hover:bg-green-400",
    ghost: "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${base} ${styles[variant]}`}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

// ─── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ icon: Icon, title, description, color = "green", children, actions }) {
  const colors = {
    green: { border: "border-green-500/20", icon: "bg-green-500/10 text-green-300", badge: "text-green-400" },
    blue: { border: "border-blue-500/20", icon: "bg-blue-500/10 text-blue-300", badge: "text-blue-400" },
    purple: { border: "border-purple-500/20", icon: "bg-purple-500/10 text-purple-300", badge: "text-purple-400" },
    amber: { border: "border-amber-500/20", icon: "bg-amber-500/10 text-amber-300", badge: "text-amber-400" },
  };
  const c = colors[color] || colors.green;
  return (
    <section
      className={`rounded-2xl border ${c.border} bg-gradient-to-br from-[#06120e] to-[#020907] p-6 shadow-xl`}
    >
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.icon}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">{description}</p>
        </div>
      </div>

      <div className="mt-5">{children}</div>

      {actions && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-white/5 pt-5">
          {actions}
        </div>
      )}
    </section>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatRow({ label, value, tone = "text-white" }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-neutral-400">{label}</span>
      <span className={`text-sm font-bold font-mono ${tone}`}>{value}</span>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-green-500/20 bg-[#07100d]/95 p-4 text-green-300 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-4">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
      <span className="text-sm font-bold">{message}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);

  // Summary
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Report data panels
  const [tradingData, setTradingData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [walletData, setWalletData] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [history, setHistory] = useState([]);

  // Loading / UI states
  const [panelLoading, setPanelLoading] = useState({
    trading: false,
    profit: false,
    wallet: false,
    tax: false,
    distribution: false,
    monthly: false,
  });
  const [exporting, setExporting] = useState({});
  const [toast, setToast] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await apiFetch("/api/reports/summary");
      if (res.ok) setSummary(await res.json());
    } catch (e) {
      console.error("Summary load error:", e);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadPanel = useCallback(async (type, setter, endpoint) => {
    setPanelLoading((p) => ({ ...p, [type]: true }));
    try {
      const res = await apiFetch(endpoint);
      if (res.ok) setter(await res.json());
    } catch (e) {
      console.error(`${type} panel error:`, e);
    } finally {
      setPanelLoading((p) => ({ ...p, [type]: false }));
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch("/api/reports/history");
      if (res.ok) setHistory(await res.json());
    } catch (e) {
      console.error("History load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    loadSummary();
    loadPanel("trading", setTradingData, "/api/reports/trading");
    loadPanel("profit", setProfitData, "/api/reports/profit");
    loadPanel("wallet", setWalletData, "/api/reports/wallet");
    loadPanel("tax", setTaxData, "/api/reports/tax");
    loadPanel("distribution", setDistributionData, "/api/reports/pnl/distribution");
    loadPanel("monthly", setMonthlyData, "/api/reports/pnl/monthly");
    loadHistory();
  }, [fetchData, loadSummary, loadPanel, loadHistory]);

  // ── Export handler ───────────────────────────────────────────────────────
  const handleExport = async (type, format) => {
    const key = `${type}-${format}`;
    setExporting((e) => ({ ...e, [key]: true }));
    try {
      const res = await apiFetch(
        `/api/reports/export?type=${type}&format=${format}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.log("Status:", res.status);
        console.log("Status Text:", res.statusText);
        console.log("Response Body:", errorText);
        alert(
          `Status: ${res.status}\n` +
          `Status Text: ${res.statusText}\n` +
          `Body: ${errorText}`
        );
        throw new Error(`Export failed (${res.status}): ${errorText}`);
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/);
      const fileName =
        fileNameMatch?.[1] ||
        `Tradebot_${type}_${new Date().toISOString().slice(0, 10)}.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast(`${fileName} downloaded successfully!`);
      // Refresh history after a short delay
      setTimeout(() => loadHistory(), 1200);
    } catch (e) {
      console.error("Export error:", e);
      setToast("Export failed. Please try again.");
    } finally {
      setExporting((e) => ({ ...e, [key]: false }));
    }
  };

  // ── Re-download a historical report ─────────────────────────────────────
  const [historyDownloading, setHistoryDownloading] = useState({});
  const handleHistoryDownload = async (reportId, fallbackName) => {
    setHistoryDownloading((h) => ({ ...h, [reportId]: true }));
    try {
      const res = await apiFetch(`/api/reports/download/${reportId}`);
      if (!res.ok) { setToast("Download failed. Try again."); return; }
      const disposition = res.headers.get("content-disposition") || "";
      const nameMatch = disposition.match(/filename="?([^"]+)"?/);
      const fileName = nameMatch ? nameMatch[1] : fallbackName;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
      setToast(`${fileName} downloaded!`);
    } catch {
      setToast("Download failed. Try again.");
    } finally {
      setHistoryDownloading((h) => ({ ...h, [reportId]: false }));
    }
  };

  // ── Summary cards data ───────────────────────────────────────────────────
  const summaryCards = [
    {
      icon: TrendingUp,
      label: "Total Trades",
      value: summary ? String(summary.totalTrades) : "—",
      sub: "Published trade records",
      tone: "text-green-300",
    },
    {
      icon: BarChart3,
      label: "Win Rate",
      value: summary ? `${summary.winRate}%` : "—",
      sub: "Across all trade records",
      tone: "text-blue-300",
    },
    {
      icon: ArrowUpRight,
      label: "Total Profit Distributed",
      value: summary ? fmt(summary.totalProfit) : "—",
      sub: "Paid distributions",
      tone: "text-green-300",
    },
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: summary ? fmt(summary.walletBalance) : "—",
      sub: "Realized & withdrawable",
      tone: "text-amber-300",
    },
  ];

  return (
    <>
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileBarChart className="h-6 w-6 text-green-400" />
            Financial Reports Center
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Generate, export, and download real-time financial reports from your account data.
          </p>
        </div>
        <button
          onClick={() => {
            loadSummary();
            loadPanel("trading", setTradingData, "/api/reports/trading");
            loadPanel("profit", setProfitData, "/api/reports/profit");
            loadPanel("wallet", setWalletData, "/api/reports/wallet");
            loadPanel("tax", setTaxData, "/api/reports/tax");
            loadPanel("distribution", setDistributionData, "/api/reports/pnl/distribution");
            loadPanel("monthly", setMonthlyData, "/api/reports/pnl/monthly");
            loadHistory();
          }}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-neutral-300 transition hover:bg-white/[0.08]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} loading={summaryLoading} />
        ))}
      </section>

      {/* ── Report Cards Grid ─────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-2">

        {/* 1. Trading Performance Report */}
        <ReportCard
          icon={TrendingUp}
          title="Trading Performance Report"
          description="Generated from admin-published TradeRecord data."
          color="green"
          actions={
            <>
              <ExportBtn
                label="Export PDF"
                icon={Download}
                variant="primary"
                loading={exporting["trading-pdf"]}
                onClick={() => handleExport("trading", "pdf")}
              />
              <ExportBtn
                label="Export CSV"
                icon={FileText}
                loading={exporting["trading-csv"]}
                onClick={() => handleExport("trading", "csv")}
              />
            </>
          }
        >
          {panelLoading.distribution ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-white/[0.03]" />
              ))}
            </div>
          ) : distributionData ? (
            <div>
              <StatRow label="Total Trades" value={distributionData.totalTrades} />
              <StatRow label="Win Rate" value={`${distributionData.winRate}%`} tone="text-blue-300" />
              <StatRow label="Profit Factor" value={distributionData.profitFactor} tone="text-green-300" />
              <StatRow label="Average Win" value={fmt(distributionData.averageWin)} tone="text-green-300" />
              <StatRow label="Average Loss" value={fmt(distributionData.averageLoss)} tone="text-red-400" />
              <StatRow label="Risk/Reward" value={`1:${distributionData.riskRewardRatio}`} tone="text-amber-300" />
              <StatRow
                label="Total P&L"
                value={fmt(distributionData.netProfit)}
                tone={distributionData.netProfit >= 0 ? "text-green-300" : "text-red-400"}
              />

              <div className="mt-6 border-t border-white/5 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Profit Distribution
                </p>
                <div className="flex items-center gap-4">
                  <div 
                    className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#22c55e 0 ${distributionData.winRate}%, #ef4444 ${distributionData.winRate}% ${distributionData.winRate + distributionData.lossRate}%, #94a3b8 ${distributionData.winRate + distributionData.lossRate}% 100%)`
                    }}
                  >
                    <div className="absolute inset-2 rounded-full bg-[#07100d]" />
                  </div>
                  <div className="flex-1 space-y-2 text-sm font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Winning Trades
                      </span>
                      <span className="text-green-300">{distributionData.winRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Losing Trades
                      </span>
                      <span className="text-red-400">{distributionData.lossRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-white">
                        <span className="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Breakeven
                      </span>
                      <span className="text-slate-300">{distributionData.breakevenRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-white/5 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Monthly PnL
                </p>
                {panelLoading.monthly ? (
                  <div className="h-8 w-full animate-pulse rounded-lg bg-white/[0.03]" />
                ) : monthlyData && monthlyData.length > 0 ? (
                  <div className="space-y-1">
                    {monthlyData.map((m) => (
                      <div key={m.month} className="flex items-center justify-between py-1.5">
                        <span className="text-sm font-medium text-neutral-300">{m.month}</span>
                        <span className={`text-sm font-bold font-mono ${m.pnl >= 0 ? "text-green-300" : "text-red-400"}`}>
                          {m.pnl >= 0 ? "+" : ""}{fmt(m.pnl)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">No monthly data found.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No trade data available.</p>
          )}
        </ReportCard>

        {/* 2. Profit Distribution Report */}
        <ReportCard
          icon={ArrowUpRight}
          title="Profit Distribution Report"
          description="Based on your profit distributions managed by the admin."
          color="blue"
          actions={
            <>
              <ExportBtn
                label="Export PDF"
                icon={Download}
                variant="primary"
                loading={exporting["profit-pdf"]}
                onClick={() => handleExport("profit", "pdf")}
              />
              <ExportBtn
                label="Export CSV"
                icon={FileText}
                loading={exporting["profit-csv"]}
                onClick={() => handleExport("profit", "csv")}
              />
            </>
          }
        >
          {panelLoading.profit ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-white/[0.03]" />
              ))}
            </div>
          ) : profitData ? (
            <div>
              <StatRow
                label="Total Distributed"
                value={fmt(profitData.totalDistributed)}
                tone="text-green-300"
              />
              <StatRow
                label="Pending Amount"
                value={fmt(profitData.pendingAmount)}
                tone="text-yellow-300"
              />
              <StatRow label="Paid Entries" value={profitData.paidCount} />
              <StatRow label="Pending Entries" value={profitData.pendingCount} tone="text-yellow-300" />
              {profitData.lastDistribution && (
                <StatRow
                  label="Last Distribution"
                  value={new Date(profitData.lastDistribution).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No distribution data found for your account.</p>
          )}
        </ReportCard>

        {/* 3. Wallet Statement */}
        <ReportCard
          icon={Wallet}
          title="Wallet Statement"
          description="Full account activity: deposits, withdrawals, and profit credits."
          color="purple"
          actions={
            <>
              <ExportBtn
                label="Download PDF"
                icon={Download}
                variant="primary"
                loading={exporting["wallet-pdf"]}
                onClick={() => handleExport("wallet", "pdf")}
              />
              <ExportBtn
                label="Download CSV"
                icon={FileText}
                loading={exporting["wallet-csv"]}
                onClick={() => handleExport("wallet", "csv")}
              />
            </>
          }
        >
          {panelLoading.wallet ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-white/[0.03]" />
              ))}
            </div>
          ) : walletData ? (
            <div>
              <StatRow label="Opening Balance" value={fmt(walletData.openingBalance)} />
              <StatRow
                label="Total Deposits"
                value={fmt(walletData.totalDeposits)}
                tone="text-green-300"
              />
              <StatRow
                label="Profit Credits"
                value={fmt(walletData.profitCredits)}
                tone="text-green-300"
              />
              <StatRow
                label="Total Withdrawals"
                value={fmt(walletData.totalWithdrawals)}
                tone="text-red-400"
              />
              <div className="mt-2 rounded-xl bg-green-500/5 p-3 border border-green-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-300">Closing Balance</span>
                  <span className="text-lg font-extrabold font-mono text-green-300">
                    {fmt(walletData.closingBalance)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No wallet data found.</p>
          )}
        </ReportCard>

        {/* 4. Tax Summary */}
        <ReportCard
          icon={Shield}
          title="Tax Summary"
          description="Estimated tax liability calculated from realized gains and profit distributions."
          color="amber"
          actions={
            <>
              <ExportBtn
                label="Download Tax PDF"
                icon={Download}
                variant="primary"
                loading={exporting["tax-pdf"]}
                onClick={() => handleExport("tax", "pdf")}
              />
              <ExportBtn
                label="Export CSV"
                icon={FileText}
                loading={exporting["tax-csv"]}
                onClick={() => handleExport("tax", "csv")}
              />
            </>
          }
        >
          {panelLoading.tax ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded-lg bg-white/[0.03]" />
              ))}
            </div>
          ) : taxData ? (
            <div>
              <StatRow label="Trading P&L" value={fmt(taxData.tradingPnL)} />
              <StatRow
                label="Distribution Income"
                value={fmt(taxData.distributionIncome)}
                tone="text-green-300"
              />
              <StatRow
                label="Total Realized Gains (STCG)"
                value={fmt(taxData.totalRealizedGains)}
                tone="text-green-300"
              />
              <StatRow label="Tax Rate" value={`${taxData.taxRate}%`} />
              <StatRow
                label="Estimated Tax Due"
                value={fmt(taxData.estimatedTax)}
                tone="text-red-400"
              />
              <div className="mt-2 rounded-xl bg-amber-500/5 p-3 border border-amber-500/10">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-300">Net Return After Tax</span>
                  <span className="text-lg font-extrabold font-mono text-amber-300">
                    {fmt(taxData.netReturn)}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-neutral-600 leading-relaxed">
                <AlertTriangle className="inline h-3 w-3 mr-1 text-yellow-600" />
                Estimated at 15% STCG. Consult a tax professional for official filings.
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No tax data available.</p>
          )}
        </ReportCard>
      </section>

      {/* ── Report History Log ────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-6 shadow-[0_0_45px_-28px_rgba(34,197,94,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
              <History className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-white">Report History</h2>
              <p className="text-xs text-neutral-500">Previously generated reports for your account</p>
            </div>
          </div>
          <button
            onClick={loadHistory}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-neutral-400 transition hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        <div className="mt-4 divide-y divide-white/5">
          {historyLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-white/[0.03]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 animate-pulse rounded bg-white/[0.03]" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/[0.03]" />
                </div>
              </div>
            ))
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-10 w-10 text-neutral-700 mb-3" />
              <p className="text-sm font-bold text-neutral-500">No reports generated yet</p>
              <p className="text-xs text-neutral-600 mt-1">
                Use the export buttons above to generate and download your first report.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const typeColors = {
                TRADING: "bg-green-500/10 text-green-300",
                PROFIT: "bg-blue-500/10 text-blue-300",
                WALLET: "bg-purple-500/10 text-purple-300",
                TAX: "bg-amber-500/10 text-amber-300",
              };
              const color = typeColors[item.reportType] || "bg-white/[0.05] text-neutral-300";
              const isPdf = item.fileName.endsWith(".pdf");

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-4 px-2 rounded-xl hover:bg-white/[0.015] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-neutral-400">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.fileName}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {new Date(item.createdAt).toLocaleString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${color}`}>
                      {item.reportType}
                    </span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                      {isPdf ? "PDF" : "CSV"}
                    </span>
                    <button
                      onClick={() => handleHistoryDownload(item.id, item.fileName)}
                      disabled={!!historyDownloading[item.id]}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-green-500/25 bg-green-500/8 px-2.5 text-[11px] font-bold text-green-300 hover:bg-green-500/15 transition disabled:opacity-50"
                    >
                      {historyDownloading[item.id]
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Download className="h-3 w-3" />}
                      Download
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-5 text-sm leading-relaxed text-neutral-400">
        <strong className="text-yellow-300">Disclaimer:</strong> All reports are generated from
        admin-verified records. Tax summaries are estimated at 15% STCG and are for reference only.
        Consult a certified financial advisor or chartered accountant for official tax filings.
      </div>

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </>
  );
}
