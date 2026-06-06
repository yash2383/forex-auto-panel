"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, LogOut, Clock, Shield, CheckCircle } from "lucide-react";
import { apiFetch } from "../../../lib/apiFetch";
import { useAdminStore } from "../../../hooks/adminStore";

function formatDateTime(dateStr) {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SecuritySettings({ profile }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation do not match." });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/user/password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.message || "Failed to change password." });
      }
    } catch {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("tradebot-user");
    localStorage.removeItem("tradebot-authenticated");
    document.cookie = "tradebot-token=; path=/; max-age=0; SameSite=Lax";
    useAdminStore.setState({ currentUser: null });
    window.location.href = "/login";
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] text-neutral-400">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <p className="text-sm text-neutral-500">Update your password to keep your account secure</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-green-500/40 placeholder:text-neutral-600"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-green-500/40 placeholder:text-neutral-600"
                placeholder="Enter new password (min. 6 characters)"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-12 text-sm text-white outline-none transition focus:border-green-500/40 placeholder:text-neutral-600"
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white/[0.08] border border-white/10 px-6 text-sm font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Session Info & Logout */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-lg font-bold text-white">Session & Security</h3>
          <p className="text-sm text-neutral-500 mt-1">Manage your active sessions</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] p-4 border border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-neutral-500" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Last Login</p>
                <p className="text-sm font-semibold text-white mt-0.5">{formatDateTime(profile?.lastLoginAt)}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-bold text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Log Out of All Devices
          </button>
        </div>
      </div>
    </div>
  );
}
