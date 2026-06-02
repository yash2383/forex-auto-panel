"use client";

import { useState } from "react";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import { ArrowDownLeft, ArrowUpRight, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function WalletPage() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [loading, setLoading] = useState(false);
  const [withdrawableBalance, setWithdrawableBalance] = useState(32450);
  const [totalBalance, setTotalBalance] = useState(45280);
  const [pendingSettlements, setPendingSettlements] = useState(1250);

  const transactions = [
    { type: "credit", desc: "Realized Profit Credit - BTC/USD", amount: "+₹26,560", date: "May 28, 2026", status: "Settle Complete" },
    { type: "debit", desc: "Withdrawal Request - Bank Transfer", amount: "-₹5,000", date: "May 25, 2026", status: "Processed" },
    { type: "credit", desc: "Deposit - UPI Payment", amount: "+₹15,000", date: "May 20, 2026", status: "Completed" },
    { type: "credit", desc: "Realized Profit Credit - EUR/USD", amount: "+₹64,740", date: "May 19, 2026", status: "Settle Complete" },
  ];

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setStatus({ type: "error", message: "Please enter a valid positive withdrawal amount." });
      return;
    }
    
    if (amount > withdrawableBalance) {
      setStatus({ 
        type: "error", 
        message: `Withdrawal limit exceeded. You can only withdraw up to ₹${withdrawableBalance.toLocaleString("en-IN")} (Realized balance).` 
      });
      return;
    }
    
    setLoading(true);
    setStatus({ type: null, message: "" });
    
    setTimeout(() => {
      setLoading(false);
      setWithdrawableBalance((prev) => prev - amount);
      setTotalBalance((prev) => prev - amount);
      setStatus({ 
        type: "success", 
        message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} submitted successfully. Funds will settle within 24 hours.` 
      });
      setWithdrawAmount("");
    }, 1500);
  };

  return (
    <>
      <PageIntro
        title="Wallet Ledger"
        description="Verify your balances, initiate secure bank withdrawals, and review credit logs.">
        <p className="text-sm font-semibold text-green-300">Funds are stored securely and settled under standard exchange regulations.</p>
      </PageIntro>

      {/* Account Balance Summary Cards */}
      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
          <p className="text-sm text-neutral-400 font-medium">Total Balance</p>
          <p className="mt-4 text-3xl font-extrabold text-white">₹{totalBalance.toLocaleString("en-IN")}.00</p>
          <p className="mt-2 text-xs text-neutral-500">Realized balance + pending settlements</p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)] relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-green-500/5 blur-xl"></div>
          <p className="text-sm text-green-400 font-medium">Withdrawable Balance (Realized)</p>
          <p className="mt-4 text-3xl font-extrabold text-green-300">₹{withdrawableBalance.toLocaleString("en-IN")}.00</p>
          <p className="mt-2 text-xs text-neutral-500">Only realized, settled profits can be withdrawn</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/15 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(234,179,8,0.2)] relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-yellow-500/5 blur-xl"></div>
          <p className="text-sm text-yellow-400 font-medium">Pending Settlements (Unrealized)</p>
          <p className="mt-4 text-3xl font-extrabold text-yellow-300">₹{pendingSettlements.toLocaleString("en-IN")}.00</p>
          <p className="mt-2 text-xs text-neutral-500">Floating live trades capital locked in escrow</p>
        </div>
      </section>

      {/* Main content grid */}
      <section className="grid gap-8 xl:grid-cols-2">
        {/* Withdrawal form */}
        <SectionCard 
          title="Initiate Withdrawal" 
          description="Enter an amount to withdraw settled cash straight to your registered bank account.">
          
          <form onSubmit={handleWithdrawSubmit} className="mt-5 space-y-6">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase">Withdrawal Amount (₹)</label>
              <div className="relative mt-2 rounded-xl border border-white/10 bg-white/[0.02] focus-within:border-green-500/35 transition">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₹</span>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full h-12 bg-transparent pl-8 pr-4 text-white font-mono text-lg font-bold outline-none placeholder:text-neutral-600"
                />
              </div>
            </div>

            {/* Safety instructions */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs leading-relaxed text-yellow-300/80 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-yellow-400">Strict Wallet Compliance Warning:</strong>
                <p className="mt-1">
                  Only realized profits can be withdrawn. Floating capital in active live trades (unrealized PnL) is held in escrow until trades are settled and closed. Trying to withdraw more than your realized balance will be rejected.
                </p>
              </div>
            </div>

            {status.message && (
              <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
                status.type === "success" 
                  ? "bg-green-500/10 border-green-500/20 text-green-300" 
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}>
                {status.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
                <span>{status.message}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 font-bold text-black transition hover:bg-green-400 disabled:opacity-50 cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Bank Settle Request...
                </>
              ) : (
                "Submit Withdrawal Request"
              )}
            </button>
          </form>
        </SectionCard>

        {/* Ledger logs */}
        <SectionCard 
          title="Transaction History Ledger" 
          description="Comprehensive credit auditing registry showing deposits, withdrawals, and trade payouts.">
          
          <div className="mt-5 divide-y divide-white/5">
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between py-4 hover:bg-white/[0.01] px-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    tx.type === "credit" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-400"
                  }`}>
                    {tx.type === "credit" ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{tx.desc}</p>
                    <p className="text-xs text-neutral-500">{tx.date} • <span className="text-neutral-400 font-semibold">{tx.status}</span></p>
                  </div>
                </div>
                
                <span className={`font-mono font-bold text-base ${
                  tx.type === "credit" ? "text-green-300" : "text-red-400"
                }`}>
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
      <Disclaimer />
    </>
  );
}
