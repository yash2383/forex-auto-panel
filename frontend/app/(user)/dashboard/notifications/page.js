"use client";

import { useEffect, useState } from "react";
import { Bell, CreditCard, ArrowDownLeft, Crown, TrendingUp, FileText, Shield, LifeBuoy, Settings, Check, Trash2, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight, Mail, BellOff, Info } from "lucide-react";
import { apiFetch } from "../../../../lib/apiFetch";
import { useAdminStore } from "../../../../hooks/adminStore";

const CATEGORY_ICONS = {
  TRADE: TrendingUp,
  PAYMENT: CreditCard,
  WITHDRAWAL: ArrowDownLeft,
  SUBSCRIPTION: Crown,
  PROFIT: TrendingUp,
  REPORT: FileText,
  SECURITY: Shield,
  SUPPORT: LifeBuoy,
  SYSTEM: Settings,
};

const CATEGORY_COLORS = {
  TRADE: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PAYMENT: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  WITHDRAWAL: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  SUBSCRIPTION: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  PROFIT: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  REPORT: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  SECURITY: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
  SUPPORT: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  SYSTEM: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20",
};

export default function UserNotificationCenter() {
  const [activeTab, setActiveTab] = useState("all-alerts"); // "all-alerts", "preferences"
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState("ALL"); // "ALL", "UNREAD", "READ"
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prefLoading, setPrefLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUser = useAdminStore((s) => s.currentUser);

  // Load Notifications
  const loadNotifications = async (page = 1, filter = statusFilter) => {
    setLoading(true);
    try {
      const statusParam = filter !== "ALL" ? `&status=${filter}` : "";
      const res = await apiFetch(`/api/notifications?page=${page}&limit=10${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setPagination(data.pagination || { page, limit: 10, total: 0, pages: 1 });
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Failed to load notifications page", e);
    } finally {
      setLoading(false);
    }
  };

  // Load Preferences
  const loadPreferences = async () => {
    setPrefLoading(true);
    try {
      const res = await apiFetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences || []);
      }
    } catch (e) {
      console.error("Failed to load preferences", e);
    } finally {
      setPrefLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadNotifications(1, statusFilter);
    }
  }, [currentUser, statusFilter]);

  useEffect(() => {
    if (currentUser && activeTab === "preferences") {
      loadPreferences();
    }
  }, [currentUser, activeTab]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadNotifications(newPage, statusFilter);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark read", e);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        loadNotifications(pagination.page, statusFilter);
      }
    } catch (e) {
      console.error("Failed to delete", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  const handleTogglePreference = async (category, channel, currentValue) => {
    const updatedValue = !currentValue;
    try {
      // Optimistic update
      setPreferences((prev) =>
        prev.map((p) =>
          p.category === category
            ? { ...p, [`${channel}Enabled`]: updatedValue }
            : p
        )
      );

      const payload = {
        category,
        [`${channel}Enabled`]: updatedValue,
      };

      const res = await apiFetch("/api/notifications/preferences", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Rollback on failure
        setPreferences((prev) =>
          prev.map((p) =>
            p.category === category
              ? { ...p, [`${channel}Enabled`]: currentValue }
              : p
          )
        );
      }
    } catch (e) {
      console.error("Failed to toggle preference", e);
      // Rollback on failure
      setPreferences((prev) =>
        prev.map((p) =>
          p.category === category
            ? { ...p, [`${channel}Enabled`]: currentValue }
            : p
        )
      );
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Visual background gradient effects */}
      <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-green-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      {/* Glassmorphic Stats Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#05100c]/60 p-6 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Unread Alerts</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{unreadCount}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
            <Bell className="h-6 w-6 animate-[bounce_3s_infinite]" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#05100c]/60 p-6 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Total Received</p>
            <h3 className="text-3xl font-black text-white mt-1.5">{pagination.total}</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#05100c]/60 p-6 backdrop-blur-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Notification Channels</p>
            <h3 className="text-3xl font-black text-white mt-1.5">3 Active</h3>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Mail className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-1">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("all-alerts")}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition relative cursor-pointer ${
              activeTab === "all-alerts" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            All Alerts
            {activeTab === "all-alerts" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition relative cursor-pointer ${
              activeTab === "preferences" ? "text-white" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Channel Preferences
            {activeTab === "preferences" && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-400 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === "all-alerts" && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs font-bold text-green-300 hover:bg-green-500 hover:text-black transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {/* Tab: All Alerts List */}
      {activeTab === "all-alerts" && (
        <div className="space-y-4">
          {/* Status Filters Bar */}
          <div className="flex gap-2">
            {["ALL", "UNREAD", "READ"].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold tracking-wide uppercase transition cursor-pointer ${
                  statusFilter === filter
                    ? "bg-white/[0.08] text-white border border-white/20"
                    : "text-neutral-400 bg-white/[0.02] border border-white/5 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {filter === "ALL" ? "All Alerts" : filter.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Table/List Wrapper */}
          <div className="rounded-2xl border border-white/10 bg-[#05100c]/40 overflow-hidden backdrop-blur-xl">
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto" />
                <p className="mt-3 text-xs text-neutral-500 font-bold uppercase tracking-wider">Syncing notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-24 text-center">
                <Bell className="h-12 w-12 text-neutral-600 mx-auto mb-4 opacity-40" />
                <h4 className="text-sm font-bold text-white">No alerts found</h4>
                <p className="mt-1.5 text-xs text-neutral-500 max-w-sm mx-auto">
                  {statusFilter === "UNREAD"
                    ? "You don't have any unread notifications at this time."
                    : "There are no notifications matching your active filter."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {notifications.map((notif) => {
                  const Icon = CATEGORY_ICONS[notif.category] || Bell;
                  const isUnread = notif.status === "UNREAD";

                  return (
                    <div
                      key={notif.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition hover:bg-white/[0.02] ${
                        isUnread ? "bg-white/[0.01]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon Container */}
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${CATEGORY_COLORS[notif.category] || CATEGORY_COLORS.SYSTEM}`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Title and details */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm leading-snug ${isUnread ? "font-bold text-white" : "text-neutral-300"}`}>
                              {notif.title}
                            </h4>
                            {isUnread && (
                              <span className="rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-[9px] font-bold text-green-300 uppercase tracking-widest">
                                New
                              </span>
                            )}
                            <span className="text-[10px] text-neutral-500 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono uppercase">
                              {notif.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed max-w-2xl">{notif.body}</p>
                          <p className="text-[10px] text-neutral-500 font-semibold">{formatDate(notif.createdAt)}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isUnread && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            className="flex h-9 items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 text-xs font-bold text-green-300 hover:bg-green-500 hover:text-black transition cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-neutral-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-neutral-500 font-semibold">
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-neutral-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Preferences Settings */}
      {activeTab === "preferences" && (
        <div className="rounded-2xl border border-white/10 bg-[#05100c]/40 p-6 backdrop-blur-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Alert Delivery Channels</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-normal max-w-xl">
              Opt-in or opt-out of alert channels by category. Highly critical alerts (e.g. login detections, password modifications, account suspensions) are automatically routed and bypass these configurations.
            </p>
          </div>

          {/* Warning banner */}
          <div className="flex gap-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs text-yellow-300 max-w-3xl">
            <Info className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Important Security Notice</p>
              <p className="mt-1 text-yellow-300/80 leading-normal">
                Critical account and payment notifications bypass opt-out preferences and are always dispatched to secure email and push systems.
              </p>
            </div>
          </div>

          {prefLoading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto" />
              <p className="mt-3 text-xs text-neutral-500 font-bold uppercase tracking-wider">Syncing preferences...</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl">
              {/* Preferences list */}
              {preferences.map((pref) => {
                const Icon = CATEGORY_ICONS[pref.category] || Bell;

                return (
                  <div
                    key={pref.category}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${CATEGORY_COLORS[pref.category] || CATEGORY_COLORS.SYSTEM}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">{pref.category} alerts</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5 font-semibold">Toggles channels for {pref.category.toLowerCase()} events</p>
                      </div>
                    </div>

                    {/* Preferences togglers */}
                    <div className="flex gap-6 self-end sm:self-center">
                      {/* Bell/In-App Toggler */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">In-App</span>
                        <button
                          onClick={() => handleTogglePreference(pref.category, "bell", pref.bellEnabled)}
                          className="text-green-400 hover:text-green-300 transition cursor-pointer"
                        >
                          {pref.bellEnabled ? (
                            <ToggleRight className="h-6.5 w-6.5 text-green-400" />
                          ) : (
                            <ToggleLeft className="h-6.5 w-6.5 text-neutral-600" />
                          )}
                        </button>
                      </div>

                      {/* Email Toggler */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Email</span>
                        <button
                          onClick={() => handleTogglePreference(pref.category, "email", pref.emailEnabled)}
                          className="text-green-400 hover:text-green-300 transition cursor-pointer"
                        >
                          {pref.emailEnabled ? (
                            <ToggleRight className="h-6.5 w-6.5 text-green-400" />
                          ) : (
                            <ToggleLeft className="h-6.5 w-6.5 text-neutral-600" />
                          )}
                        </button>
                      </div>

                      {/* Push Toggler */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Push</span>
                        <button
                          onClick={() => handleTogglePreference(pref.category, "push", pref.pushEnabled)}
                          className="text-green-400 hover:text-green-300 transition cursor-pointer"
                        >
                          {pref.pushEnabled ? (
                            <ToggleRight className="h-6.5 w-6.5 text-green-400" />
                          ) : (
                            <ToggleLeft className="h-6.5 w-6.5 text-neutral-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
