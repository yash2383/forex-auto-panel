"use client";

import { useState } from "react";
import { useAdminStore } from "../../../../hooks/adminStore";
import { Search, Eye, Check, X, Ban } from "lucide-react";
import Link from "next/link";

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";
const adminControl = "rounded-lg border border-white/[0.08] bg-white/[0.025]";

const actionStyles = {
  view: "border-white/[0.08] bg-white/[0.025] text-white hover:bg-white/[0.08]",
  approve: "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/15",
  reject: "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
};

function CrudButton({ icon: Icon, label, tone = "view", disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${actionStyles[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

export default function WithdrawalsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const withdrawals = useAdminStore((s) => s.withdrawals || []);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const approveWithdrawal = useAdminStore((s) => s.approveWithdrawal);
  const rejectWithdrawal = useAdminStore((s) => s.rejectWithdrawal);
  const canApprove = hasPermission("payments", "edit");

  const handleApprove = (id) => {
    if (confirm("Are you sure you want to approve this withdrawal?")) {
      approveWithdrawal(id);
    }
  };

  const handleReject = (id) => {
    if (confirm("Are you sure you want to reject this withdrawal?")) {
      rejectWithdrawal(id);
    }
  };

  const metrics = [
    ["Total Requests", withdrawals.length.toString()],
    ["Pending", withdrawals.filter((w) => w.status === "Pending").length.toString()],
    ["Approved", withdrawals.filter((w) => w.status === "Approved").length.toString()],
    ["Rejected", withdrawals.filter((w) => w.status === "Rejected").length.toString()],
  ];

  let filteredWithdrawals = withdrawals;
  if (activeFilter !== "All") {
    filteredWithdrawals = filteredWithdrawals.filter((w) => w.status === activeFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredWithdrawals = filteredWithdrawals.filter((w) =>
      w.withdrawalId.toLowerCase().includes(q) ||
      w.userName.toLowerCase().includes(q) ||
      w.userEmail.toLowerCase().includes(q) ||
      w.method.toLowerCase().includes(q) ||
      w.status.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-5">
      <div className={`${adminPanel} p-6`}>
        <p className="text-xs font-bold uppercase tracking-wider text-green-300">Finance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Withdrawal Requests</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
          Manage system-wide withdrawal requests. Review user balances and approve or reject transactions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value]) => (
          <article key={label} className={`${adminPanel} p-5`}>
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </div>

      <section className={`${adminPanel} p-5`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Records</h2>
            <label className="flex h-10 w-full sm:w-auto sm:min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500 focus-within:border-green-500/35 transition">
              <Search className="h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
                placeholder="Search withdrawals..."
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {["All", "Pending", "Approved", "Rejected"].map((filter) => {
            const active = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                  active ? "border-green-500/40 bg-green-500/15 text-green-300" : "border-white/[0.08] bg-white/[0.025] text-neutral-300 hover:bg-white/[0.08]"
                }`}>
                {filter}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-4 font-semibold">Request ID</th>
                <th className="px-4 py-4 font-semibold">User</th>
                <th className="px-4 py-4 font-semibold">Amount</th>
                <th className="px-4 py-4 font-semibold">Method</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Date</th>
                <th className="px-4 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredWithdrawals.map((w) => {
                const initials = (w.userName || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <tr key={w.id} className="hover:bg-white/[0.025]">
                    <td className="px-4 py-4">{w.withdrawalId}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-slate-800">{initials}</span>
                        <div>
                          <p className="font-semibold text-white">{w.userName}</p>
                          <p className="text-xs text-neutral-500">{w.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-white">${w.amount.toLocaleString()}</td>
                    <td className="px-4 py-4">{w.method}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                        w.status === "Approved" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                        w.status === "Rejected" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-neutral-400 font-mono">{w.date}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-end items-center">
                        <CrudButton icon={Eye} label="View" tone="view" onClick={() => alert("View Modal integration coming soon")} />
                        {w.status === "Pending" && canApprove && (
                          <>
                            <CrudButton icon={Check} label="Approve" tone="approve" onClick={() => handleApprove(w.id)} />
                            <CrudButton icon={X} label="Reject" tone="reject" onClick={() => handleReject(w.id)} />
                          </>
                        )}
                        {w.status !== "Pending" && (
                          <span className={`text-xs font-bold ${
                            w.status === "Approved" ? "text-green-300" : "text-red-300"
                          }`}>{w.status}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredWithdrawals.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-sm text-neutral-500">No withdrawal requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
