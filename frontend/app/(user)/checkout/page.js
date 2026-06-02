"use client";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  CircleCheck,
  Clock3,
  Copy,
  Crown,
  Headphones,
  Info,
  LockKeyhole,
  QrCode,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../../../hooks/adminStore";
import { apiFetch } from "../../../lib/apiFetch";

// Pricing plans are dynamically loaded from the database via Zustand store.

const instructions = [
  ["Make Exact Payment", "Please pay the exact amount shown above. Different amounts may be auto-rejected."],
  ["Use USDT Only", "Please send USDT only. UPI, bank transfer, and other payment methods are not accepted."],
  ["Submit Transaction ID", "Enter the correct USDT transaction ID to help us verify your payment quickly."],
  ["Wait for Verification", "Your payment will be verified within 5-30 minutes after submission."],
];

function QrPattern() {
  const cells = useMemo(() => Array.from({ length: 225 }, (_, index) => {
    const row = Math.floor(index / 15);
    const col = index % 15;
    const finder =
      (row < 5 && col < 5) ||
      (row < 5 && col > 9) ||
      (row > 9 && col < 5);
    return finder || (row * 7 + col * 11 + row * col) % 5 < 2;
  }), []);

  return (
    <div className="grid aspect-square w-full max-w-[190px] grid-cols-[repeat(15,minmax(0,1fr))] gap-0.5 rounded-xl bg-white p-3 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
      {cells.map((filled, index) => (
        <span key={index} className={filled ? "rounded-[1px] bg-black" : "rounded-[1px] bg-white"} />
      ))}
      <span className="col-start-7 row-start-7 col-span-3 row-span-3 flex items-center justify-center rounded-md bg-white text-green-500">
        <BadgeDollarSign className="h-7 w-7" />
      </span>
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-3 text-sm last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className={highlight ? "font-bold text-green-300" : "font-semibold text-white"}>{value}</span>
    </div>
  );
}

// --- Payment Status Polling Component ---
function PaymentStatusView({ moveToStep }) {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/dashboard/my-payment-status");
      if (res.ok) {
        const data = await res.json();
        setPaymentData(data);
        setError(null);

        // Stop polling once in a terminal state
        if (data.found && (data.status === "APPROVED" || data.status === "REJECTED")) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        setError("Unable to fetch payment status");
      }
    } catch (e) {
      setError("Network error while checking status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStatus]);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-6 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          <RefreshCw className="h-8 w-8 animate-spin text-neutral-400" />
        </span>
        <p className="mt-6 text-sm text-neutral-400">Checking payment status...</p>
      </section>
    );
  }

  if (error || !paymentData || !paymentData.found) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-6 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
          <Info className="h-8 w-8 text-neutral-400" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-white">No Payment Found</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-400">
          {error || "We couldn't find any payment submissions for your account. Please complete the payment step first."}
        </p>
        <button
          type="button"
          onClick={() => moveToStep("payment")}
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400"
        >
          Go to Payment
        </button>
      </section>
    );
  }

  const { status, planName, amount, remark, adminNote, txnHash, createdAt } = paymentData;
  const adminRemark = remark || adminNote;
  const formattedAmount = amount
    ? `INR ${Number(amount).toLocaleString("en-IN")}`
    : "--";
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "--";

  // APPROVED STATE
  if (status === "APPROVED") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-green-500/30 bg-[#0A0A0A]/95 p-6 text-center shadow-[0_0_80px_-30px_rgba(34,197,94,0.5)] sm:p-10">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <CircleCheck className="h-10 w-10" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-green-300">Status: Approved</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Subscription Activated!</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">
          Your payment of <strong className="text-green-300">{formattedAmount}</strong> for <strong className="text-white">{planName}</strong> has been verified and approved. Your premium features are now unlocked.
        </p>

        <div className="mt-7 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="grid gap-3 text-left sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-neutral-500">Plan</p>
              <p className="mt-1 text-sm font-bold text-white">{planName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">Amount Paid</p>
              <p className="mt-1 text-sm font-bold text-green-300">{formattedAmount}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">Submitted</p>
              <p className="mt-1 text-sm font-bold text-white">{formattedDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-8 text-sm font-bold text-black transition hover:bg-green-400"
          >
            Go To Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="/dashboard/subscription"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            View Subscription
          </a>
        </div>
      </section>
    );
  }

  // REJECTED STATE
  if (status === "REJECTED") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-[#0A0A0A]/95 p-6 text-center shadow-[0_0_80px_-30px_rgba(239,68,68,0.4)] sm:p-10">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15 text-red-400">
          <XCircle className="h-10 w-10" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-red-300">Status: Rejected</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Payment Verification Failed</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">
          Your payment of <strong className="text-red-300">{formattedAmount}</strong> for <strong className="text-white">{planName}</strong> could not be verified.
        </p>

        {adminRemark && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-red-300">Admin Note</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">{adminRemark}</p>
          </div>
        )}

        <div className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 text-left sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-neutral-500">Plan</p>
              <p className="mt-1 text-sm font-bold text-white">{planName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">Amount</p>
              <p className="mt-1 text-sm font-bold text-red-300">{formattedAmount}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-500">Submitted</p>
              <p className="mt-1 text-sm font-bold text-white">{formattedDate}</p>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => moveToStep("payment")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-red-500 px-8 text-sm font-bold text-white transition hover:bg-red-400"
          >
            Upload New Payment Proof
            <ArrowRight className="h-4 w-4" />
          </button>
          <a
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            Back to Pricing
          </a>
        </div>
      </section>
    );
  }

  // VERIFIED STATE
  if (status === "VERIFIED") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-blue-400/20 bg-[#0A0A0A]/95 p-6 text-center shadow-[0_0_70px_-30px_rgba(96,165,250,0.45)] sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-400/10 text-blue-300">
          <ShieldCheck className="h-8 w-8" />
        </span>
        <p className="mt-6 text-sm font-bold uppercase tracking-widest text-blue-300">Status: Verified</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Payment Verified</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">
          Your payment details have been verified. Awaiting final approval from the administrator. This page updates automatically.
        </p>

        <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <ShieldCheck className="h-5 w-5 text-blue-300" />
            <p className="mt-3 text-sm font-semibold text-white">Details Verified</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">Transaction ID and payment amount have been confirmed.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Clock3 className="h-5 w-5 text-blue-300" />
            <p className="mt-3 text-sm font-semibold text-white">Awaiting Approval</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">Admin will finalize your subscription activation shortly.</p>
          </div>
        </div>

        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={fetchStatus}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-bold text-white transition hover:bg-white/[0.08]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </button>
        </div>

        <p className="mt-4 text-xs text-neutral-600">Auto-refreshing every 15 seconds</p>
      </section>
    );
  }

  // PENDING STATE (default)
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-yellow-400/20 bg-[#0A0A0A]/95 p-6 text-center shadow-[0_0_70px_-30px_rgba(250,204,21,0.45)] sm:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-300">
        <Clock3 className="h-8 w-8 animate-pulse" />
      </span>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-yellow-300">Status: Pending Approval</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Your payment is under review</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-neutral-400">
        We have received your payment of <strong className="text-yellow-200">{formattedAmount}</strong> for <strong className="text-white">{planName}</strong>. Premium features remain locked until the admin verifies your USDT transaction.
      </p>

      {txnHash && (
        <div className="mx-auto mt-5 max-w-md rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs font-semibold text-neutral-500">Transaction ID</p>
          <p className="mt-1 break-all text-sm font-mono text-white">{txnHash}</p>
        </div>
      )}

      <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <WalletCards className="h-5 w-5 text-green-300" />
          <p className="mt-3 text-sm font-semibold text-white">Check payment status</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">This page auto-refreshes every 15 seconds to show the latest status.</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <QrCode className="h-5 w-5 text-green-300" />
          <p className="mt-3 text-sm font-semibold text-white">Access locked for now</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">No premium trading access is enabled during review.</p>
        </div>
      </div>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={fetchStatus}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </button>
        <a href="/pricing" className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-bold text-white transition hover:bg-white/[0.08]">
          Back to Pricing
        </a>
      </div>
      <p className="mt-4 text-xs text-neutral-600">Auto-refreshing every 15 seconds</p>
    </section>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const addPayment = useAdminStore((s) => s.addPayment);
  const storePlans = useAdminStore((s) => s.plans || []);
  const fetchPlans = useAdminStore((s) => s.fetchPlans);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const plans = useMemo(() => {
    const map = {};
    storePlans.forEach((p) => {
      const slug = p.name.split(" ")[0].toLowerCase();
      let gradient = "from-cyan-500/25 to-green-500/10";
      if (slug === "club") {
        gradient = "from-green-500/25 to-emerald-500/10";
      } else if (slug === "individual") {
        gradient = "from-violet-500/30 to-green-500/10";
      }

      let profitFee = "Custom";
      const feeFeature = p.features.find(f => f.toLowerCase().includes("fee"));
      if (feeFeature) {
        const match = feeFeature.match(/\d+%/);
        if (match) profitFee = match[0];
      }

      let amount = "Manual Review";
      if (slug === "club") amount = "$100.00";
      else if (slug === "individual") amount = "$1,000.00";

      map[slug] = {
        name: p.name,
        subtitle: p.subtitle,
        description: p.desc,
        capital: p.capitalLabel,
        profitFee,
        planType: slug === "custom" ? "Consultation" : "Monthly",
        amount,
        gradient,
        popular: p.isPopular,
      };
    });

    // Static fallbacks
    if (!map.club) {
      map.club = {
        name: "Club Plan",
        subtitle: "Micro Capital",
        description: "Ideal plan for new traders starting out with small test capital.",
        capital: "$10 - $100",
        profitFee: "5%",
        planType: "Monthly",
        amount: "$100.00",
        gradient: "from-green-500/25 to-emerald-500/10",
      };
    }
    if (!map.individual) {
      map.individual = {
        name: "Individual Plan",
        subtitle: "Full Access",
        description: "For advanced traders who require priority execution and higher capital limits.",
        capital: "$1000+",
        profitFee: "4%",
        planType: "Monthly",
        amount: "$1,000.00",
        gradient: "from-violet-500/30 to-green-500/10",
        popular: true,
      };
    }
    if (!map.custom) {
      map.custom = {
        name: "Custom Plan",
        subtitle: "Tailored Capital Setup",
        description: "A flexible trading setup with a custom capital range and fee agreement.",
        capital: "Flexible",
        profitFee: "Custom",
        planType: "Consultation",
        amount: "Manual Review",
        gradient: "from-cyan-500/25 to-green-500/10",
      };
    }
    return map;
  }, [storePlans]);

  const [ready, setReady] = useState(false);
  const [planSlug, setPlanSlug] = useState("individual");
  const [step, setStep] = useState("payment");
  const [paymentUser, setPaymentUser] = useState({ name: "Guest", email: "" });
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const plan = plans[planSlug] || plans.individual;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedPlan = plans[params.get("plan")] ? params.get("plan") : "individual";
    const selectedStep = ["payment", "status"].includes(params.get("step")) ? params.get("step") : "payment";
    const isAuthenticated = localStorage.getItem("tradebot-authenticated") === "true";

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(`/checkout?plan=${selectedPlan}&step=payment`)}`);
      return;
    }

    queueMicrotask(() => {
      setPlanSlug(selectedPlan);
      setStep(selectedStep);
      setReady(true);
    });
  }, [router, plans]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("tradebot-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setPaymentUser({
            name: parsed.name || "Guest",
            email: parsed.email || ""
          });
        }
      } catch {
        setPaymentUser({ name: "Guest", email: "" });
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    };
  }, [screenshotPreview]);

  const moveToStep = (nextStep) => {
    setStep(nextStep);
    window.history.pushState(null, "", `/checkout?plan=${planSlug}&step=${nextStep}`);
  };

  const copyWalletAddress = () => {
    navigator.clipboard?.writeText("TXYZ123ABC456DEF789GHI");
  };

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview);
    setScreenshotName(file.name);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-neutral-900/50 p-8 text-center">
          <Clock3 className="mx-auto h-8 w-8 animate-pulse text-green-300" />
          <p className="mt-4 text-sm text-neutral-400">Preparing your checkout...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-green-300">
              <LockKeyhole className="h-4 w-4" />
              Secure payment processing via USDT
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {step === "payment" ? "Complete Your Payment" : "Payment Under Review"}
            </h1>
          </div>
          <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-xs font-bold text-neutral-400">
            {["payment", "status"].map((item, index) => (
              <span key={item} className={`rounded-full px-3 py-2 ${step === item ? "bg-green-500 text-black" : ""}`}>
                {index + 1}. {item}
              </span>
            ))}
          </div>
        </div>

        {step === "payment" && (
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-green-300" />
                  <p className="text-sm leading-relaxed text-neutral-300">
                    Complete the payment using USDT and submit only your transaction ID for verification.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6">
                <h2 className="text-lg font-semibold text-white">1. Pay Using USDT</h2>
                <p className="mt-1 text-sm text-neutral-500">Send USDT to the wallet address below. Only USDT payments are accepted.</p>
                <div className="mt-5 grid gap-5 md:grid-cols-[210px_1fr]">
                  <QrPattern />
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-neutral-500">USDT Wallet Address</p>
                      <button
                        type="button"
                        onClick={copyWalletAddress}
                        className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-sm font-semibold text-white">
                        TXYZ123ABC456DEF789GHI
                        <Copy className="h-4 w-4 text-neutral-500" />
                      </button>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-500">Network</p>
                      <p className="mt-1 text-lg font-bold tracking-tight text-white">TRC20</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-500">Amount to Pay</p>
                      <p className="mt-1 text-3xl font-bold tracking-tight text-green-300">{plan.amount}</p>
                    </div>
                    <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-neutral-400">
                      Note: Please send the exact USDT amount and use the correct network.
                    </p>
                  </div>
                </div>
              </div>

              <form
                className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (isSubmittingPayment) return;

                  const formData = new FormData(event.currentTarget);
                  const txnHash = String(formData.get("txnHash") || "").trim();
                  if (txnHash) {
                    setIsSubmittingPayment(true);
                    setPaymentError("");
                    const created = await addPayment({
                      user: paymentUser.name,
                      email: paymentUser.email,
                      plan: `${plan.name} ${plan.planType}`,
                      amount: plan.amount,
                      txnHash,
                      screenshot: screenshotPreview,
                      network: "TRC20",
                      paymentType: "USDT"
                    });
                    setIsSubmittingPayment(false);
                    if (!created) {
                      setPaymentError("Payment submission failed. Please check your login and try again.");
                      return;
                    }
                  }
                  moveToStep("status");
                }}>
                <h2 className="text-lg font-semibold text-white">2. Enter Payment Details</h2>
                <p className="mt-1 text-sm text-neutral-500">After payment, provide the transaction details below.</p>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-white">USDT Transaction ID</span>
                  <input
                    name="txnHash"
                    required
                    type="text"
                    placeholder="Enter USDT transaction ID"
                    className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-green-500/50"
                  />
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-white">Upload Payment Screenshot (Optional)</span>
                  <span className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-5 text-center text-sm text-neutral-400 transition hover:border-green-500/35">
                    {screenshotPreview ? (
                      <span className="flex w-full flex-col items-center gap-3">
                        <img src={screenshotPreview} alt="Payment screenshot preview" className="max-h-56 w-full rounded-lg object-contain" />
                        <span className="text-xs font-semibold text-green-300">{screenshotName}</span>
                      </span>
                    ) : (
                      <>
                        <UploadCloud className="mb-2 h-6 w-6 text-neutral-500" />
                        Click to upload payment screenshot
                        <span className="mt-1 text-xs text-neutral-600">PNG, JPG or JPEG. Max 5MB.</span>
                      </>
                    )}
                    <input type="file" accept="image/png,image/jpeg" onChange={handleScreenshotChange} className="sr-only" />
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-white">Optional Note</span>
                  <textarea placeholder="Write any note (optional)" className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-green-500/50" />
                </label>

                {paymentError && (
                  <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">
                    {paymentError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 text-sm font-bold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-neutral-600 disabled:text-neutral-300"
                >
                  {isSubmittingPayment ? "Submitting Payment..." : "Submit Payment"}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Your payment information is secure and encrypted.
                </p>
              </form>
            </section>

            <aside className="space-y-5">
              <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5">
                <h2 className="text-lg font-semibold text-white">Plan Summary</h2>
                <div className={`mt-5 rounded-xl border border-white/10 bg-gradient-to-br ${plan.gradient} p-5`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <Crown className="h-6 w-6 text-white" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <p className="text-xs font-semibold text-green-200">{plan.subtitle}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-300">{plan.description}</p>
                  <div className="mt-4">
                    <SummaryRow label="Capital Range" value={plan.capital} />
                    <SummaryRow label="Profit Fee" value={plan.profitFee} highlight />
                    <SummaryRow label="Plan Type" value={plan.planType} />
                    <SummaryRow label="Amount to Pay" value={plan.amount} highlight />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="h-8 w-8 shrink-0 text-green-300" />
                  <div>
                    <h2 className="font-semibold text-green-300">Secure Payment</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">Your payment is protected with 256-bit SSL encryption.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-neutral-300">
                  {["USDT Only", "Transaction ID Verification", "Safe & Trusted Platform"].map((item) => (
                    <p key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-300" />
                      {item}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5">
                <div className="flex gap-3">
                  <Headphones className="h-7 w-7 shrink-0 text-neutral-400" />
                  <div>
                    <h2 className="font-semibold text-white">Need Help?</h2>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">If you face any issues while making payment, contact our support team.</p>
                  </div>
                </div>
                <a href="/dashboard/support" className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] text-sm font-bold text-white transition hover:bg-white/[0.08]">
                  <Headphones className="h-4 w-4" />
                  Contact Support
                </a>
              </div>
            </aside>
          </div>
        )}

        {step === "status" && (
          <PaymentStatusView moveToStep={moveToStep} />
        )}

        {step === "payment" && (
          <section className="mt-5 rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Info className="h-4 w-4 text-green-300" />
              Important Instructions
            </h2>
            <div className="mt-5 grid gap-4 md:grid-cols-4">
              {instructions.map(([title, text]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-500">{text}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

