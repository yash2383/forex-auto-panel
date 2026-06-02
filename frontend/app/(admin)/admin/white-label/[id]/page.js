"use client";

import React from "react";
import { notFound } from "next/navigation";
import { useAdminStore } from "../../../../../hooks/adminStore";
import { adminPermissionMatrix } from "../../_components/adminData";
import { CrudPermissionPanel, DataTable, StatsCard, StatusBadge, WhiteLabelShell } from "../_components/WhiteLabelUI";
import { partnerUsers, transactions } from "../_components/whiteLabelData";
import { Ban } from "lucide-react";

export default function WhiteLabelDetailsPage({ params }) {
  const { id } = React.use(params);
  const partners = useAdminStore((s) => s.partners);
  const partner = partners.find((item) => item.id === id);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const currentUser = useAdminStore((s) => s.currentUser);

  if (!partner) notFound();

  if (!hasPermission("partners", "view")) {
    return (
      <WhiteLabelShell title="Access Denied" description="Security restriction active.">
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6 text-white">
          <Ban className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Access Denied</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md">
            You do not have the required permissions to view White Label details.
          </p>
        </div>
      </WhiteLabelShell>
    );
  }

  const isViewer = currentUser?.role === "VIEWER";
  const isManager = currentUser?.role === "MANAGER";

  const partnerShare = partner.revenue * (partner.profitShare / 100);
  const adminShare = partner.revenue * (1 - partner.profitShare / 100);

  const maskVal = (amount, shouldMask) => {
    return shouldMask ? "$***" : `$${amount.toLocaleString()}`;
  };

  return (
    <WhiteLabelShell title={partner.name} description={`Partner domain: ${partner.domain}`}>
      <CrudPermissionPanel permission={adminPermissionMatrix["all-partners"]} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Users" value={isViewer ? "***" : partner.usersCount.toLocaleString()} sub={partner.status} />
        <StatsCard label="Total Revenue" value={maskVal(partner.revenue, isViewer)} sub="Gross partner revenue" />
        <StatsCard label="Your Earnings" value={maskVal(adminShare, isViewer || isManager)} sub="Admin cut" />
        <StatsCard label="Their Earnings" value={maskVal(partnerShare, isViewer)} sub={`${partner.profitShare}% commission`} />
      </div>

      <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Partner Profile</h2>
            <p className="mt-1 text-sm text-neutral-400">{partner.email}</p>
          </div>
          <StatusBadge status={partner.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-semibold text-white">Users</h2>
          <DataTable
            headers={["User", "Plan", "Payment", "Date"]}
            rows={partnerUsers.map((user) => (
              <tr key={`${user.user}-${user.date}`}>
                <td className="px-4 py-4 font-semibold text-white">{user.user}</td>
                <td className="px-4 py-4 text-neutral-400">{user.plan}</td>
                <td className="px-4 py-4 font-semibold text-white">{isViewer ? "Rs ***" : user.payment}</td>
                <td className="px-4 py-4 text-neutral-400">{user.date}</td>
              </tr>
            ))}
          />
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold text-white">Transactions</h2>
          <DataTable
            headers={["Amount", "Admin Cut", "WL Cut", "Date"]}
            rows={transactions.map((transaction) => {
              return (
                <tr key={`${transaction.amount}-${transaction.date}`}>
                  <td className="px-4 py-4 font-semibold text-white">{isViewer ? "Rs ***" : transaction.amount}</td>
                  <td className="px-4 py-4 text-green-300">{(isViewer || isManager) ? "Rs ***" : transaction.adminCut}</td>
                  <td className="px-4 py-4 text-neutral-400">{isViewer ? "Rs ***" : transaction.wlCut}</td>
                  <td className="px-4 py-4 text-neutral-400">{transaction.date}</td>
                </tr>
              );
            })}
          />
        </div>
      </div>
    </WhiteLabelShell>
  );
}
