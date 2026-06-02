"use client";

import { useState, useMemo } from "react";
import { useAdminStore } from "../../../../hooks/adminStore";
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Layers,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function ProfitDistributionPage() {
  const users = useAdminStore((s) => s.users || []);
  const profitDistributions = useAdminStore((s) => s.profitDistributions || []);
  const addProfitDistribution = useAdminStore((s) => s.addProfitDistribution);
  const editProfitDistribution = useAdminStore((s) => s.editProfitDistribution);
  const deleteProfitDistribution = useAdminStore((s) => s.deleteProfitDistribution);
  const bulkDistributeProfit = useAdminStore((s) => s.bulkDistributeProfit);
  const hasPermission = useAdminStore((s) => s.hasPermission);

  const [bulkSummary, setBulkSummary] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleBulkDistribute = async (dryRun = false) => {
    if (!dryRun) {
      if (!confirm("Are you sure you want to run the weekly profit distribution? This will write to the database and update user wallet balances.")) {
        return;
      }
    }
    
    setIsBulkProcessing(true);
    const requestId = dryRun ? null : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await bulkDistributeProfit(dryRun, requestId);
    setIsBulkProcessing(false);
    
    if (res.success) {
      setBulkSummary({
        ...res.summary,
        skippedCount: res.summary.skippedCount ?? res.summary.skipped ?? 0,
        skipped: res.skipped,
        dryRun
      });
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState(null);

  // Add form fields
  const [newUserId, setNewUserId] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState("Weekly Profit");
  const [newStatus, setNewStatus] = useState("PAID");
  const [newNote, setNewNote] = useState("");
  const [newDistDate, setNewDistDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  // Edit form fields
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editDistDate, setEditDistDate] = useState("");

  if (!hasPermission("profit-distribution", "view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6 text-white">
        <ShieldAlert className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-md">
          You do not have the required permissions to view the <strong>Profit Distribution</strong> section. 
          Please contact a Super Admin if you believe this is an error.
        </p>
        <Link href="/admin/dashboard" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-white/[0.08] px-4 text-xs font-bold text-white hover:bg-white/[0.15] transition">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const canEdit = hasPermission("profit-distribution", "edit");

  // Filter distributions
  const filteredDistributions = useMemo(() => {
    return profitDistributions.filter((d) => {
      const matchesSearch =
        d.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [profitDistributions, searchQuery, statusFilter]);

  // Dynamic top stats
  const topStats = useMemo(() => {
    const totalPaid = profitDistributions
      .filter((d) => d.status === "PAID")
      .reduce((sum, d) => sum + d.amount, 0);
    const totalPending = profitDistributions
      .filter((d) => d.status === "PENDING")
      .reduce((sum, d) => sum + d.amount, 0);
    const totalRecords = profitDistributions.length;
    const uniqueUsersCount = new Set(profitDistributions.map((d) => d.userId)).size;

    return [
      { label: "Total Distributed", value: `₹${totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: DollarSign, tone: "text-green-300" },
      { label: "Total Pending", value: `₹${totalPending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, icon: Clock, tone: "text-yellow-300" },
      { label: "Total Payout Logs", value: String(totalRecords), icon: Layers, tone: "text-white" },
      { label: "Profit Receivers (Users)", value: String(uniqueUsersCount), icon: Users, tone: "text-cyan-300" },
    ];
  }, [profitDistributions]);

  const handleOpenAddModal = () => {
    if (users.length > 0) {
      setNewUserId(users[0].id);
    }
    setNewAmount("");
    setNewType("Weekly Profit");
    setNewStatus("PAID");
    setNewNote("");
    setNewDistDate(new Date().toISOString().substring(0, 10));
    setShowAddModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUserId || !newAmount || !newType || !newDistDate) {
      alert("Please fill in all required fields.");
      return;
    }

    await addProfitDistribution({
      userId: newUserId,
      amount: parseFloat(newAmount),
      type: newType,
      status: newStatus,
      note: newNote,
      distributionDate: new Date(newDistDate).toISOString(),
    });

    setShowAddModal(false);
  };

  const handleOpenEditModal = (d) => {
    setSelectedDistribution(d);
    setEditAmount(String(d.amount));
    setEditType(d.type);
    setEditStatus(d.status);
    setEditNote(d.note || "");
    setEditDistDate(new Date(d.distributionDate).toISOString().substring(0, 10));
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editAmount || !editType || !editDistDate) {
      alert("Please fill in all required fields.");
      return;
    }

    await editProfitDistribution(selectedDistribution.id, {
      amount: parseFloat(editAmount),
      type: editType,
      status: editStatus,
      note: editNote,
      distributionDate: new Date(editDistDate).toISOString(),
    });

    setShowEditModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this profit distribution record?")) {
      await deleteProfitDistribution(id);
    }
  };

  const handleToggleStatus = async (d) => {
    const nextStatus = d.status === "PAID" ? "PENDING" : "PAID";
    await editProfitDistribution(d.id, {
      status: nextStatus,
    });
  };

  const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";

  return (
    <div className="space-y-5">
      {/* Title Header */}
      <div className={`${adminPanel} p-6 relative overflow-hidden`}>
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-green-300">Financial Management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Profit Distribution</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
              Manage profit distributions and settlements paid out to platform users. Add, edit, or remove payout records.
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleBulkDistribute(true)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 text-sm font-bold text-blue-300 hover:bg-blue-500/20 transition"
              >
                Preview Distribution (Dry Run)
              </button>
              <button
                type="button"
                onClick={() => handleBulkDistribute(false)}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 text-sm font-bold text-green-300 hover:bg-green-500/20 transition"
              >
                Run Distribution
              </button>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-green-500 px-4 text-sm font-bold text-black hover:bg-green-400 transition"
              >
                <Plus className="h-4 w-4" />
                Add Distribution
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <article key={idx} className={`${adminPanel} p-5 relative overflow-hidden group`}>
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-green-500/10 blur-2xl"></div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-400">{stat.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-neutral-400">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className={`mt-4 text-2xl font-bold tracking-tight ${stat.tone}`}>
                {stat.value}
              </p>
            </article>
          );
        })}
      </div>

      {/* Main Table Panel */}
      <section className={`${adminPanel} p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
              <FileText className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-semibold text-white">Payout Distribution Logs</h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-xs text-neutral-400">
              <Search className="h-3.5 w-3.5 text-neutral-600" />
              <input
                className="min-w-[200px] bg-transparent text-white outline-none placeholder:text-neutral-600"
                placeholder="Search reference, user, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-white/[0.08] bg-[#081118] px-3 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/[0.03]"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-4 font-semibold">Reference</th>
                <th className="px-4 py-4 font-semibold">User</th>
                <th className="px-4 py-4 font-semibold">Type</th>
                <th className="px-4 py-4 font-semibold">Amount</th>
                <th className="px-4 py-4 font-semibold">Distribution Date</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Notes</th>
                {canEdit && <th className="px-4 py-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-neutral-300">
              {filteredDistributions.map((pd) => {
                const isPaid = pd.status === "PAID";
                const distDate = pd.distributionDate
                  ? new Date(pd.distributionDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <tr key={pd.id} className="hover:bg-white/[0.025] transition-colors">
                    <td className="px-4 py-4 font-semibold text-white font-mono">{pd.reference}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-white">{pd.userName}</p>
                        <p className="text-[11px] text-neutral-500">{pd.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium">{pd.type}</td>
                    <td className="px-4 py-4 font-mono font-bold text-green-300">
                      ₹{pd.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-4">{distDate}</td>
                    <td className="px-4 py-4">
                      <button
                        disabled={!canEdit}
                        onClick={() => handleToggleStatus(pd)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all border ${
                          isPaid
                            ? "bg-green-500/10 text-green-300 border-green-500/20 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20"
                        }`}
                      >
                        {isPaid ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {isPaid ? "Paid" : "Pending"}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-xs text-neutral-400 max-w-xs truncate" title={pd.note}>
                      {pd.note || "-"}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(pd)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400 hover:text-white hover:bg-white/[0.06]"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(pd.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredDistributions.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-4 py-12 text-center text-neutral-500">
                    No payout distributions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.05] p-5">
              <h3 className="text-lg font-semibold text-white">Add Profit Distribution</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Recipient User</label>
                <select
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none placeholder:text-neutral-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Distribution Type</label>
                <input
                  type="text"
                  placeholder="Weekly Profit"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Payout Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Distribution Date (Effective)</label>
                <input
                  type="date"
                  value={newDistDate}
                  onChange={(e) => setNewDistDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Notes</label>
                <textarea
                  placeholder="Additional logs/payout audit notes..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full h-20 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-sm text-white outline-none resize-none placeholder:text-neutral-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-white hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-green-500 text-sm font-bold text-black hover:bg-green-400"
                >
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDistribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.05] p-5">
              <h3 className="text-lg font-semibold text-white">Edit Profit Distribution</h3>
              <button onClick={() => setShowEditModal(false)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
                <p className="text-[10px] uppercase font-bold text-neutral-500">Target Log Record</p>
                <p className="text-sm font-bold text-white mt-1 font-mono">{selectedDistribution.reference}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{selectedDistribution.userName} ({selectedDistribution.userEmail})</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Distribution Type</label>
                <input
                  type="text"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Payout Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Distribution Date (Effective)</label>
                <input
                  type="date"
                  value={editDistDate}
                  onChange={(e) => setEditDistDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-white/[0.08] bg-black/20 px-3 text-sm text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase mb-2">Notes</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full h-20 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-sm text-white outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-white hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-lg bg-green-500 text-sm font-bold text-black hover:bg-green-400"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Bulk Distribution Summary Modal */}
      {bulkSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-white">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#0b141b] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-white/[0.05] p-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <CheckCircle className={`h-6 w-6 ${bulkSummary.dryRun ? "text-blue-400" : "text-green-400"}`} />
                <h3 className="text-lg font-semibold">
                  {bulkSummary.dryRun ? "Profit Distribution Preview (Dry Run)" : "Profit Distribution Complete"}
                </h3>
              </div>
              <button onClick={() => setBulkSummary(null)} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 hover:text-white font-semibold">✕</button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase font-semibold">Total Evaluated</p>
                  <p className="mt-2 text-2xl font-bold font-mono">{bulkSummary.totalProcessed}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase font-semibold">{bulkSummary.dryRun ? "Eligible" : "Successful"}</p>
                  <p className="mt-2 text-2xl font-bold font-mono text-green-400">{bulkSummary.dryRun ? bulkSummary.eligible : bulkSummary.success}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase font-semibold">Skipped</p>
                  <p className="mt-2 text-2xl font-bold font-mono text-yellow-300">{bulkSummary.skippedCount}</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-center">
                  <p className="text-xs text-neutral-400 uppercase font-semibold">{bulkSummary.dryRun ? "Est. Payout" : "Total Payout"}</p>
                  <p className="mt-2 text-xl font-bold font-mono text-green-300">
                    ₹{(bulkSummary.dryRun ? bulkSummary.estimatedAmount : bulkSummary.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {!bulkSummary.dryRun && bulkSummary.batchId && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3.5 flex items-center justify-between text-sm">
                  <span className="text-neutral-400">Created Batch ID:</span>
                  <span className="font-mono font-bold text-green-300 select-all">{bulkSummary.batchId}</span>
                </div>
              )}

              {/* Skipped Details Lists */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-green-300 border-b border-white/[0.05] pb-2">Skipped Users Breakdown</h4>
                
                <div className="space-y-3.5">
                  {[
                    { label: "Already Paid This Week", list: bulkSummary.skipped?.alreadyPaid, color: "text-yellow-300 bg-yellow-500/10 border-yellow-500/20" },
                    { label: "No Plan / Invalid Subscription", list: bulkSummary.skipped?.invalidPlan, color: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20" },
                    { label: "Expired Subscriptions (>365 days)", list: bulkSummary.skipped?.expiredPlan, color: "text-red-400 bg-red-500/10 border-red-500/20" },
                    { label: "Inactive / Suspended Accounts", list: bulkSummary.skipped?.inactiveUser, color: "text-red-300 bg-red-500/5 border-red-500/10" }
                  ].map((category) => {
                    const count = category.list?.length || 0;
                    return (
                      <div key={category.label} className="border border-white/[0.06] rounded-xl overflow-hidden bg-black/10 text-left">
                        <div className="flex justify-between items-center p-3 bg-white/[0.02] border-b border-white/[0.04]">
                          <span className="text-xs font-semibold text-neutral-300">{category.label}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${category.color}`}>{count}</span>
                        </div>
                        {count > 0 ? (
                          <div className="p-3 max-h-32 overflow-y-auto text-xs font-mono text-neutral-400 space-y-1 divide-y divide-white/5">
                            {category.list.map((email) => (
                              <div key={email} className="pt-1 first:pt-0">{email}</div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-xs text-neutral-500 italic">No users skipped in this category.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/[0.05] p-5 bg-white/[0.01] shrink-0">
              <button
                onClick={() => setBulkSummary(null)}
                className="w-full h-11 rounded-lg bg-green-500 text-sm font-bold text-black hover:bg-green-400 transition animate-pulse"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state overlay */}
      {isBulkProcessing && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-500 border-t-transparent mb-4"></div>
          <p className="text-sm font-medium text-neutral-300">Processing bulk profit distribution...</p>
          <p className="text-xs text-neutral-500 mt-2">Please do not refresh or close the browser.</p>
        </div>
      )}
    </div>
  );
}
