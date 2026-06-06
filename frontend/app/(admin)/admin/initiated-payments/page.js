"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Check, X, ClipboardList, RefreshCw, CreditCard, MessageCircle, Phone } from "lucide-react";
import { useAdminStore } from "../../../../hooks/adminStore";

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";

function CrudButton({ icon: Icon, label, disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.025] px-2 text-[10px] font-bold transition hover:bg-white/[0.08] text-white`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </button>
  );
}

export default function InitiatedPaymentsPage() {
  const initiatedPayments = useAdminStore((s) => s.initiatedPayments) || [];
  const metricsData = useAdminStore((s) => s.initiatedPaymentMetrics) || {};
  const fetchInitiatedPayments = useAdminStore((s) => s.fetchInitiatedPayments);
  const updateInitiatedPayment = useAdminStore((s) => s.updateInitiatedPayment);
  
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editRemarks, setEditRemarks] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const currentUser = useAdminStore((s) => s.currentUser);
  const canModify = !!currentUser; // All authenticated admins can modify

  const loadData = async () => {
    setLoading(true);
    await fetchInitiatedPayments();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdate = async () => {
    if (!selectedPayment) return;
    await updateInitiatedPayment(selectedPayment.id, {
      followUpStatus: editStatus,
      remarks: editRemarks,
      contactedAt: editStatus !== "PENDING" && !selectedPayment.contactedAt ? new Date().toISOString() : selectedPayment.contactedAt
    });
    setSelectedPayment(null);
  };

  const metrics = [
    ["Initiated Today", metricsData?.initiatedToday || 0],
    ["Initiated This Week", metricsData?.initiatedWeek || 0],
    ["Pending Follow Ups", metricsData?.pendingFollowUps || 0],
    ["Converted Leads", metricsData?.convertedLeads || 0],
    ["Abandoned Value", `$${(metricsData?.abandonedValue || 0).toLocaleString()}`],
    ["Recovered Revenue", `$${(metricsData?.recoveredRevenue || 0).toLocaleString()}`],
  ];

  let filtered = initiatedPayments;
  if (activeFilter !== "ALL") {
    if (activeFilter === "COMPLETED") filtered = filtered.filter(i => i.status === "completed" || i.followUpStatus === "CONVERTED");
    else filtered = filtered.filter((i) => i.followUpStatus === activeFilter && i.status !== "completed");
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((i) =>
      i.user?.name?.toLowerCase().includes(q) ||
      i.user?.email?.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className={`${adminPanel} p-6`}>
        <p className="text-xs font-bold uppercase tracking-wider text-green-300">Lead Recovery</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Initiated Payments</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
          Track users who initiated a checkout but did not complete the payment. Follow up to convert these abandoned checkouts.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {metrics.map(([label, value]) => (
          <article key={label} className={`${adminPanel} p-5`}>
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-white font-mono">{value}</p>
          </article>
        ))}
      </div>

      {/* Table Section */}
      <section className={`${adminPanel} p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Abandoned Checkouts</h2>
            <label className="flex h-10 w-full sm:w-auto sm:min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500 focus-within:border-green-500/35 transition">
              <Search className="h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
                placeholder="Search by name, email..."
              />
            </label>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 border border-white/[0.08] hover:border-green-500/30 bg-white/[0.025] hover:bg-white/[0.05] rounded-lg px-3 py-2 text-xs font-bold text-neutral-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { label: "All", value: "ALL" },
            { label: "Pending", value: "PENDING" },
            { label: "Contacted", value: "CONTACTED" },
            { label: "Interested", value: "INTERESTED" },
            { label: "Follow-Up Req", value: "FOLLOWUP_REQUIRED" },
            { label: "Converted / Completed", value: "COMPLETED" },
            { label: "Closed", value: "CLOSED" }
          ].map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                  active ? "border-green-500/40 bg-green-500/15 text-green-300" : "border-white/[0.08] bg-white/[0.025] text-neutral-300 hover:bg-white/[0.08]"
                }`}>
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold">User</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold">Plan</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold">Amount</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold hidden md:table-cell">Source</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold hidden md:table-cell">Initiated At</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold hidden sm:table-cell">Sys Status</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold">Sales Status</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((i) => {
                return (
                  <tr key={i.id} className="hover:bg-white/[0.025] transition-colors">
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 text-xs sm:text-sm">
                      <div>
                        <p className="font-semibold text-white leading-tight">{i.user?.name || "Unknown"}</p>
                        <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5 hidden sm:block">{i.user?.email}</p>
                        {i.user?.phone && <p className="text-[10px] text-green-400 mt-0.5">📞 {i.user.phone}</p>}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 text-xs font-semibold text-neutral-300 whitespace-nowrap">{i.plan?.name || "N/A"}</td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 font-mono text-green-300 font-bold whitespace-nowrap text-xs sm:text-sm">${Number(i.amount).toLocaleString()}</td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 text-xs text-neutral-300 hidden md:table-cell whitespace-nowrap">{i.source || i.paymentGateway}</td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 text-xs text-neutral-400 font-mono hidden md:table-cell whitespace-nowrap">
                      {new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 hidden sm:table-cell whitespace-nowrap text-xs sm:text-sm">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border uppercase tracking-wider ${
                        i.status === "completed" ? "bg-green-500/10 text-green-300 border-green-500/20" : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                      }`}>
                        {i.status}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border uppercase tracking-wider ${
                        i.followUpStatus === "CONVERTED" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                        i.followUpStatus === "CLOSED" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                        i.followUpStatus === "PENDING" ? "bg-white/5 text-neutral-400 border-white/10" :
                        "bg-blue-500/10 text-blue-300 border-blue-500/20"
                      }`}>
                        {i.followUpStatus}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 sm:px-4 sm:py-4 text-right whitespace-nowrap text-xs sm:text-sm">
                      <div className="flex gap-2 justify-end items-center">
                        {i.user?.phone && (
                          <>
                            <a href={`https://wa.me/${i.user.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/40 transition text-neutral-400">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                            <a href={`tel:${i.user.phone.replace(/\D/g, '')}`} title="Call" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/40 transition text-neutral-400">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </>
                        )}
                        <CrudButton icon={Eye} label="Manage" onClick={() => {
                          setSelectedPayment(i);
                          setEditStatus(i.followUpStatus);
                          setEditRemarks(i.remarks || "");
                        }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-sm text-neutral-500">No initiated payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail/Update Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b141b] border border-white/[0.08] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.04]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-300" /> Lead Recovery
              </h3>
              <button onClick={() => setSelectedPayment(null)} className="text-neutral-400 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">User</span>
                  <span className="text-sm font-semibold text-white">{selectedPayment.user?.name}</span>
                  <p className="text-xs text-neutral-400">{selectedPayment.user?.email}</p>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500">Phone</span>
                  <span className="text-sm font-bold text-green-300">{selectedPayment.user?.phone || "N/A"}</span>
                </div>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Update Status</span>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500/50"
                  disabled={!canModify}
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="INTERESTED">Interested</option>
                  <option value="FOLLOWUP_REQUIRED">Follow-up Required</option>
                  <option value="CONVERTED">Converted (Paid)</option>
                  <option value="CLOSED">Closed (Not Interested)</option>
                </select>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Remarks / Notes</span>
                <textarea 
                  value={editRemarks} 
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="w-full h-24 bg-black/20 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500/50 resize-none"
                  placeholder="e.g., User asked for a discount, follow up on Monday..."
                  disabled={!canModify}
                />
              </div>

              {canModify && (
                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button onClick={() => setSelectedPayment(null)} className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white transition">Cancel</button>
                  <button onClick={handleUpdate} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition active:scale-95">
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
