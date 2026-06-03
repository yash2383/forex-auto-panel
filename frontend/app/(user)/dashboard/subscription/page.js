"use client";

import { useEffect, useState } from "react";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import Link from "next/link";
import { apiFetch } from "../../../../lib/apiFetch";
import { Hexagon } from "lucide-react";

export default function SubscriptionPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiFetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="mx-auto mb-4 flex h-12 w-12 animate-spin items-center justify-center rounded-2xl border border-green-500/20 bg-green-950/40 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.15)]">
          <Hexagon className="h-6 w-6" />
        </div>
      </div>
    );
  }

  const activePlan = profile?.activePlan;
  
  const planName = activePlan?.name || "No Active Plan";
  const statusText = activePlan?.status === "ACTIVE" 
    ? "Active" 
    : activePlan?.status === "EXPIRED" 
      ? "Expired" 
      : "Inactive";
      
  const statusColor = statusText === "Active" ? "text-green-300" : statusText === "Expired" ? "text-amber-400" : "text-red-400";

  const expiryDateStr = activePlan?.expiresAt 
    ? new Date(activePlan.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <>
      <PageIntro
        title="Subscription"
        description="Manage your active plan and access details about your subscription.">
        <p className="text-sm font-semibold text-green-300">Stay updated with your plan and access level.</p>
      </PageIntro>

      <SectionCard title="Your Subscription" description="Current plan, subscription status, expiry date, and upgrade options.">
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white/[0.03] p-4">
            <p className="text-sm text-neutral-500">Current Plan</p>
            <strong className="mt-2 block text-2xl text-white">{planName}</strong>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-4">
            <p className="text-sm text-neutral-500">Status</p>
            <strong className={`mt-2 block text-2xl ${statusColor}`}>{statusText}</strong>
          </div>
          <div className="rounded-lg bg-white/[0.03] p-4">
            <p className="text-sm text-neutral-500">Expiry Date</p>
            <strong className="mt-2 block text-2xl text-white">{expiryDateStr}</strong>
          </div>
        </div>
        <Link href="/pricing" className="mt-6 inline-flex h-12 items-center rounded-lg bg-green-500 px-6 text-sm font-bold text-black transition-all hover:bg-green-400 active:scale-[0.98]">
          Renew / Upgrade Plan
        </Link>
      </SectionCard>
      <Disclaimer />
    </>
  );
}
