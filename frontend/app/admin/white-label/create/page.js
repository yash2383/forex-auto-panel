"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { adminPermissionMatrix } from "../../../dashboard/_components/dashboardData";
import { useAdminStore } from "../../../../hooks/adminStore";
import { CrudPermissionPanel, FormInput, WhiteLabelShell } from "../_components/WhiteLabelUI";

export default function CreateWhiteLabelPage() {
  const addPartner = useAdminStore((s) => s.addPartner);
  const router = useRouter();
  const hasPermission = useAdminStore((s) => s.hasPermission);

  // Form states
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profitShare, setProfitShare] = useState("20");
  const [maxAllowedShare, setMaxAllowedShare] = useState("40");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState(true);

  if (!hasPermission("partners", "create")) {
    return (
      <WhiteLabelShell title="Access Denied" description="Security restriction active.">
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6">
          <AlertTriangle className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-bold text-white">Access Denied</h3>
          <p className="mt-2 text-sm text-neutral-400 max-w-md">
            You do not have the required permissions to create a new White Label partner.
          </p>
          <Link href="/admin/white-label" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-white/[0.08] px-4 text-xs font-bold text-white hover:bg-white/[0.15] transition">
            Return to Directory
          </Link>
        </div>
      </WhiteLabelShell>
    );
  }

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !companyName || !email || !password) {
      alert("Please fill in all required fields.");
      return;
    }
    
    addPartner({
      name,
      companyName,
      email,
      profitShare: Number(profitShare),
      maxAllowedShare: Number(maxAllowedShare),
      domain,
      status: status ? "Active" : "Suspended"
    });

    // Navigate back to directory
    router.push("/admin/white-label");
  };

  return (
    <WhiteLabelShell title="Create White Label" description="Add a new partner brand with login access, commission rules, branding, and optional domain mapping.">
      <CrudPermissionPanel permission={adminPermissionMatrix["create-partner"]} />

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-xl border border-white/[0.08] bg-[#081118]/95 p-6 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)] space-y-4">
        <h2 className="text-xl font-semibold text-white">Partner Details</h2>
        
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Brand Name <span className="text-red-400">*</span></span>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ApexCapital" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Company Name <span className="text-red-400">*</span></span>
            <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Apex Holdings LLC" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Email / Login Username <span className="text-red-400">*</span></span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partner@example.com" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Password <span className="text-red-400">*</span></span>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Profit Share %</span>
              <input type="number" required value={profitShare} onChange={(e) => setProfitShare(e.target.value)} className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Max Allowed %</span>
              <input type="number" required value={maxAllowedShare} onChange={(e) => setMaxAllowedShare(e.target.value)} className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Custom Domain (optional)</span>
            <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="partner.yourdomain.com" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 px-4 text-sm text-white outline-none focus:border-green-500/50" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-white">Logo Upload (optional)</span>
            <input type="file" className="h-12 w-full rounded-lg border border-white/[0.08] bg-black/10 p-2 text-sm text-neutral-400 outline-none" />
          </label>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div>
            <p className="text-sm font-semibold text-white">Status</p>
            <p className="mt-1 text-xs text-neutral-500">Enable this partner immediately after creation.</p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input type="checkbox" checked={status} onChange={(e) => setStatus(e.target.checked)} className="peer sr-only" />
            <span className="h-6 w-11 rounded-full bg-neutral-700 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-green-500 peer-checked:after:translate-x-5"></span>
          </label>
        </div>

        <button type="submit" className="w-full mt-6 h-12 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition">
          Create Partner
        </button>
      </form>
    </WhiteLabelShell>
  );
}
