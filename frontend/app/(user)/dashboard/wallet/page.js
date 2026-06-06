"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import { ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { apiFetch } from "../../../../lib/apiFetch";

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  
  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [accountDetails, setAccountDetails] = useState("");
  const [notes, setNotes] = useState("");
  
  const [status, setStatus] = useState({ type: null, message: "" });

  const fetchWalletData = useCallback(async () => {
    try {
      const [walletRes, withdrawalsRes] = await Promise.all([
        apiFetch("/api/wallet"),
        apiFetch("/api/wallet/withdrawals")
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }
      
      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json();
        setWithdrawals(withdrawalsData);
      }
    } catch (e) {
      console.error("Error fetching wallet data:", e);
      setStatus({ type: "error", message: "Failed to load wallet data. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setStatus({ type: "error", message: "Please enter a valid positive withdrawal amount." });
      return;
    }
    if (wallet && amount > Number(wallet.balance)) {
      setStatus({ 
        type: "error", 
        message: `Withdrawal limit exceeded. You can only withdraw up to ₹${Number(wallet.balance).toLocaleString("en-IN")} (Available balance).` 
      });
      return;
    }

    if (!accountDetails.trim()) {
      setStatus({ type: "error", message: "Account details are required to process the withdrawal." });
      return;
    }
    
    setSubmitting(true);
    setStatus({ type: null, message: "" });
    
    try {
      const res = await apiFetch("/api/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method,
          accountDetails,
          notes: notes.trim() || undefined,
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatus({
          type: "success",
          message: `Withdrawal request for ₹${amount.toLocaleString("en-IN")} has been submitted successfully.`
        });
        setWithdrawAmount("");
        setAccountDetails("");
        setNotes("");
        // Re-fetch data instantly
        await fetchWalletData();
      } else {
        setStatus({
          type: "error",
          message: data.message || "Failed to submit withdrawal request."
        });
      }
    } catch (e) {
      console.error("Withdrawal error:", e);
      setStatus({ type: "error", message: "A network error occurred. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (statusStr) => {
    const s = String(statusStr).toUpperCase();
    if (s === "PENDING") {
      return (
        <span className="rounded bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold text-yellow-300 border border-yellow-500/20">
          PENDING
        </span>
      );
    } else if (s === "APPROVED" || s === "COMPLETED") {
      return (
        <span className="rounded bg-green-500/10 px-2.5 py-0.5 text-xs font-bold text-green-300 border border-green-500/20">
          APPROVED
        </span>
      );
    } else if (s === "REJECTED") {
      return (
        <span className="rounded bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-300 border border-red-500/20">
          REJECTED
        </span>
      );
    } else if (s === "PROCESSING") {
      return (
        <span className="rounded bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-300 border border-blue-500/20">
          PROCESSING
        </span>
      );
    } else {
      return (
        <span className="rounded bg-neutral-500/10 px-2.5 py-0.5 text-xs font-bold text-neutral-400 border border-neutral-500/20">
          {s}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-400" />
          <p className="text-sm text-neutral-400">Loading secure wallet ledger...</p>
        </div>
      </div>
    );
  }

  const availableBalance = wallet ? Number(wallet.balance) : 0;
  const rewardBalance = wallet ? Number(wallet.rewardBalance) : 0;
  const totalBalance = wallet ? Number(wallet.totalBalance) : 0;
  const pendingWithdrawals = wallet ? Number(wallet.pendingWithdrawals) : 0;
  const currentEquity = wallet ? Number(wallet.currentEquity) : 0;
  const totalWithdrawn = wallet ? Number(wallet.totalWithdrawn) : 0;

  return (
    <>
      <PageIntro
        title="Wallet Ledger"
        description="Verify your balances, initiate secure bank withdrawals, and review credit logs.">
        <p className="text-sm font-semibold text-green-300">Funds are stored securely and settled under standard exchange regulations.</p>
      </PageIntro>

      {/* Account Balance Summary Cards */}
      <section className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 mt-6">
        <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)] relative overflow-hidden">
          <p className="text-sm text-green-400 font-medium">Total Balance</p>
          <p className="mt-4 text-3xl font-extrabold text-green-300">₹{totalBalance.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-neutral-500">Available Balance + Reward Balance</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-emerald-500/5 blur-xl"></div>
          <p className="text-sm text-emerald-400 font-medium">Available Balance</p>
          <p className="mt-4 text-3xl font-extrabold text-emerald-300">₹{availableBalance.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-neutral-500">Realized funds available for immediate withdrawal</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-teal-500/5 blur-xl"></div>
          <p className="text-sm text-teal-400 font-medium">Reward Balance</p>
          <p className="mt-4 text-3xl font-extrabold text-teal-300">₹{rewardBalance.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-neutral-500">Referral, campaign, and bonus earnings</p>
        </div>
        <div className="rounded-2xl border border-yellow-500/15 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(234,179,8,0.2)] relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-yellow-500/5 blur-xl"></div>
          <p className="text-sm text-yellow-400 font-medium">Pending Withdrawals</p>
          <p className="mt-4 text-3xl font-extrabold text-yellow-300">₹{pendingWithdrawals.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-neutral-500">Reserved balance locked in review</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-white/5 blur-xl"></div>
          <p className="text-sm text-neutral-400 font-medium">Current Equity</p>
          <p className="mt-4 text-3xl font-extrabold text-white">₹{currentEquity.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-neutral-500">Total account value</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-white/5 blur-xl"></div>
          <p className="text-sm text-neutral-400 font-medium">Total Withdrawn</p>
          <p className="mt-4 text-3xl font-extrabold text-neutral-300">₹{totalWithdrawn.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs text-neutral-500">Cumulative processed payouts history</p>
        </div>
      </section>

      {/* Main content grid */}
      <section className="grid gap-8 xl:grid-cols-2 mt-8">
        {/* Withdrawal form */}
        <SectionCard 
          title="Initiate Withdrawal" 
          description="Enter an amount to withdraw settled cash straight to your account.">
          
          <form onSubmit={handleWithdrawSubmit} className="mt-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Withdrawal Amount (₹)</label>
              <div className="relative mt-2 rounded-xl border border-white/10 bg-white/[0.02] focus-within:border-green-500/35 transition">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">₹</span>
                <input 
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full h-12 bg-transparent pl-8 pr-4 text-white font-mono text-lg font-bold outline-none placeholder:text-neutral-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Withdrawal Method</label>
                <div className="relative mt-2 rounded-xl border border-white/10 bg-white/[0.02] transition">
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full h-12 bg-[#07100d] px-4 text-sm text-white outline-none rounded-xl focus:border-green-500/35 cursor-pointer appearance-none"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="crypto">Crypto (USDT)</option>
                    <option value="upi">UPI Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Notes (Optional)</label>
                <div className="relative mt-2 rounded-xl border border-white/10 bg-white/[0.02] transition">
                  <input 
                    type="text"
                    placeholder="Reference notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-12 bg-transparent px-4 text-sm text-white outline-none placeholder:text-neutral-600"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Account Details</label>
              <div className="relative mt-2 rounded-xl border border-white/10 bg-white/[0.02] focus-within:border-green-500/35 transition">
                <textarea 
                  placeholder={
                    method === "bank_transfer" ? "Bank Name: ABC Bank\nAccount Number: XXXXXX\nIFSC Code: ABCD0123456\nAccount Holder: John Doe" :
                    method === "crypto" ? "USDT Address (TRC20): TXYZ123ABC..." :
                    "UPI ID: username@bank"
                  }
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  className="w-full h-28 bg-transparent p-4 text-sm text-white outline-none placeholder:text-neutral-600 resize-none font-mono"
                  required
                />
              </div>
            </div>

            {/* Safety instructions */}
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs leading-relaxed text-yellow-300/80 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-yellow-400 font-bold">Strict Wallet Compliance Warning:</strong>
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
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 font-bold text-black transition hover:bg-green-400 disabled:opacity-50 cursor-pointer">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing Payout Request...
                </>
              ) : (
                "Submit Withdrawal Request"
              )}
            </button>
          </form>
        </SectionCard>

        {/* Ledger logs */}
        <SectionCard 
          title="Withdrawal Status Table" 
          description="Comprehensive credit auditing registry showing status of your withdrawal requests.">
          
          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-white/[0.08] text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-2">Request ID</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Method</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-neutral-500 text-sm">
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w, index) => (
                    <tr key={index} className="hover:bg-white/[0.01] transition">
                      <td className="py-4 px-2 font-mono font-bold text-white text-xs">{w.withdrawalId}</td>
                      <td className="py-4 px-2 font-mono font-bold text-white">₹{w.amount.toLocaleString("en-IN")}</td>
                      <td className="py-4 px-2 text-xs capitalize">{w.method ? w.method.replace("_", " ") : "Bank Transfer"}</td>
                      <td className="py-4 px-2">{getStatusBadge(w.status)}</td>
                      <td className="py-4 px-2 text-xs text-neutral-500">{new Date(w.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </section>
      <Disclaimer />
    </>
  );
}
