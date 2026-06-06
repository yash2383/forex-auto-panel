"use client";

import { useEffect, useState } from "react";
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Pending Review", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  VERIFIED: { label: "Verified", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  APPROVED: { label: "Approved", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  REJECTED: { label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  FAILED: { label: "Failed", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount, currency = "USD") {
  if (currency === "USD") return `$${Number(amount).toLocaleString("en-US")}`;
  return `$${Number(amount).toLocaleString("en-US")}`;
}

export default function PaymentHistory({ payments = [] }) {
  const latestPayment = payments[0] || null;

  return (
    <div className="space-y-6">
      {/* Checkout Verification Status */}
      {latestPayment && (
        <div className={`rounded-2xl border ${statusConfig[latestPayment.status]?.border || "border-white/10"} ${statusConfig[latestPayment.status]?.bg || "bg-white/[0.02]"} p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${statusConfig[latestPayment.status]?.bg || "bg-white/[0.06]"}`}>
              <Shield className={`h-5 w-5 ${statusConfig[latestPayment.status]?.color || "text-white"}`} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Checkout Verification Status</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Latest payment submission</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Current Status</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = statusConfig[latestPayment.status];
                  const Icon = cfg?.icon || Clock;
                  return (
                    <>
                      <Icon className={`h-4 w-4 ${cfg?.color || "text-white"}`} />
                      <span className={`text-sm font-bold ${cfg?.color || "text-white"}`}>{cfg?.label || latestPayment.status}</span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Submitted</p>
              <p className="text-sm font-bold text-white">{formatDate(latestPayment.createdAt)}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Last Updated</p>
              <p className="text-sm font-bold text-white">{formatDate(latestPayment.updatedAt)}</p>
            </div>
          </div>

          {latestPayment.remark && (
            <div className="mt-4 rounded-xl bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">Admin Remark</p>
              <p className="text-sm text-neutral-300">{latestPayment.remark}</p>
            </div>
          )}
        </div>
      )}

      {/* Payment History Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">Payment History</h3>
          <p className="text-sm text-neutral-500 mt-1">All your transactions and invoices</p>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 text-sm">No payments found. Make your first deposit to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">Date</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">Plan</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">Amount</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">Status</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-neutral-500">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {payments.map((p) => {
                  const cfg = statusConfig[p.status] || statusConfig.PENDING;
                  const Icon = cfg.icon;
                  const txId = p.txnHash || p.utr || p.id.slice(0, 12).toUpperCase();

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 text-neutral-300 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">{p.planName}</td>
                      <td className="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-neutral-400 whitespace-nowrap">{txId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {p.status === "APPROVED" ? (
                          <button className="text-xs font-semibold text-green-400 hover:text-green-300 transition">
                            Download
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
