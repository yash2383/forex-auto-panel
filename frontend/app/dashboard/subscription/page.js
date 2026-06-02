"use client";

import { useAdminStore } from "../../../hooks/adminStore";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import Link from "next/link";
import { useEffect } from "react";

export default function SubscriptionPage() {
  const currentUser = useAdminStore((s) => s.currentUser);
  const fetchData = useAdminStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const planName = currentUser?.status === "VIP" 
    ? "Premium (Individual Plan)" 
    : currentUser?.status === "ACTIVE" 
      ? "Basic (Club Plan)" 
      : currentUser?.status === "EXPIRED" 
        ? "Basic (Expired)" 
        : "No Active Plan";

  const statusText = currentUser?.status === "VIP" || currentUser?.status === "ACTIVE"
    ? "Active"
    : currentUser?.status === "EXPIRED"
      ? "Expired"
      : "Inactive";

  const statusColor = statusText === "Active" ? "text-green-300" : "text-red-400";

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
            <strong className="mt-2 block text-2xl text-white">June 25, 2026</strong>
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
