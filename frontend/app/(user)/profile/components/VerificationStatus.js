"use client";

import { Shield, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Pending Verification", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  VERIFIED: { label: "Verification Success", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function VerificationStatus({ payments = [] }) {
  const latestPayment = payments[0] || null;

  if (!latestPayment) {
    return null; // Don't show the card if there's no payment history at all
  }

  const cfg = statusConfig[latestPayment.status] || {
    label: latestPayment.status,
    icon: Clock,
    color: "text-neutral-400",
    bg: "bg-neutral-500/10",
    border: "border-neutral-500/20",
  };

  const Icon = cfg.icon;
  const isApproved = latestPayment.status === "APPROVED";
  const txId = latestPayment.txnHash || latestPayment.utr || latestPayment.id.slice(0, 16).toUpperCase();

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6`}>
      <div className="flex items-center gap-3 mb-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/25">
          <Shield className={`h-4.5 w-4.5 ${cfg.color}`} />
        </span>
        <div>
          <h3 className="text-base font-bold text-white">Verification Status</h3>
          <p className="text-xs text-neutral-500">Checkout and deposit authentication</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status Indicator */}
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Status</p>
          <div className="flex items-center gap-2 mt-0.5">
            {isApproved ? (
              <span className="text-sm font-bold text-green-400 flex items-center gap-1">
                ✓ Approved
              </span>
            ) : (
              <span className={`text-sm font-bold ${cfg.color} flex items-center gap-1`}>
                <Icon className="h-4 w-4" />
                {cfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Transaction ID */}
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Transaction ID</p>
          <p className="text-xs font-bold text-white font-mono mt-0.5 truncate" title={txId}>{txId}</p>
        </div>

        {/* Payment Date */}
        <div className="rounded-lg bg-black/20 p-3.5 border border-white/[0.04]">
          <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">Payment Date</p>
          <p className="text-xs font-bold text-white mt-0.5">{formatDate(latestPayment.createdAt)}</p>
        </div>
      </div>

      {/* Review Details */}
      {(isApproved || latestPayment.status === "REJECTED" || latestPayment.status === "VERIFIED") && (
        <div className="mt-4 pt-4 border-t border-white/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-neutral-500">
            <span>Reviewed On: </span>
            <span className="text-neutral-300 font-medium">{formatDate(latestPayment.updatedAt)}</span>
          </div>
          {latestPayment.remark && (
            <div className="text-neutral-500 sm:text-right">
              <span>Remark: </span>
              <span className="text-neutral-300 font-medium italic">&quot;{latestPayment.remark}&quot;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
