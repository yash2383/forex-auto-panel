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
import { calculateCheckoutPreviewUI } from "../../../lib/calculateCheckoutPreviewUI";

// Pricing plans are dynamically loaded from the database via Zustand store.
// instructions are dynamically computed based on selectedMethod inside the component

const PLAN_MIN_AMOUNTS = {
  club: 10,
  individual: 1000,
  custom: 5000,
};

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
function PaymentStatusView({ moveToStep, onStatusLoaded }) {
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
        if (onStatusLoaded && (data.found || data.status)) {
          onStatusLoaded(data.status);
        }
        setError(null);

        // Stop polling once in a terminal state
        if ((data.found || data.status) && (data.status === "APPROVED" || data.status === "REJECTED")) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } else {
        if (res.status === 401) {
          localStorage.removeItem("tradebot-user");
          localStorage.removeItem("tradebot-authenticated");
          document.cookie = 'tradebot-token=; path=/; max-age=0; SameSite=Lax';
          router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          return;
        }
        setError("Unable to fetch payment status");
      }
    } catch (e) {
      setError("Network error while checking status");
    } finally {
      setLoading(false);
    }
  }, [onStatusLoaded, router]);

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

  // Error fetching status (res.ok is false or exception thrown)
  if (error) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-[#0A0A0A]/95 p-8 text-center shadow-[0_0_80px_-30px_rgba(239,68,68,0.2)] sm:p-12">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400">
          <Info className="h-8 w-8" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-white">Unable to fetch payment status</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-400">
          {error === "Unable to fetch payment status"
            ? "We encountered an issue retrieving your transaction verification records. Please try again."
            : error}
        </p>
        <button
          type="button"
          onClick={fetchStatus}
          className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Check
        </button>
      </section>
    );
  }

  const hasPayment = paymentData && (paymentData.found || paymentData.status);

  // Truly never submitted payment: paymentData is loaded but found is false and status is null
  if (!paymentData || !hasPayment) {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-6 text-center sm:p-10">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
          <Info className="h-8 w-8 text-neutral-400" />
        </span>
        <h2 className="mt-6 text-2xl font-semibold text-white">No Payment Found</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-neutral-400">
          We couldn't find any payment submissions for your account. Please complete the payment step first.
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

  const { status, plan, planName, amount, remark, adminNote, txnHash, createdAt } = paymentData;
  const adminRemark = remark || adminNote;
  const formattedAmount = amount
    ? `USD ${Number(amount).toLocaleString("en-US")}`
    : "--";
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "--";

  // APPROVED STATE
  if (status === "APPROVED") {
    const rawPlanName = plan || planName || "Individual";
    const formattedPlan = rawPlanName.charAt(0).toUpperCase() + rawPlanName.slice(1);

    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-green-500/30 bg-[#0A0A0A]/95 p-8 text-center shadow-[0_0_80px_-30px_rgba(34,197,94,0.5)] sm:p-12">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
          <CircleCheck className="h-12 w-12" />
        </span>
        
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-green-400 sm:text-4xl animate-pulse">
          🎉 Congratulations!
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-300">
          Your subscription has been activated successfully.
        </p>

        <div className="mx-auto mt-8 max-w-xs rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left space-y-4">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-sm">Plan:</span>
            <span className="text-sm font-bold text-white">{formattedPlan}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-sm">Status:</span>
            <span className="text-sm font-bold text-green-400">Active</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-8 text-sm font-bold text-black transition hover:bg-green-400 hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  // REJECTED STATE
  if (status === "REJECTED" || status === "FAILED") {
    return (
      <section className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-[#0A0A0A]/95 p-8 text-center shadow-[0_0_80px_-30px_rgba(239,68,68,0.4)] sm:p-12">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-red-400 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
          <XCircle className="h-12 w-12" />
        </span>
        
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-red-400 sm:text-4xl">
          Payment Rejected
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-300">
          Unfortunately your payment could not be verified.
        </p>

        {adminRemark && (
          <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-red-300">Reason</p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-300">{adminRemark}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => moveToStep("payment")}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400 hover:scale-[1.02] active:scale-[0.98]"
          >
            Submit New Payment
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    );
  }

  // PENDING / VERIFIED / UNDER_REVIEW / DEFAULT STATE
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-yellow-500/30 bg-[#0A0A0A]/95 p-8 text-center shadow-[0_0_80px_-30px_rgba(250,204,21,0.3)] sm:p-12">
      <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-300 shadow-[0_0_40px_rgba(250,204,21,0.15)] mb-6">
        <Clock3 className="h-12 w-12 animate-pulse" />
      </span>
      
      <h2 className="text-2xl font-bold text-white mb-2">Payment Under Review</h2>

      <div className="flex flex-col items-center gap-2 text-sm text-neutral-400 mb-6 font-semibold">
        <span className="flex items-center gap-1.5 text-green-400">
          <Check className="h-4 w-4 stroke-[3px]" /> Payment Submitted
        </span>
        <span className="flex items-center gap-1.5 text-yellow-400">
          <Clock3 className="h-4 w-4 animate-spin" /> Awaiting Admin Verification
        </span>
      </div>

      <p className="mx-auto max-w-md text-sm text-neutral-400 leading-relaxed">
        Your payment request has been received successfully. Our team is reviewing your payment details.
        This process may take a few minutes to several hours depending on verification requirements.
      </p>

      <p className="mt-4 text-xs text-neutral-500 font-medium">
        You will receive a notification once your payment has been approved.
      </p>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-8 text-sm font-bold text-black transition hover:bg-green-400 hover:scale-[1.02] active:scale-[0.98]"
        >
          Go to Dashboard
        </button>
        <button
          type="button"
          onClick={fetchStatus}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 text-sm font-bold text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Status
        </button>
      </div>
    </section>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const addPayment = useAdminStore((s) => s.addPayment);

  const [fetchedPlan, setFetchedPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [planParam, setPlanParam] = useState("");

  const [step, setStep] = useState("payment");
  const [paymentUser, setPaymentUser] = useState({ name: "Guest", email: "" });
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [screenshotName, setScreenshotName] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [initiationId, setInitiationId] = useState(null);
  const [amountInput, setAmountInput] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const instructions = useMemo(() => {
    if (selectedMethod?.key === "UPI") {
      return [
        [
          "Make Exact Payment",
          "Please transfer the exact amount shown above."
        ],
        [
          "Use The Displayed UPI ID",
          "Send payment only to the UPI ID displayed on this page."
        ],
        [
          "Submit UTR Number",
          "Enter the correct UTR / transaction reference number."
        ],
        [
          "Wait for Verification",
          "Verification usually takes 5–30 minutes after submission."
        ]
      ];
    }
    return [
      [
        "Make Exact Payment",
        "Please pay the exact amount shown above. Different amounts may be auto-rejected."
      ],
      [
        "Use USDT Only",
        "Please send USDT only using the selected network."
      ],
      [
        "Submit Transaction ID",
        "Enter the correct blockchain transaction ID (TXID)."
      ],
      [
        "Wait for Verification",
        "Verification usually takes 5–30 minutes after submission."
      ]
    ];
  }, [selectedMethod]);

  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    const requestedPlan = params.get("plan") || "individual";
    const selectedStep = ["payment", "status"].includes(params.get("step")) ? params.get("step") : "payment";
    const initId = params.get("initId");
    if (initId) setInitiationId(initId);
    setPlanParam(requestedPlan);
    setStep(selectedStep);

    const isAuthenticated = localStorage.getItem("tradebot-authenticated") === "true";
    if (!isAuthenticated) {
      setTimeout(() => {
        router.replace(`/login?redirect=${encodeURIComponent(`/checkout?plan=${requestedPlan}&step=${selectedStep}`)}`);
      }, 0);
      return;
    }

    // Auto-redirect if they already have an active/pending payment
    apiFetch("/api/dashboard/my-payment-status")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.found && ["PENDING", "VERIFIED", "APPROVED"].includes(data.status)) {
            if (!params.get("step")) {
              setStep("status");
              window.history.pushState(null, "", `/checkout?plan=${requestedPlan}&step=status`);
            }
          }
        }
      })
      .catch((err) => console.error("Error checking payment status on mount:", err));

    setPlanLoading(true);
    setPlanError(null);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedPlan);
    const fetchUrl = isUuid ? `/api/plans/${requestedPlan}` : `/api/plans/slug/${requestedPlan}`;

    Promise.all([
      apiFetch(fetchUrl).then(async (res) => {
        if (!res.ok) {
          throw new Error("Plan not found");
        }
        const data = await res.json();
        if (data && data.plan) {
          return data.plan;
        } else {
          throw new Error("Invalid plan details received");
        }
      }),
      apiFetch("/api/plans/payment-methods").then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch payment methods");
        }
        const data = await res.json();
        if (data && data.methods) {
          return data.methods.filter(m => m.enabled);
        } else {
          throw new Error("Invalid payment methods data");
        }
      })
    ])
    .then(([planData, methods]) => {
      setFetchedPlan(planData);
      setPaymentMethods(methods);
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
      setPlanLoading(false);
    })
    .catch((err) => {
      console.error(err);
      setPlanError(err.message || "Failed to initialize checkout. Please check your plan selection.");
      setPlanLoading(false);
    });
  }, [mounted, router]);

  useEffect(() => {
    if (!fetchedPlan) return;
    const isFlexible = fetchedPlan.pricingType === "FLEXIBLE" || fetchedPlan.amount == null;
    if (!isFlexible) {
      setAmountInput(Number(fetchedPlan.amount).toString());
    } else {
      const slug = fetchedPlan.name.split(" ")[0].toLowerCase();
      const fallback = PLAN_MIN_AMOUNTS[slug] || "";
      setAmountInput(fallback.toString());
    }
  }, [fetchedPlan]);

  const plan = useMemo(() => {
    if (!fetchedPlan) {
      return {
        name: "Loading Plan...",
        planType: "",
        amount: "USDT 0",
        rawAmount: 0,
        gradient: "from-gray-500/25 to-gray-500/10"
      };
    }

    const slug = fetchedPlan.name.split(" ")[0].toLowerCase();
    let gradient = "from-cyan-500/25 to-green-500/10";
    if (slug === "club") {
      gradient = "from-green-500/25 to-emerald-500/10";
    } else if (slug === "individual") {
      gradient = "from-violet-500/30 to-green-500/10";
    }

    return {
      ...fetchedPlan,
      slug,
      subtitle: fetchedPlan.subtitle || fetchedPlan.desc,
      description: fetchedPlan.desc,
      capital: fetchedPlan.capitalLabel || (fetchedPlan.amount ? `$${Number(fetchedPlan.amount).toLocaleString()}` : "Flexible"),
      profitFee: `${fetchedPlan.weeklyProfit ?? 0}%`,
      planType: (fetchedPlan.durationDays ?? 0) + " Days",
      gradient,
      popular: fetchedPlan.isPopular,
    };
  }, [fetchedPlan]);

  const pricing = useMemo(() => {
    if (!fetchedPlan) return null;
    return calculateCheckoutPreviewUI(fetchedPlan, amountInput);
  }, [fetchedPlan, amountInput]);

  const ready = !planLoading && fetchedPlan !== null;

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
      // no-op for base64
    };
  }, [screenshotPreview]);

  const moveToStep = (nextStep) => {
    setStep(nextStep);
    window.history.pushState(null, "", `/checkout?plan=${planParam}&step=${nextStep}`);
  };

  const copyWalletAddress = () => {
    navigator.clipboard?.writeText("TXYZ123ABC456DEF789GHI");
  };

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScreenshotName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  if (planError) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/25 bg-[#0A0A0A]/95 p-8 text-center shadow-[0_0_80px_-30px_rgba(239,68,68,0.4)]">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-6 text-2xl font-semibold text-white">Error Loading Plan</h2>
          <p className="mt-2 text-sm text-neutral-400">{planError}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400"
          >
            Back to Pricing
          </button>
        </div>
      </main>
    );
  }

  if (planLoading || !fetchedPlan) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-8 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-green-300" />
          <p className="mt-4 text-sm text-neutral-400">Preparing your checkout...</p>
        </div>
      </main>
    );
  }

  if (!planLoading && fetchedPlan && paymentMethods.length === 0) {
    return (
      <main className="min-h-screen bg-[#050505] px-4 pb-20 pt-28 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/25 bg-[#0A0A0A]/95 p-8 text-center shadow-[0_0_80px_-30px_rgba(239,68,68,0.4)]">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-6 text-2xl font-semibold text-white">Payments Temporarily Unavailable</h2>
          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
            Payments are temporarily unavailable. Please contact support.
          </p>
          <button
            onClick={() => router.push("/dashboard/support")}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-green-500 px-6 text-sm font-bold text-black transition hover:bg-green-400"
          >
            Contact Support
          </button>
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
              Secure payment processing via {selectedMethod?.key || "USDT"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {step === "payment"
                ? "Complete Your Payment"
                : paymentStatus === "APPROVED"
                ? "Subscription Activated"
                : paymentStatus === "REJECTED"
                ? "Payment Rejected"
                : paymentStatus === "VERIFIED"
                ? "Payment Verified"
                : "Payment Under Review"}
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
              {paymentMethods.length > 1 && (
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-white">Choose Payment Method</h2>
                  <p className="mt-1 text-sm text-neutral-500 mb-4">Select your preferred payment rail below.</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paymentMethods.map((m) => {
                      const isSelected = selectedMethod?.key === m.key;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setSelectedMethod(m)}
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-green-500 bg-green-500/5 text-white"
                              : "border-white/10 bg-white/[0.02] text-neutral-400 hover:border-white/20 hover:text-white"
                          }`}
                        >
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected ? "border-green-500 bg-green-500 text-black" : "border-neutral-600"
                          }`}>
                            {isSelected && <Check className="h-3 w-3 stroke-[3px]" />}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-white">{m.key === "USDT" ? "USDT (Crypto)" : "UPI (Indian Rupees)"}</p>
                            <p className="text-xs text-neutral-500">{m.key === "USDT" ? "Pay using USDT (TRC20)" : "Pay via GPay, PhonePe, UPI"}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-green-300" />
                  <p className="text-sm leading-relaxed text-neutral-300">
                    Complete the payment using {selectedMethod?.key || "USDT"} and submit only your transaction reference for verification.
                  </p>
                </div>
              </div>

              {selectedMethod?.key === "USDT" ? (
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-white">1. Pay Using USDT</h2>
                  <p className="mt-1 text-sm text-neutral-500">Send USDT to the wallet address below. Only USDT payments are accepted.</p>
                  <div className="mt-5 grid gap-5 md:grid-cols-[210px_1fr]">
                    {selectedMethod?.usdtQrCode ? (
                      <div className="flex justify-center bg-white p-3 rounded-xl aspect-square w-full max-w-[190px] shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                        <img
                          src={selectedMethod.usdtQrCode.startsWith('http') || selectedMethod.usdtQrCode.startsWith('data:') ? selectedMethod.usdtQrCode : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}${selectedMethod.usdtQrCode}`}
                          className="h-full w-full object-contain"
                          alt="USDT QR Code"
                        />
                      </div>
                    ) : (
                      <QrPattern />
                    )}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">USDT Wallet Address</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedMethod?.walletAddress || "");
                            alert("USDT Wallet address copied to clipboard!");
                          }}
                          className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-sm font-semibold text-white">
                          {selectedMethod?.walletAddress || ""}
                          <Copy className="h-4 w-4 text-neutral-500" />
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Network</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-white">{selectedMethod?.network || "TRC20"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Amount to Pay</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight text-green-300">
                          {pricing ? `$${pricing.entryFee.toLocaleString()} USDT` : "Loading..."}
                        </p>
                      </div>
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-neutral-400">
                        Note: Please send the exact USDT amount and use the correct network.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-white">1. Pay Via UPI</h2>
                  <p className="mt-1 text-sm text-neutral-500">Scan the QR code below or pay directly to the UPI ID.</p>
                  <div className="mt-5 grid gap-5 md:grid-cols-[210px_1fr]">
                    {selectedMethod?.upiQrCode ? (
                      <div className="flex justify-center bg-white p-3 rounded-xl aspect-square w-full max-w-[190px] shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                        <img
                          src={selectedMethod.upiQrCode.startsWith('http') || selectedMethod.upiQrCode.startsWith('data:') ? selectedMethod.upiQrCode : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '')}${selectedMethod.upiQrCode}`}
                          className="h-full w-full object-contain"
                          alt="UPI QR Code"
                        />
                      </div>
                    ) : (
                      <QrPattern />
                    )}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">UPI ID</p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedMethod?.upiId || "");
                            alert("UPI ID copied to clipboard!");
                          }}
                          className="mt-2 flex h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 text-left text-sm font-semibold text-white">
                          {selectedMethod?.upiId || ""}
                          <Copy className="h-4 w-4 text-neutral-500" />
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Account Name</p>
                        <p className="mt-1 text-lg font-bold tracking-tight text-white">{selectedMethod?.upiName || ""}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-neutral-500">Amount to Pay</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight text-green-300">
                          {pricing ? `$${pricing.entryFee.toLocaleString()} USD` : "Loading..."}
                        </p>
                      </div>
                      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-neutral-400">
                        Note: Please make the exact payment and enter your transaction reference/UTR below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form
                className="rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-5 sm:p-6"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (isSubmittingPayment) return;

                  const formData = new FormData(event.currentTarget);
                  let txnHash = String(formData.get("txnHash") || "").trim();
                  
                  if (!txnHash) {
                    setPaymentError("Transaction reference is required.");
                    return;
                  }

                  if (selectedMethod?.key === "UPI") {
                    const cleanedRef = txnHash.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                    if (cleanedRef.length < 8) {
                      setPaymentError("Invalid UPI UTR reference. It must be at least 8 alphanumeric characters.");
                      return;
                    }
                    txnHash = cleanedRef;
                  } else {
                    txnHash = txnHash.replace(/[^A-Za-z0-9]/gi, "").toUpperCase();
                  }

                  // Client-side amount validation: ensure submitted amount meets plan minimum
                  if (pricing?.isFlexible) {
                    const slug = fetchedPlan?.name?.split(" ")[0]?.toLowerCase() || "";
                    const minAllowed = PLAN_MIN_AMOUNTS[slug] || 1;
                    const submittedAmount = pricing?.entryFee || 0;
                    if (submittedAmount < minAllowed) {
                      setPaymentError(
                        `Minimum deposit for the ${fetchedPlan?.name || "selected"} plan is $${minAllowed} USDT. Please enter at least $${minAllowed}.`
                      );
                      return;
                    }
                  }

                  if (!pricing?.entryFee || pricing.entryFee <= 0) {
                    setPaymentError("Please enter a valid deposit amount.");
                    return;
                  }

                  setIsSubmittingPayment(true);
                  setPaymentError("");
                  const result = await addPayment({
                    user: paymentUser.name,
                    email: paymentUser.email,
                    plan: `${plan.name} ${plan.planType}`,
                    amount: pricing?.entryFee || 0,
                    txnHash,
                    screenshot: screenshotPreview,
                    network: selectedMethod?.key === "UPI" ? "UPI" : selectedMethod?.network || "TRC20",
                    paymentType: selectedMethod?.key || "USDT",
                    initiationId
                  });
                  setIsSubmittingPayment(false);
                  if (!result.success) {
                    setPaymentError(result.error || "Payment submission failed. Please check your login and try again.");
                    return;
                  }
                  moveToStep("status");
                }}>
                <h2 className="text-lg font-semibold text-white">2. Enter Payment Details</h2>
                <p className="mt-1 text-sm text-neutral-500">After payment, provide the transaction details below.</p>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-white">
                    Deposit Amount ({selectedMethod?.key === "UPI" ? "USD" : "USDT"})
                  </span>
                  <input
                    name="amount"
                    required
                    type="number"
                    min={(() => {
                      if (!pricing?.isFlexible) return undefined;
                      const slug = fetchedPlan?.name?.split(" ")[0]?.toLowerCase() || "";
                      return PLAN_MIN_AMOUNTS[slug] || 1;
                    })()}
                    step="any"
                    placeholder="Enter exact amount paid"
                    value={amountInput ?? ""}
                    onChange={(e) => setAmountInput(e.target.value)}
                    readOnly={!pricing?.isFlexible}
                    disabled={!pricing?.isFlexible}
                    className={`mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-green-500/50 ${
                      !pricing?.isFlexible ? "cursor-not-allowed text-neutral-400 bg-neutral-900/50" : ""
                    }`}
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    {pricing?.isFlexible
                      ? (() => {
                          const slug = fetchedPlan?.name?.split(" ")[0]?.toLowerCase() || "";
                          const min = PLAN_MIN_AMOUNTS[slug] || 1;
                          return <>Minimum deposit: <span className="text-green-300 font-semibold">${min} USDT</span>. Enter the exact amount you sent.</>
                        })()
                      : <>Fixed entry fee: <span className="text-green-300 font-semibold">{plan.capital}</span>. Enter the exact amount you sent.</>
                    }
                  </p>
                  {(!pricing?.isFlexible) && (
                    <p className="mt-2 text-xs text-neutral-400 flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-neutral-500" />
                      This plan has a fixed entry fee.
                    </p>
                  )}
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-white">
                    {selectedMethod?.key === "UPI" ? "UPI Transaction Reference (UTR)" : "USDT Transaction ID"}
                  </span>
                  <input
                    name="txnHash"
                    required
                    type="text"
                    placeholder={selectedMethod?.key === "UPI" ? "Enter 12-digit UPI UTR" : "Enter USDT transaction ID"}
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
                    <SummaryRow 
                      label="Amount to Pay" 
                      value={
                        pricing 
                          ? selectedMethod?.key === "UPI"
                            ? `$${pricing.entryFee.toLocaleString()} USD`
                            : `$${pricing.entryFee.toLocaleString()} USDT`
                          : "Loading..."
                      } 
                      highlight 
                    />
                  </div>
                  {pricing?.platformFeeNote && (
                    <p className="mt-3 text-xs text-neutral-400 italic">
                      Note: {pricing.platformFeeNote} (not charged upfront).
                    </p>
                  )}
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
                  {[`${selectedMethod?.key || "USDT"} Only`, "Transaction ID Verification", "Safe & Trusted Platform"].map((item) => (
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
          <PaymentStatusView moveToStep={moveToStep} onStatusLoaded={setPaymentStatus} />
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

