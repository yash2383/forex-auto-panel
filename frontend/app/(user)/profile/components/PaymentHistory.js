"use client";

import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
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

function formatCurrency(amount, currency = "INR") {
  if (currency === "INR") return `₹${Number(amount).toLocaleString("en-IN")}`;
  return `$${Number(amount).toLocaleString("en-US")}`;
}

export default function PaymentHistory({ payments = [] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1110]/95 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-bold text-white">Payment History</h3>
        <p className="text-xs text-neutral-500 mt-1">All your deposit history and active subscription records</p>
      </div>

      {payments.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-neutral-500 text-sm">No transaction records found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Plan</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Transaction</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-neutral-500">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => {
                const cfg = statusConfig[p.status] || statusConfig.PENDING;
                const Icon = cfg.icon;
                const txId = p.txnHash || p.utr || p.id.slice(0, 12).toUpperCase();

                return (
                  <tr key={p.id} className="hover:bg-white/[0.01] transition">
                    <td className="px-6 py-4 text-neutral-300 whitespace-nowrap">{formatDate(p.createdAt)}</td>
                    <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">{p.planName}</td>
                    <td className="px-6 py-4 font-mono font-bold text-white whitespace-nowrap">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-neutral-400 whitespace-nowrap" title={txId}>
                      {txId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
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
  );
}
