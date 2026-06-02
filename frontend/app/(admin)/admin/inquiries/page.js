"use client";

import { useEffect, useState } from "react";
import { Search, Eye, Check, X, ClipboardList, RefreshCw } from "lucide-react";
import { apiFetch } from "../../../../lib/apiFetch";
import { useAdminStore } from "../../../../hooks/adminStore";

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";
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
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition cursor-pointer ${actionStyles[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const currentUser = useAdminStore((s) => s.currentUser);
  const canModify = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "MANAGER";

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/inquiries");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data || []);
      }
    } catch (e) {
      console.error("Failed to load inquiries:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await apiFetch(`/api/admin/inquiries/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInquiries(inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq)));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status });
        }
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (e) {
      alert("Failed to update status. Network error.");
    }
  };

  const metrics = [
    ["Total Inquiries", inquiries.length.toString()],
    ["Pending", inquiries.filter((i) => i.status === "PENDING").length.toString()],
    ["Responded", inquiries.filter((i) => i.status === "RESPONDED").length.toString()],
    ["Closed", inquiries.filter((i) => i.status === "CLOSED").length.toString()],
  ];

  let filteredInquiries = inquiries;
  if (activeFilter !== "ALL") {
    filteredInquiries = filteredInquiries.filter((i) => i.status === activeFilter);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredInquiries = filteredInquiries.filter((i) =>
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      i.subject.toLowerCase().includes(q) ||
      i.message.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`${adminPanel} p-6`}>
        <p className="text-xs font-bold uppercase tracking-wider text-green-300">Communication</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Client Inquiries</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
          Manage system-wide contact inquiries submitted by users and potential partners. Track general queries, support tickets, and White Label customization requests.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <h2 className="text-lg font-semibold text-white">Inquiry Logs</h2>
            <label className="flex h-10 w-full sm:w-auto sm:min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500 focus-within:border-green-500/35 transition">
              <Search className="h-4 w-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600"
                placeholder="Search inquiries..."
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
          </div>
          <button
            onClick={loadInquiries}
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
            { label: "Responded", value: "RESPONDED" },
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

        {/* Loading / Data Table */}
        {loading && inquiries.length === 0 ? (
          <div className="py-20 text-center text-sm text-neutral-500">
            Loading inquiries data...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">ID</th>
                  <th className="px-4 py-4 font-semibold">Sender Details</th>
                  <th className="px-4 py-4 font-semibold">Subject</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Received Date</th>
                  <th className="px-4 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInquiries.map((i) => {
                  const initials = (i.name || 'S').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <tr key={i.id} className="hover:bg-white/[0.025] transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-neutral-400">#{i.id.slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 text-xs font-black text-green-300">{initials}</span>
                          <div>
                            <p className="font-semibold text-white">{i.name}</p>
                            <p className="text-xs text-neutral-500">{i.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-200 font-medium max-w-xs truncate" title={i.subject}>{i.subject}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black border uppercase tracking-wider ${
                          i.status === "CLOSED" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                          i.status === "RESPONDED" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                          "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                        }`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-400 font-mono">
                        {new Date(i.createdAt).toLocaleDateString("en-IN")} {new Date(i.createdAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-end items-center">
                          <CrudButton icon={Eye} label="View Message" tone="view" onClick={() => setSelectedInquiry(i)} />
                          {canModify && i.status === "PENDING" && (
                            <CrudButton icon={Check} label="Mark Responded" tone="approve" onClick={() => handleUpdateStatus(i.id, "RESPONDED")} />
                          )}
                          {canModify && i.status !== "CLOSED" && (
                            <CrudButton icon={X} label="Close" tone="reject" onClick={() => handleUpdateStatus(i.id, "CLOSED")} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredInquiries.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-12 text-center text-sm text-neutral-500">No inquiries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0b141b] border border-white/[0.08] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
                  <ClipboardList className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Inquiry Details</h3>
                  <p className="text-[10px] font-mono text-neutral-500">ID: #{selectedInquiry.id.toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-neutral-400 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Sender Name</span>
                  <span className="text-sm font-semibold text-white mt-1 block">{selectedInquiry.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Email Address</span>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-sm font-semibold text-green-300 hover:underline mt-1 block">{selectedInquiry.email}</a>
                </div>
              </div>

              <div>
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Subject</span>
                <span className="text-sm font-bold text-neutral-200 mt-1 block">{selectedInquiry.subject}</span>
              </div>

              <div className="bg-black/20 border border-white/[0.04] rounded-xl p-4">
                <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-2">Message Body</span>
                <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Current Status</span>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-black border uppercase tracking-wider mt-1 ${
                    selectedInquiry.status === "CLOSED" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                    selectedInquiry.status === "RESPONDED" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                    "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                  }`}>
                    {selectedInquiry.status}
                  </span>
                </div>
                {canModify && (
                  <div className="flex gap-2">
                    {selectedInquiry.status === "PENDING" && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedInquiry.id, "RESPONDED");
                        }}
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95 cursor-pointer animate-pulse-slow"
                      >
                        Mark Responded
                      </button>
                    )}
                    {selectedInquiry.status !== "CLOSED" && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedInquiry.id, "CLOSED");
                        }}
                        className="bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20 text-neutral-300 text-xs font-bold px-3 py-2 rounded-lg transition active:scale-95 cursor-pointer"
                      >
                        Close Inquiry
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
