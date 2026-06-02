"use client";

import { useEffect, useState } from "react";
import { Hexagon } from "lucide-react";
import { apiFetch } from "../../../lib/apiFetch";
import ProfileHero from "./components/ProfileHero";
import AccountDetails from "./components/AccountDetails";
import SubscriptionCard from "./components/SubscriptionCard";
import VerificationStatus from "./components/VerificationStatus";
import PaymentHistory from "./components/PaymentHistory";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const [profileRes, paymentsRes, subRes] = await Promise.all([
        apiFetch("/api/user/profile"),
        apiFetch("/api/user/payments"),
        apiFetch("/api/user/subscription"),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data.payments || []);
      }

      if (subRes.ok) {
        const data = await subRes.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateName = async (newName) => {
    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        setProfile((prev) => ({ ...prev, name: newName }));
      }
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-950/40 text-green-400 shadow-[0_0_25px_rgba(34,197,94,0.15)] animate-spin">
              <Hexagon className="h-6 w-6" />
            </div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Loading Account Profile...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020505] px-4 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Profile Hero section */}
        <ProfileHero profile={profile} />

        <div className="space-y-8">
          {/* Subscription status */}
          <SubscriptionCard subscription={subscription} />

          {/* Verification Status */}
          <VerificationStatus payments={payments} />

          {/* Account configuration Details */}
          <AccountDetails profile={profile} onUpdateName={handleUpdateName} />

          {/* History Table */}
          <PaymentHistory payments={payments} />
        </div>
      </div>
    </main>
  );
}
