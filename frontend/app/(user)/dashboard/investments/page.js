"use client";

import { useState, useEffect } from "react";
import { Landmark, ArrowRight, Loader2, Coins, Calendar, Wallet, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";

export default function UserInvestmentPlansPage() {
  const wallet = useAdminStore((s) => s.wallet);
  const fetchData = useAdminStore((s) => s.fetchData);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Investment Modal
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast notifier
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/investments/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        triggerToast("Failed to fetch available investment plans.", "error");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error fetching plans.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    fetchData(); // load/refresh wallet
  }, [fetchData]);

  const handleInvestClick = (plan) => {
    setSelectedPlan(plan);
    setAmount(String(plan.minAmount));
    setIsModalOpen(true);
  };

  const handleSubmitInvestment = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      triggerToast("Please enter a valid investment amount.", "error");
      return;
    }

    const numAmount = Number(amount);
    if (numAmount < selectedPlan.minAmount || numAmount > selectedPlan.maxAmount) {
      triggerToast(
        `Investment must be between ₹${selectedPlan.minAmount.toLocaleString()} and ₹${selectedPlan.maxAmount.toLocaleString()}.`,
        "error"
      );
      return;
    }

    const available = wallet ? Number(wallet.availableBalance) : 0;
    if (available < numAmount) {
      triggerToast("Insufficient wallet balance to proceed.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: numAmount,
        }),
      });

      if (res.ok) {
        triggerToast("Investment purchased successfully! Your balance has been updated.", "success");
        setIsModalOpen(false);
        fetchData(); // reload wallet
      } else {
        const errorData = await res.json();
        triggerToast(errorData.message || "Failed to finalize investment.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An unexpected error occurred during payment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const availableBalance = wallet ? Number(wallet.availableBalance) : 0;
  const isBalanceInsufficient = selectedPlan ? availableBalance < Number(amount) : false;

  return (
    <section className="space-y-6 font-sans">
      {/* Toast notifications */}
      {toast.show && (
        <div
          className={`fixed right-5 top-24 z-50 rounded-lg border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl transition-all duration-300 transform scale-100 ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header Info widget */}
      <article className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-r from-[#06120e] to-[#020907] p-6 shadow-[0_0_50px_-25px_rgba(34,197,94,0.35)]">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-3xl"></div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/20">
              <Landmark className="h-3.5 w-3.5" />
              Investment Products
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">Yield Generation Plans</h1>
            <p className="mt-2 text-sm text-neutral-400 max-w-xl">
              Lock in your idle capital into active yields managed by automated robot strategies. Pick a portfolio below to start earning weekly dividends.
            </p>
          </div>
          
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 min-w-[200px] backdrop-blur flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20 text-green-300">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">Available Balance</p>
              <p className="text-xl font-extrabold text-white font-mono leading-none mt-1">
                ₹{availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* Grid List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className="rounded-2xl border border-white/10 bg-[#07100d]/95 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)] relative overflow-hidden group flex flex-col justify-between"
            >
              <div>
                {/* Banner Image or default */}
                {plan.image ? (
                  <div className="h-44 w-full relative overflow-hidden border-b border-white/5">
                    <img
                      src={plan.image}
                      alt={plan.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent"></div>
                    <span className="absolute right-4 bottom-4 inline-flex items-center gap-1 rounded bg-green-500 px-2.5 py-1 text-xs font-black text-black shadow-lg">
                      {plan.weeklyProfit}% Weekly
                    </span>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-[#0a1e16] to-[#040e0b] relative flex items-center justify-center border-b border-white/5">
                    <Coins className="h-12 w-12 text-green-500/20 group-hover:scale-110 transition duration-300" />
                    <span className="absolute right-4 bottom-4 inline-flex items-center gap-1 rounded bg-green-500 px-2.5 py-1 text-xs font-black text-black shadow-lg">
                      {plan.weeklyProfit}% Weekly
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-white leading-tight group-hover:text-green-300 transition">
                      {plan.name}
                    </h3>
                    {plan.description && <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{plan.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-white/5 py-3 text-xs">
                    <div>
                      <span className="block text-neutral-500">Lock Period</span>
                      <span className="block font-bold text-white mt-0.5">{plan.lockPeriod} Days</span>
                    </div>
                    <div>
                      <span className="block text-neutral-500">Referral Bonus</span>
                      <span className="block font-bold text-blue-400 mt-0.5">+{plan.referralBonus}% Reward</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Min Investment:</span>
                      <span className="font-semibold font-mono">₹{plan.minAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Max Investment:</span>
                      <span className="font-semibold font-mono">₹{plan.maxAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => handleInvestClick(plan)}
                  className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-bold text-black hover:bg-green-400 transition active:scale-95 shadow-[0_4px_20px_rgba(34,197,94,0.2)]"
                >
                  Invest Now
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
          {plans.length === 0 && (
            <div className="col-span-full text-center py-16 text-neutral-500 bg-white/[0.005] border border-white/10 rounded-2xl">
              No active investment products are currently open for subscriptions. Check back later.
            </div>
          )}
        </div>
      )}

      {/* CONFIRM INVESTMENT DIALOG MODAL */}
      {isModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmitInvestment}
            className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Subscribe to Plan</h3>
                <p className="text-xs text-neutral-500 mt-1">{selectedPlan.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Wallet context */}
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 flex justify-between items-center text-xs">
              <div>
                <span className="block text-neutral-500">Available Wallet Balance</span>
                <span className="block text-base font-extrabold text-white mt-1 font-mono">
                  ₹{availableBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-neutral-500">Minimum Limit</span>
                <span className="block font-bold text-neutral-300 mt-1 font-mono">
                  ₹{selectedPlan.minAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">
                  Enter Investment Amount (₹) *
                </span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min ₹${selectedPlan.minAmount.toLocaleString()}`}
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/25 px-3 text-sm text-white outline-none focus:border-green-500/50 font-mono"
                />
              </label>

              {/* Validation helper alerts */}
              {isBalanceInsufficient ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5 animate-bounce" />
                  <div>
                    <span className="font-bold">Insufficient funds:</span> The input amount exceeds your cash wallet balance. Please make a deposit first.
                  </div>
                </div>
              ) : Number(amount) < selectedPlan.minAmount || Number(amount) > selectedPlan.maxAmount ? (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-xs text-yellow-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Invalid range:</span> Amount must be between ₹{selectedPlan.minAmount.toLocaleString()} and ₹{selectedPlan.maxAmount.toLocaleString()}.
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-xs text-neutral-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-green-300 font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Yield Validation Check Passed
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Investing ₹{Number(amount).toLocaleString()} yields <span className="text-white font-bold">₹{((Number(amount) * selectedPlan.weeklyProfit) / 100).toLocaleString()}/week</span>. Funds will remain locked for {selectedPlan.lockPeriod} days.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-5 text-sm font-bold text-neutral-300 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || isBalanceInsufficient || Number(amount) < selectedPlan.minAmount || Number(amount) > selectedPlan.maxAmount}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-green-500 px-5 text-sm font-bold text-black hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Investment"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
