"use client";

import { Crown } from "lucide-react";

export default function ProfileHero({ profile }) {
  const initials = (profile?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B1110]/95 p-8 shadow-[0_0_30px_-20px_rgba(34,197,94,0.5)]">
      {/* Background radial glow */}
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-500/10 blur-3xl"></div>
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl"></div>

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Avatar Area */}
        <div className="relative shrink-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 text-3xl font-black text-black shadow-[0_0_35px_rgba(34,197,94,0.3)] select-none">
            {initials}
          </div>
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-[#0E1816] text-green-400 shadow-lg">
            <Crown className="h-4 w-4" />
          </div>
        </div>

        {/* Hero Title & Info */}
        <div className="text-center md:text-left">
          <span className="inline-flex items-center rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 text-[11px] font-bold text-green-300 uppercase tracking-widest">
            My Profile
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {profile?.name || "User Account"}
          </h1>
          <p className="mt-1.5 text-sm text-neutral-400">{profile?.email || "—"}</p>
          
          <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/10 px-3 py-1 text-xs font-medium text-neutral-400">
              Member since {memberSince}
            </span>
            <span className="inline-flex items-center rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs font-bold text-green-400 uppercase">
              {profile?.activePlan?.name || "Free Trial"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
