"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "../../../../hooks/adminStore";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock3,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { SectionCard, PageIntro, Disclaimer } from "../_components/DashboardPieces";

export default function ProfitHistoryPage() {
  const profitDistributions = useAdminStore((s) => s.profitDistributions || []);
  const profitSummary = useAdminStore((s) => s.profitSummary);
  const fetchData = useAdminStore((s) => s.fetchData);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDistributions = useMemo(() => {
    return profitDistributions.filter((d) => {
      const matchesSearch =
        d.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.note && d.note.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [profitDistributions, searchQuery, statusFilter]);

  const cards = useMemo(() => {
    const total = profitSummary?.totalProfit || 0;
    const monthly = profitSummary?.monthlyProfit || 0;
    const pending = profitSummary?.pendingProfit || 0;
    const lastPayout = profitSummary?.lastDistribution
      ? new Date(profitSummary.lastDistribution).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never";

    return [
      {
        icon: TrendingUp,
        label: "Total Profit Earned",
        value: `+$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        sub: "Lifetime settled distributions",
        tone: "text-green-300",
      },
      {
        icon: Calendar,
        label: "This Month",
        value: `+$${monthly.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        sub: "Earned in current month",
        tone: "text-green-300",
      },
      {
        icon: Clock3,
        label: "Pending Profit",
        value: `$${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        sub: "Awaiting next distribution cycle",
        tone: "text-yellow-300",
      },
      {
        icon: ShieldCheck,
        label: "Last Distribution",
        value: lastPayout,
        sub: "Latest distribution payout date",
        tone: "text-white",
      },
    ];
  }, [profitSummary]);

  return (
    <>
      <PageIntro
        title="Profit History"
        description="Access and track your historical profit distribution records, weekly payouts, and pending earnings settled by the platform admin."
      >
        <p className="text-sm font-semibold text-green-300">
          Double-entry audited payout tracking system.
        </p>
      </PageIntro>

      {/* Summary Cards */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <article
              key={idx}
              className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_35px_-24px_rgba(34,197,94,0.45)] relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400 font-medium">{card.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-neutral-400">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className={`mt-4 text-2xl font-bold tracking-tight font-mono ${card.tone}`}>
                {card.value}
              </p>
              <p className="mt-2 text-xs text-neutral-500">{card.sub}</p>
            </article>
          );
        })}
      </section>

      {/* Distributions Log Card */}
      <section className="rounded-2xl border border-white/10 bg-[#07100d]/95 p-5 shadow-[0_0_45px_-28px_rgba(34,197,94,0.6)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-500/10 text-green-300">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Payout History</h2>
              <p className="mt-1 text-sm text-neutral-500">Log of all dynamic profit distributions</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 min-w-[240px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs text-neutral-300">
              <Search className="h-3.5 w-3.5 text-neutral-500" />
              <input
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-neutral-600"
                placeholder="Search reference, type, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-[#07100d] px-4 text-xs font-bold text-white outline-none cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Reference</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Amount</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDistributions.map((item) => {
                const isPaid = item.status === "PAID";
                const dateStr = item.distributionDate
                  ? new Date(item.distributionDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <tr key={item.id} className="hover:bg-white/[0.025] transition-colors">
                    <td className="px-5 py-4 font-semibold text-white font-mono">{item.reference}</td>
                    <td className="px-5 py-4 text-neutral-300">{dateStr}</td>
                    <td className="px-5 py-4 font-medium text-white">{item.type}</td>
                    <td className="px-5 py-4 font-mono font-bold text-green-300">
                      +${(item.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isPaid
                            ? "bg-green-500/10 text-green-300 border border-green-500/20"
                            : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                        }`}
                      >
                        {isPaid ? "Paid" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-neutral-400 max-w-xs truncate" title={item.note}>
                      {item.note || <span className="text-neutral-600">-</span>}
                    </td>
                  </tr>
                );
              })}
              {filteredDistributions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-neutral-500">
                    No profit distributions found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Disclaimer />
    </>
  );
}
