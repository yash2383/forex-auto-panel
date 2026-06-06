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

  const fields = [
    {
      icon: User,
      label: "Full Name",
      value: profile?.name || "—",
      editable: true,
    },
    {
      icon: Mail,
      label: "Email Address",
      value: profile?.email || "—",
      editable: false,
    },
    {
      icon: Shield,
      label: "Account Status",
      value: null,
      badge: true,
      editable: false,
    },
    {
      icon: Calendar,
      label: "Member Since",
      value: formatDate(profile?.createdAt),
      editable: false,
    },
    {
      icon: Sparkles,
      label: "Current Plan",
      value: profile?.activePlan?.name || "No Active Plan",
      editable: false,
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="p-6 border-b border-white/[0.06]">
        <h3 className="text-lg font-bold text-white">Account Information</h3>
        <p className="text-sm text-neutral-500 mt-1">Your personal details and account settings</p>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {fields.map((field) => {
          const Icon = field.icon;
          return (
            <div key={field.label} className="flex items-center justify-between px-6 py-5 hover:bg-white/[0.01] transition">
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-neutral-400">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{field.label}</p>
                  {field.badge ? (
                    <span className={`mt-1 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-bold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
                  ) : field.editable && editing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/[0.06] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-green-500/40 transition w-64"
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-0.5 text-sm font-semibold text-white truncate">{field.value}</p>
                  )}
                </div>
              </div>

              {field.editable && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-neutral-400 hover:text-white hover:border-white/20 transition"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
