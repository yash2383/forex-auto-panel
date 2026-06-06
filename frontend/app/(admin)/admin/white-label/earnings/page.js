"use client";

import { useState } from "react";
import { Plus, Trash2, SlidersHorizontal, Check, ArrowRight, Ban, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { adminPermissionMatrix } from "../../_components/adminData";
import { useAdminStore } from "../../../../../hooks/adminStore";
import { CrudPermissionPanel, DataTable, StatsCard, WhiteLabelShell } from "../_components/WhiteLabelUI";

export default function WhiteLabelEarningsPage() {
  const partners = useAdminStore((s) => s.partners);
  const adjustments = useAdminStore((s) => s.adjustments);
  const addAdjustment = useAdminStore((s) => s.addAdjustment);
  const deleteAdjustment = useAdminStore((s) => s.deleteAdjustment);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const currentUser = useAdminStore((s) => s.currentUser);
  const searchQuery = useAdminStore((s) => s.searchQuery || "");

  const filteredPartners = partners.filter((p) => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredAdjustments = adjustments.filter((adj) => {
    if (!searchQuery) return true;
    return adj.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           adj.remark.toLowerCase().includes(searchQuery.toLowerCase()) ||
           adj.type.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Local Modal state
  const [isAdjOpen, setIsAdjOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [adjType, setAdjType] = useState("Bonus");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjRemark, setAdjRemark] = useState("");

  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleAdjSubmit = (e) => {
    e.preventDefault();
    if (!selectedPartnerId || !adjAmount || !adjRemark) return;

    const partner = partners.find(p => p.id === selectedPartnerId);
    if (!partner) return;

    addAdjustment({
      partnerId: selectedPartnerId,
      partnerName: partner.name,
      type: adjType,
      amount: Number(adjAmount),
      remark: adjRemark
    });

    setSelectedPartnerId("");
    setAdjAmount("");
    setAdjRemark("");
    setIsAdjOpen(false);
    triggerToast("Manual Adjustment Entry Created!");
  };

  if (!hasPermission("partners", "view")) {
    return (
      <WhiteLabelShell title="Access Denied" description="Security restriction active.">
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6">
          <Ban className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Access Denied</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md">
            You do not have the required permissions to view the Earnings section.
          </p>
        </div>
      </WhiteLabelShell>
    );
  }

  const isViewer = false;
  const isManager = false;
  const canEdit = hasPermission("partners", "edit");
  const canDelete = hasPermission("partners", "delete");

  const maskVal = (amount, shouldMask) => {
    return shouldMask ? "$***" : `$${amount.toLocaleString()}`;
  };

  // Dynamic calculations based on store state
  const totalRevenue = partners.reduce((sum, p) => sum + p.revenue, 0);
  const totalPartnerEarnings = partners.reduce((sum, p) => sum + p.revenue * (p.profitShare / 100), 0);
  const totalAdminEarnings = partners.reduce((sum, p) => sum + p.revenue * (1 - p.profitShare / 100), 0);

  const earningsSummary = [
    { label: "Total Platform Revenue", value: maskVal(totalRevenue, isViewer), sub: `Across ${partners.length} active brands` },
    { label: "Total WL Earnings", value: maskVal(totalPartnerEarnings, isViewer), sub: "Partner commission pool" },
    { label: "Total Admin Earnings", value: maskVal(totalAdminEarnings, isViewer || isManager), sub: "Platform administrative share" }
  ];

  const bars = [
    { label: "Platform Overall", pct: isViewer ? "**" : 100, color: "bg-[#00D09C]" },
    { label: "WL Partners Split", pct: isViewer ? "**" : Math.round((totalPartnerEarnings / (totalRevenue || 1)) * 100), color: "bg-[#22C55E]" },
    { label: "Admin Profit Cut", pct: (isViewer || isManager) ? "**" : Math.round((totalAdminEarnings / (totalRevenue || 1)) * 100), color: "bg-[#0EA5E9]" }
  ];

  return (
    <WhiteLabelShell title="White Label Earnings" description="Track platform revenue, partner commissions, and admin-side earnings across white-label partners.">
      <CrudPermissionPanel permission={adminPermissionMatrix.earnings} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed right-5 top-24 z-50 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300 shadow-2xl backdrop-blur-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {earningsSummary.map((item) => (
          <StatsCard key={item.label} label={item.label} value={item.value} sub={item.sub} />
        ))}
      </div>

      {/* Revenue Split Chart */}
      <section className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-6 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]">
        <h2 className="text-xl font-semibold text-white">Revenue Split Chart</h2>
        <div className="mt-6 space-y-5">
          {bars.map((bar) => (
            <div key={bar.label}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-semibold text-white">{bar.label}</span>
                <span className="text-neutral-400">{bar.pct}%</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div className={`h-3 rounded-full ${bar.color}`} style={{ width: typeof bar.pct === "number" ? `${bar.pct}%` : "0%" }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Partner Earnings List */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Partner Earnings Directory</h2>
          <button className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.025] px-4 text-sm font-bold text-white transition hover:bg-white/[0.08]">
            Export PDF
          </button>
        </div>
        <DataTable
          headers={["Partner Name", "Total Profit Generated", "Partner Share", "Admin Share", "Withdrawn Amount", "Pending Balance"]}
          rows={filteredPartners.map((partner) => {
            const partnerShare = partner.revenue * (partner.profitShare / 100);
            const adminShare = partner.revenue * (1 - partner.profitShare / 100);
            const pendingBalance = partnerShare - partner.withdrawn;

            return (
              <tr key={partner.id} className="hover:bg-white/[0.01]">
                <td className="px-3 py-3 sm:px-4 sm:py-4 font-semibold text-xs sm:text-sm text-white whitespace-nowrap">{partner.name}</td>
                <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-neutral-400 whitespace-nowrap">{maskVal(partner.revenue, isViewer)}</td>
                <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-neutral-400 whitespace-nowrap">{maskVal(partnerShare, isViewer)} ({partner.profitShare}%)</td>
                <td className="px-3 py-3 sm:px-4 sm:py-4 font-semibold text-xs sm:text-sm text-green-300 whitespace-nowrap">{maskVal(adminShare, isViewer || isManager)}</td>
                <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-neutral-400 whitespace-nowrap">{maskVal(partner.withdrawn, isViewer)}</td>
                <td className="px-3 py-3 sm:px-4 sm:py-4 font-semibold text-xs sm:text-sm text-white whitespace-nowrap">
                  <span className={`rounded-md px-2 py-0.5 ${pendingBalance > 0 ? "bg-green-500/10 text-green-300" : "bg-neutral-500/10 text-neutral-400"}`}>
                    {maskVal(pendingBalance, isViewer)}
                  </span>
                </td>
              </tr>
            );
          })}
        />
      </section>

      {/* Manual Adjustments Section */}
      <section className="mt-8 border-t border-white/[0.08] pt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">⚙️ Manual Earnings Adjustments</h2>
            <p className="text-xs text-neutral-500 mt-1">Record performance bonuses or correct log entries. (Audit logs created automatically)</p>
          </div>
          {canEdit && (
            <button 
              onClick={() => setIsAdjOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-bold text-black transition hover:bg-green-400"
            >
              + Create Adjustment Entry
            </button>
          )}
        </div>

        <DataTable
          headers={["Date", "Partner Name", "Type", "Adjustment Amount", "Auditor Remark", "Action"]}
          rows={filteredAdjustments.map((adj) => (
            <tr key={adj.id} className="hover:bg-white/[0.01]">
              <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs text-neutral-500 font-mono whitespace-nowrap">{adj.date}</td>
              <td className="px-3 py-3 sm:px-4 sm:py-4 font-semibold text-xs sm:text-sm text-white whitespace-nowrap">{adj.partnerName}</td>
              <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${adj.type === "Bonus" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                  {adj.type}
                </span>
              </td>
              <td className={`px-3 py-3 sm:px-4 sm:py-4 font-semibold text-xs sm:text-sm whitespace-nowrap ${adj.amount >= 0 ? "text-green-300" : "text-red-300"}`}>
                {isViewer ? "$***" : (adj.amount >= 0 ? `+$${adj.amount.toLocaleString()}` : `-$${Math.abs(adj.amount).toLocaleString()}`)}
              </td>
              <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm text-neutral-400 italic whitespace-nowrap">&quot;{adj.remark}&quot;</td>
              <td className="px-3 py-3 sm:px-4 sm:py-4 text-xs sm:text-sm whitespace-nowrap">
                {canDelete ? (
                  <button 
                    onClick={() => { deleteAdjustment(adj.id); triggerToast("Adjustment removed"); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    title="Delete Entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-xs text-neutral-500">Read-Only</span>
                )}
              </td>
            </tr>
          ))}
        />

        {adjustments.length === 0 && (
          <div className="text-center py-8 text-neutral-500 bg-white/[0.01] border border-white/[0.05] rounded-xl mt-2">
            No adjustment entries recorded.
          </div>
        )}
      </section>

      {/* CREATE ADJUSTMENT MODAL */}
      {isAdjOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAdjSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Log Manual Adjustment</h3>
              <button type="button" onClick={() => setIsAdjOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Select Partner Brand</span>
              <select 
                required 
                value={selectedPartnerId} 
                onChange={(e) => setSelectedPartnerId(e.target.value)} 
                className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50"
              >
                <option value="">-- Select Partner --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.companyName})</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Adjustment Type</span>
                <select value={adjType} onChange={(e) => setAdjType(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Bonus">Performance Bonus</option>
                  <option value="Correction">Correction Entry (Deduction)</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Amount ($)</span>
                <input 
                  type="number" 
                  required 
                  value={adjAmount} 
                  onChange={(e) => setAdjAmount(e.target.value)} 
                  placeholder="e.g. 500" 
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" 
                />
              </label>
            </div>

            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Auditor Justification Remark</span>
              <textarea required value={adjRemark} onChange={(e) => setAdjRemark(e.target.value)} placeholder="e.g. Adjust split differences or write bonus details..." className="h-20 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>

            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Log Adjustment Entry
            </button>
          </form>
        </div>
      )}
    </WhiteLabelShell>
  );
}
