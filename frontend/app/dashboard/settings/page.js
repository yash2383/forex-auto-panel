"use client";

import { useAdminStore } from "../../../hooks/adminStore";
import { SectionCard, Disclaimer, PageIntro } from "../_components/DashboardPieces";
import { Bot, Shield, User, Key, Check } from "lucide-react";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const currentUser = useAdminStore((s) => s.currentUser);
  const updateUserSettings = useAdminStore((s) => s.updateUserSettings);
  const fetchData = useAdminStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!currentUser) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-400">
        Loading settings...
      </div>
    );
  }

  const handleToggleAutoTrading = async () => {
    await updateUserSettings({ autoTrading: !currentUser.autoTrading });
  };

  const handleRiskChange = async (risk) => {
    await updateUserSettings({ riskSetting: risk });
  };

  return (
    <>
      <PageIntro
        title="Account Settings"
        description="Configure your automated trading robot, risk parameters, and profile settings.">
        <p className="text-sm font-semibold text-green-300">Set your strategies and watch the system execute trades in real-time.</p>
      </PageIntro>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Auto Trading Control Panel */}
        <article className="rounded-2xl border border-white/10 bg-[#0B1110]/95 p-6 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-300">
              <Bot className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Auto Trading Automation</h2>
              <p className="text-xs text-neutral-500">Configure automated signal execution</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div>
              <p className="font-semibold text-white">Automated Trading Bot</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-[240px]">
                {currentUser.autoTrading 
                  ? "Bot is actively scanning and executing trades based on your risk settings."
                  : "Bot is currently offline. Turn on to automate trading operations."}
              </p>
            </div>
            
            <button
              onClick={handleToggleAutoTrading}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                currentUser.autoTrading ? "bg-green-500" : "bg-neutral-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                  currentUser.autoTrading ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-white">Risk Setting Configuration</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              This governs the budget allocated per spawned trade. Spawns occur automatically every 10 seconds up to 3 active trades.
            </p>
            
            <div className="grid grid-cols-3 gap-2 mt-3 bg-neutral-900/60 p-1.5 rounded-xl border border-white/[0.04]">
              {["LOW", "MEDIUM", "HIGH"].map((risk) => {
                const active = currentUser.riskSetting === risk;
                const activeClasses = active
                  ? "bg-green-500 text-black shadow font-bold"
                  : "text-neutral-400 hover:text-white";
                return (
                  <button
                    key={risk}
                    onClick={() => handleRiskChange(risk)}
                    className={`py-2 text-xs rounded-lg transition-all ${activeClasses}`}
                  >
                    {risk}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-500">LOW Risk Budget:</span>
                <span className="text-white font-bold">₹100 / trade</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">MEDIUM Risk Budget:</span>
                <span className="text-white font-bold">₹500 / trade</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">HIGH Risk Budget:</span>
                <span className="text-white font-bold">₹1,000 / trade</span>
              </div>
            </div>
          </div>
        </article>

        {/* Profile Card & Info */}
        <article className="rounded-2xl border border-white/10 bg-[#0B1110]/95 p-6 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)]">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Profile Details</h2>
              <p className="text-xs text-neutral-500">Your account identity profile</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <span className="block text-xs text-neutral-500">Full Name</span>
              <span className="mt-1 block text-sm font-semibold text-white">{currentUser.name}</span>
            </div>
            <div className="border-t border-white/[0.06] pt-4">
              <span className="block text-xs text-neutral-500">Email Address</span>
              <span className="mt-1 block text-sm font-semibold text-white">{currentUser.email}</span>
            </div>
            <div className="border-t border-white/[0.06] pt-4">
              <span className="block text-xs text-neutral-500">Account Status</span>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-bold text-green-300 border border-green-500/20 capitalize font-mono">
                {currentUser.status?.toLowerCase() || "new"}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4 flex gap-3">
            <Shield className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-200">Security Notice</p>
              <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                Broker API key integration will be available in a future phase. Currently, your account utilizes our internal simulated liquidity pools to safely test system outcomes.
              </p>
            </div>
          </div>
        </article>
      </section>
      
      <Disclaimer />
    </>
  );
}
