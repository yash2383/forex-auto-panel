"use client";

import { User, Mail, Calendar, Shield, Sparkles, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

const statusColors = {
  NEW: { label: "New", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  ACTIVE: { label: "Active", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
  VIP: { label: "VIP", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  BLOCKED: { label: "Blocked", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  EXPIRED: { label: "Expired", color: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/20" },
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AccountDetails({ profile, onUpdateName }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);

  const statusCfg = statusColors[profile?.status] || statusColors.NEW;

  const handleSave = async () => {
    if (!name.trim() || name.trim() === profile?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    await onUpdateName(name.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setName(profile?.name || "");
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1110]/95 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-lg font-bold text-white">Account Information</h3>
        <p className="text-xs text-neutral-500 mt-1">View and update your personal profile details</p>
      </div>

      <div className="divide-y divide-white/5">
        {/* Full Name */}
        <div className="flex items-center justify-between px-6 py-4.5 hover:bg-white/[0.01] transition">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
              <User className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Full Name</p>
              {editing ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1 text-sm text-white outline-none focus:border-green-500/40 transition w-48 sm:w-64"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="mt-0.5 text-sm font-semibold text-white truncate">{profile?.name || "—"}</p>
              )}
            </div>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs font-semibold text-neutral-400 hover:text-white hover:border-white/20 transition"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {/* Email */}
        <div className="flex items-center justify-between px-6 py-4.5">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
              <Mail className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Email Address</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{profile?.email || "—"}</p>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="flex items-center justify-between px-6 py-4.5">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
              <Shield className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Account Status</p>
              <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center justify-between px-6 py-4.5">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
              <Calendar className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Member Since</p>
              <p className="mt-0.5 text-sm font-semibold text-white">{formatDate(profile?.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="flex items-center justify-between px-6 py-4.5">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-300">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Current Plan</p>
              <p className="mt-0.5 text-sm font-semibold text-white">
                {profile?.activePlan?.name || "No Active Plan"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
