"use client";

import { useState } from "react";
import { Eye, Pencil, Search, ShieldOff, SlidersHorizontal, Trash2, Plus, Ban, Check } from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "../../../../hooks/adminStore";
import { adminPermissionMatrix } from "../_components/adminData";
import { CrudPermissionPanel, DataTable, PrimaryLink, StatusBadge, WhiteLabelShell } from "./_components/WhiteLabelUI";

export default function WhiteLabelPage() {
  const partners = useAdminStore((s) => s.partners);
  const addPartner = useAdminStore((s) => s.addPartner);
  const editPartner = useAdminStore((s) => s.editPartner);
  const deletePartner = useAdminStore((s) => s.deletePartner);
  const hasPermission = useAdminStore((s) => s.hasPermission);

  // Local state for Search and Filter
  const searchQuery = useAdminStore((s) => s.searchQuery || "");
  const setSearchQuery = useAdminStore((s) => s.setSearchQuery);
  const [statusFilter, setStatusFilter] = useState("All"); // All, Active, Suspended

  // Modal control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activePartnerId, setActivePartnerId] = useState("");

  // Add Partner Form fields
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [profitShare, setProfitShare] = useState("20");
  const [maxAllowedShare, setMaxAllowedShare] = useState("40");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState("Active");

  // Edit Partner Form fields
  const [editName, setEditName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editProfitShare, setEditProfitShare] = useState("");
  const [editMaxAllowedShare, setEditMaxAllowedShare] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  // Toast alert status
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !companyName) return;
    addPartner({
      name,
      companyName,
      email,
      profitShare: Number(profitShare),
      maxAllowedShare: Number(maxAllowedShare),
      domain,
      status
    });
    setName("");
    setCompanyName("");
    setEmail("");
    setProfitShare("20");
    setMaxAllowedShare("40");
    setDomain("");
    setIsAddOpen(false);
    triggerToast("Partner Brand Onboarded Successfully!");
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    editPartner(activePartnerId, {
      name: editName,
      companyName: editCompanyName,
      profitShare: Number(editProfitShare),
      maxAllowedShare: Number(editMaxAllowedShare),
      domain: editDomain,
      status: editStatus
    });
    setIsEditOpen(false);
    triggerToast("Partner Config Updated!");
  };

  const handleEditClick = (partner) => {
    setActivePartnerId(partner.id);
    setEditName(partner.name);
    setEditCompanyName(partner.companyName);
    setEditProfitShare(partner.profitShare);
    setEditMaxAllowedShare(partner.maxAllowedShare || 40);
    setEditDomain(partner.domain);
    setEditStatus(partner.status);
    setIsEditOpen(true);
  };

  // Filtered partners list
  const filteredPartners = partners.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "All") return matchesSearch;
    return matchesSearch && p.status === statusFilter;
  });

  if (!hasPermission("partners", "view")) {
    return (
      <WhiteLabelShell title="Access Denied" description="Security restriction active.">
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6">
          <Ban className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Access Denied</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md">
            You do not have the required permissions to view the White Label section.
          </p>
        </div>
      </WhiteLabelShell>
    );
  }

  const canCreate = hasPermission("partners", "create");
  const canEdit = hasPermission("partners", "edit");
  const canDelete = hasPermission("partners", "delete");

  return (
    <WhiteLabelShell
      title="All White Labels"
      description="Manage partner brands, commission splits, revenue ownership, and partner status."
      action={
        canCreate && (
          <button 
            onClick={() => setIsAddOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-green-500 px-4 text-sm font-bold text-black transition hover:bg-green-400"
          >
            + Create White Label
          </button>
        )
      }
    >
      <CrudPermissionPanel permission={adminPermissionMatrix["all-partners"]} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed right-5 top-24 z-50 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300 shadow-2xl backdrop-blur-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Search & Filter */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex h-11 min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-neutral-500">
          <Search className="h-4 w-4" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-neutral-600" 
            placeholder="Search partners..." 
          />
        </label>
        <div className="flex gap-2">
          {["All", "Active", "Suspended"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
                statusFilter === filter 
                  ? "border-green-500/40 bg-green-500/15 text-green-300"
                  : "border-white/[0.08] bg-white/[0.025] text-white hover:bg-white/[0.08]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        headers={["Logo", "Partner / Company", "Revenue Share", "Users", "Total Earnings", "Status", "Actions"]}
        rows={filteredPartners.map((partner) => {
          const totalEarnings = partner.revenue * (partner.profitShare / 100);
          return (
            <tr key={partner.id} className="hover:bg-white/[0.01]">
              <td className="px-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-sm font-black text-green-300">
                  {partner.logo}
                </span>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-white">{partner.name}</p>
                <p className="text-xs text-neutral-400">{partner.companyName}</p>
                <p className="mt-1 text-[11px] text-neutral-500">{partner.domain} | {partner.email}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-semibold text-white">{partner.profitShare}%</p>
                <p className="text-[10px] text-neutral-500">Max Cap: {partner.maxAllowedShare || 40}%</p>
              </td>
              <td className="px-4 py-4 font-semibold text-white">{partner.usersCount.toLocaleString()}</td>
              <td className="px-4 py-4">
                <p className="font-semibold text-green-300">${partner.revenue.toLocaleString()}</p>
                <p className="text-[10px] text-neutral-400">Share: ${totalEarnings.toLocaleString()}</p>
              </td>
              <td className="px-4 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${partner.status === "Active" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                  {partner.status}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/white-label/${partner.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-bold text-white transition hover:bg-white/[0.08]">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Link>
                  {canEdit && (
                    <button 
                      onClick={() => handleEditClick(partner)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 text-xs font-bold text-white transition hover:bg-white/[0.08]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={() => { deletePartner(partner.id); triggerToast("Partner suspended"); }}
                      disabled={partner.status === "Suspended"}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-bold text-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      Disable
                    </button>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      />
      
      {filteredPartners.length === 0 && (
        <div className="text-center py-12 text-neutral-500 bg-white/[0.01] border border-white/[0.05] rounded-xl mt-2">
          No white label partners found matching your search options.
        </div>
      )}

      {/* ADD PARTNER MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddSubmit} className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Create White Label Partner</h3>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Partner Brand Name</span>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ApexCapital" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Company Legal Name</span>
                <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Apex Holdings LLC" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Email Address</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ops@brand.com" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Domain (White Label URL)</span>
                <input type="text" required value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="brand.yourdomain.com" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Profit Share (%)</span>
                <input type="number" required value={profitShare} onChange={(e) => setProfitShare(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Max Allowed (%)</span>
                <input type="number" required value={maxAllowedShare} onChange={(e) => setMaxAllowedShare(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Initial Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </label>
            </div>
            
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Onboard Partner
            </button>
          </form>
        </div>
      )}

      {/* EDIT PARTNER MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditSubmit} className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Edit Partner: {editName}</h3>
              <button type="button" onClick={() => setIsEditOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Brand Name</span>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Company Legal Name</span>
                <input type="text" required value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>

            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Domain (White Label URL)</span>
              <input type="text" required value={editDomain} onChange={(e) => setEditDomain(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>

            <div className="grid grid-cols-3 gap-2">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Profit Share (%)</span>
                <input type="number" required value={editProfitShare} onChange={(e) => setEditProfitShare(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Max Cap (%)</span>
                <input type="number" required value={editMaxAllowedShare} onChange={(e) => setEditMaxAllowedShare(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </label>
            </div>
            
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Save Config changes
            </button>
          </form>
        </div>
      )}
    </WhiteLabelShell>
  );
}
