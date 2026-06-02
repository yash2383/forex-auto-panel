"use client";

import { useState, useEffect } from "react";
import { Eye, Pencil, Trash2, Plus, Ban, Check, ShieldAlert, ArrowLeft, Loader2, Coins, Users, Landmark, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";

export default function AdminInvestmentPlansPage() {
  const partners = useAdminStore((s) => s.partners);
  const hasPermission = useAdminStore((s) => s.hasPermission);

  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false); // for Create/Edit
  const [modalMode, setModalMode] = useState("create"); // create, edit
  const [selectedPlan, setSelectedPlan] = useState(null);

  // View Investors overlay
  const [isInvestorsOpen, setIsInvestorsOpen] = useState(false);
  const [investors, setInvestors] = useState([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formMinAmount, setFormMinAmount] = useState("");
  const [formMaxAmount, setFormMaxAmount] = useState("");
  const [formWeeklyProfit, setFormWeeklyProfit] = useState("");
  const [formLockPeriod, setFormLockPeriod] = useState("");
  const [formReferralBonus, setFormReferralBonus] = useState("");
  const [formStatus, setFormStatus] = useState(true);

  // Notifications/Toast
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const triggerToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
  };

  // Set default partner once partners are loaded
  useEffect(() => {
    if (partners && partners.length > 0 && !selectedPartnerId) {
      setSelectedPartnerId(partners[0].id);
    }
  }, [partners, selectedPartnerId]);

  // Load plans on partner selection
  const fetchPlans = async (partnerId) => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/investment-plans?partnerId=${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
      } else {
        triggerToast("Failed to fetch investment plans.", "error");
      }
    } catch (e) {
      console.error(e);
      triggerToast("Error fetching plans.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPartnerId) {
      fetchPlans(selectedPartnerId);
    }
  }, [selectedPartnerId]);

  // Permissions check
  if (!hasPermission("plans", "view")) {
    return (
      <div className="min-h-[calc(100vh-132px)] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4 animate-pulse">
          <Ban className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-md">
          You do not have the required permissions to access the Investment Plans module.
        </p>
      </div>
    );
  }

  const canCreate = hasPermission("plans", "create");
  const canEdit = hasPermission("plans", "edit");
  const canDelete = hasPermission("plans", "delete");

  // Summary Metrics calculations
  const activePlansCount = plans.filter((p) => p.status).length;
  const totalInvestors = plans.reduce((sum, p) => sum + (p.investorsCount || 0), 0);
  const totalInvested = plans.reduce((sum, p) => sum + (p.totalInvested || 0), 0);
  const weeklyLiability = plans.reduce((sum, p) => sum + (p.weeklyLiability || 0), 0);

  // Modal Handlers
  const openCreateModal = () => {
    setModalMode("create");
    setSelectedPlan(null);
    setFormName("");
    setFormDescription("");
    setFormImage("");
    setFormMinAmount("");
    setFormMaxAmount("");
    setFormWeeklyProfit("");
    setFormLockPeriod("");
    setFormReferralBonus("");
    setFormStatus(true);
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setModalMode("edit");
    setSelectedPlan(plan);
    setFormName(plan.name);
    setFormDescription(plan.description || "");
    setFormImage(plan.image || "");
    setFormMinAmount(String(plan.minAmount));
    setFormMaxAmount(String(plan.maxAmount));
    setFormWeeklyProfit(String(plan.weeklyProfit));
    setFormLockPeriod(String(plan.lockPeriod));
    setFormReferralBonus(String(plan.referralBonus));
    setFormStatus(plan.status);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formName || !formMinAmount || !formMaxAmount || !formWeeklyProfit || !formLockPeriod || !formReferralBonus) {
      triggerToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      partnerId: selectedPartnerId,
      name: formName,
      description: formDescription,
      image: formImage,
      minAmount: Number(formMinAmount),
      maxAmount: Number(formMaxAmount),
      weeklyProfit: Number(formWeeklyProfit),
      lockPeriod: Number(formLockPeriod),
      referralBonus: Number(formReferralBonus),
      status: formStatus,
    };

    try {
      let res;
      if (modalMode === "create") {
        res = await apiFetch("/api/admin/investment-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch(`/api/admin/investment-plans/${selectedPlan.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        triggerToast(
          modalMode === "create" ? "Investment Plan created successfully!" : "Investment Plan updated successfully!"
        );
        setIsModalOpen(false);
        fetchPlans(selectedPartnerId);
      } else {
        const errorData = await res.json();
        triggerToast(errorData.message || "Failed to save investment plan.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("An unexpected error occurred.", "error");
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Are you sure you want to delete this investment plan?")) return;

    try {
      const res = await apiFetch(`/api/admin/investment-plans/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        triggerToast("Investment Plan deleted successfully!");
        fetchPlans(selectedPartnerId);
      } else {
        const errorData = await res.json();
        triggerToast(errorData.message || "Failed to delete plan.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error deleting plan.", "error");
    }
  };

  // View Investors overlay handler
  const handleViewInvestors = async (plan) => {
    setSelectedPlan(plan);
    setInvestors([]);
    setLoadingInvestors(true);
    setIsInvestorsOpen(true);

    try {
      const res = await apiFetch(`/api/admin/investment-plans/${plan.id}/investors`);
      if (res.ok) {
        const data = await res.json();
        setInvestors(data);
      } else {
        triggerToast("Failed to fetch plan investors.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error loading investors list.", "error");
    } finally {
      setLoadingInvestors(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-132px)] rounded-xl border border-white/[0.08] bg-[#081118]/95 p-5 text-white shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)] sm:p-6 font-sans">
      {/* Toast popup */}
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

      {/* Title block */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-green-300">Investments</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Investment Plans</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Create, update, and manage yielding packages for investors under white-label partners.
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-3">
          {partners && partners.length > 0 && (
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="h-11 rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {canCreate && (
            <button
              onClick={openCreateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-bold text-black transition hover:bg-green-400 active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" />
              Create Investment Plan
            </button>
          )}
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] hover:border-white/[0.12] transition">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Plans</span>
            <Landmark className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">{activePlansCount}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Out of {plans.length} total designs</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] hover:border-white/[0.12] transition">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Investors</span>
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">{totalInvestors}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Active customer contracts</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] hover:border-white/[0.12] transition">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Invested</span>
            <Coins className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">₹{totalInvested.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Total locked portfolio value</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] hover:border-white/[0.12] transition">
          <div className="flex items-center justify-between mb-3 text-neutral-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Liability</span>
            <TrendingUp className="h-5 w-5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold tracking-tight text-white">₹{weeklyLiability.toLocaleString("en-IN")}</p>
          <p className="text-[10px] text-neutral-500 mt-1">Est. payout next cycle</p>
        </div>
      </div>

      {/* Plans Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-green-500 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#071018]/60 shadow-lg">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-neutral-400 border-b border-white/[0.08]">
              <tr>
                <th className="px-5 py-4 font-semibold">Plan Name</th>
                <th className="px-4 py-4 font-semibold text-center">Weekly Profit %</th>
                <th className="px-4 py-4 font-semibold text-center">Lock Period</th>
                <th className="px-4 py-4 font-semibold text-center">Min Investment</th>
                <th className="px-4 py-4 font-semibold text-center">Max Investment</th>
                <th className="px-4 py-4 font-semibold text-center">Referral Bonus</th>
                <th className="px-4 py-4 font-semibold text-center">Investors</th>
                <th className="px-4 py-4 font-semibold text-center">Status</th>
                <th className="px-5 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-neutral-300">
              {plans.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-10 w-16 object-cover rounded border border-white/10" />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white/[0.04] border border-white/[0.08] text-xs font-black text-white uppercase">
                          {p.name.slice(0, 2)}
                        </span>
                      )}
                      <div>
                        <p className="font-bold text-white leading-snug">{p.name}</p>
                        {p.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 max-w-[200px]">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-green-400 text-base">{p.weeklyProfit}%</td>
                  <td className="px-4 py-4 text-center font-medium">{p.lockPeriod} Days</td>
                  <td className="px-4 py-4 text-center font-mono">₹{p.minAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-4 text-center font-mono">₹{p.maxAmount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-4 text-center font-semibold text-blue-400">{p.referralBonus}%</td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleViewInvestors(p)}
                      className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                    >
                      {p.investorsCount} Active
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        p.status
                          ? "bg-green-500/10 text-green-300 border border-green-500/20"
                          : "bg-neutral-500/10 text-neutral-400 border border-white/5"
                      }`}
                    >
                      {p.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {canEdit && (
                        <button
                          onClick={() => openEditModal(p)}
                          className="inline-flex h-8 items-center gap-1 rounded border border-white/[0.08] bg-white/[0.03] px-2.5 text-xs font-bold text-neutral-300 hover:bg-white/[0.08] hover:text-white transition"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="inline-flex h-8 items-center gap-1 rounded border border-red-500/20 bg-red-500/5 px-2.5 text-xs font-bold text-red-400 hover:bg-red-500/15 transition disabled:opacity-40"
                          disabled={p.investorsCount > 0}
                          title={p.investorsCount > 0 ? "Cannot delete plan with active investors" : "Delete plan"}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-sm text-neutral-500 bg-white/[0.005]">
                    No investment plans registered for this partner. Click "Create Investment Plan" to launch one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT INVESTMENT PLAN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleModalSubmit}
            className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">
                {modalMode === "create" ? "Create Investment Plan" : `Edit Plan: ${selectedPlan?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Plan Name *</span>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Starter Plan"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Description</span>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Plan features, yields, suitability..."
                  rows={2}
                  className="w-full rounded-lg border border-white/[0.08] bg-black/20 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Banner Image URL</span>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... or relative path"
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Minimum Investment (₹) *</span>
                  <input
                    type="number"
                    required
                    value={formMinAmount}
                    onChange={(e) => setFormMinAmount(e.target.value)}
                    placeholder="100"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Maximum Investment (₹) *</span>
                  <input
                    type="number"
                    required
                    value={formMaxAmount}
                    onChange={(e) => setFormMaxAmount(e.target.value)}
                    placeholder="1000"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50 font-mono"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Weekly Profit % *</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formWeeklyProfit}
                    onChange={(e) => setFormWeeklyProfit(e.target.value)}
                    placeholder="5.00"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Lock Period (Days) *</span>
                  <input
                    type="number"
                    required
                    value={formLockPeriod}
                    onChange={(e) => setFormLockPeriod(e.target.value)}
                    placeholder="7"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50 font-mono"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Referral Bonus % *</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formReferralBonus}
                    onChange={(e) => setFormReferralBonus(e.target.value)}
                    placeholder="2.00"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none focus:border-green-500/50 font-mono"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 pt-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={formStatus}
                  onChange={(e) => setFormStatus(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-white/[0.08] bg-black/20 text-green-500 focus:ring-green-500/30 accent-green-500"
                />
                <span className="text-xs font-semibold text-neutral-400">Mark Plan Status as Active</span>
              </label>
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
                className="inline-flex h-11 items-center justify-center rounded-lg bg-green-500 px-5 text-sm font-bold text-black hover:bg-green-400"
              >
                {modalMode === "create" ? "Create Plan" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW INVESTORS MODAL OVERLAY */}
      {isInvestorsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Active Investors - {selectedPlan?.name}</h3>
                <p className="text-xs text-neutral-400 mt-1">Listed positions tracking weekly yields.</p>
              </div>
              <button
                onClick={() => setIsInvestorsOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#071018]/50">
              {loadingInvestors ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-neutral-400 border-b border-white/[0.08]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold text-center">Amount Locked</th>
                      <th className="px-4 py-3 font-semibold text-center">Weekly Yield %</th>
                      <th className="px-4 py-3 font-semibold text-center">Start Date</th>
                      <th className="px-4 py-3 font-semibold text-center">Next Yield Payout</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-neutral-300 text-xs">
                    {investors.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.01]">
                        <td className="px-4 py-3 font-semibold text-white">{inv.userName}</td>
                        <td className="px-4 py-3 text-neutral-400">{inv.userEmail}</td>
                        <td className="px-4 py-3 text-center font-bold text-white font-mono">₹{inv.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-center text-green-400 font-bold">{inv.profitRate}%</td>
                        <td className="px-4 py-3 text-center text-neutral-400">
                          {new Date(inv.startDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-center text-amber-300 font-medium">
                          {new Date(inv.nextProfitDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              inv.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-300 border border-green-500/20"
                                : "bg-neutral-500/10 text-neutral-400 border border-white/5"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {investors.length === 0 && (
                      <tr>
                        <td colSpan="7" className="px-4 py-12 text-center text-neutral-500">
                          No investor contracts active under this plan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsInvestorsOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] px-5 text-sm font-bold text-neutral-300 hover:bg-white/[0.08]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
