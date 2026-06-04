"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CreditCard, ArrowDownLeft, Crown, TrendingUp, FileText, Shield, LifeBuoy, Settings, Check, Trash2, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminStore } from "../../../hooks/adminStore";
import { apiFetch } from "../../../lib/apiFetch";
import { socket } from "../../../lib/socket";

const CATEGORY_ICONS = {
  TRADE: TrendingUp,
  PAYMENT: CreditCard,
  WITHDRAWAL: ArrowDownLeft,
  SUBSCRIPTION: Crown,
  PROFIT: TrendingUp, // Use TrendingUp or similar for profit credited
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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const currentUser = useAdminStore((s) => s.currentUser);
  const isAdmin = currentUser && ["SUPER_ADMIN", "MANAGER", "VIEWER"].includes(currentUser.role);

  // Fetch notifications initially
  const loadNotifications = async () => {
    try {
      const res = await apiFetch("/api/notifications?page=1&limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.warn("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    loadNotifications();

    // Retrieve local storage JWT token
    const userStr = typeof window !== "undefined" ? localStorage.getItem("tradebot-user") : null;
    let token = null;
    if (userStr) {
      try {
        token = JSON.parse(userStr)?.token || null;
      } catch (e) {}
    }

    // Setup Shared Socket.IO Client for Real-Time notifications
    socket.io.opts.query = { userId: currentUser.id };
    socket.auth = { token };
    
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("Connected to notifications socket room:", `user-${currentUser.id}`);
    };

    const handleNotification = (notif) => {
      // Prepend to list
      setNotifications((prev) => [notif, ...prev.slice(0, 4)]);
      // Increment unread count
      setUnreadCount((prev) => prev + 1);

      // Trigger standard floating toast alert
      if (notif.showToast !== false) {
        setToast({
          id: notif.id,
          title: notif.title,
          body: notif.body,
          severity: notif.severity,
          category: notif.category,
          link: notif.link,
        });

        // Auto dismiss toast after 5 seconds
        setTimeout(() => {
          setToast((current) => (current && current.id === notif.id ? null : current));
        }, 5000);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("notification", handleNotification);

    // Close on click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification", handleNotification);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, status: "READ" })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Failed to mark all notifications as read", e);
    }
  };

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    // Mark as read in DB if it was unread
    if (notif.status === "UNREAD") {
      try {
        await apiFetch(`/api/notifications/${notif.id}/read`, { method: "PATCH" });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, status: "READ" } : n))
        );
      } catch (e) {
        console.error("Failed to mark notification as read", e);
      }
    }

    // Determine path based on role and link
    const targetLink = notif.link || (isAdmin ? "/admin/dashboard" : "/dashboard");
    router.push(targetLink);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent trigger click navigation
    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // If it was unread, decrement the count
        const target = notifications.find((n) => n.id === id);
        if (target && target.status === "UNREAD") {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        // Load replacement from backend
        loadNotifications();
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const getRelativeTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      return `${diffDays}d ago`;
    } catch {
      return "";
    }
  };

  const handleToastClick = () => {
    if (toast) {
      const target = toast.link || (isAdmin ? "/admin/dashboard" : "/dashboard");
      router.push(target);
      setToast(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] active:scale-95 transition cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-black text-black animate-[pulse_2s_infinite]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown Dialog */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0b141b]/95 p-1 shadow-2xl backdrop-blur-xl z-50 animate-[fadeIn_0.15s_ease-out]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                {unreadCount > 0 ? `You have ${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : "All caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-[10px] font-bold text-green-400 hover:text-green-300 transition cursor-pointer px-2 py-1 rounded bg-green-500/10"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[320px] overflow-y-auto divide-y divide-white/[0.06] scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="h-8 w-8 text-neutral-600 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-neutral-500 font-semibold">No notifications yet</p>
                <p className="text-[10px] text-neutral-600 mt-1">We will alert you on event distributions.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = CATEGORY_ICONS[notif.category] || Bell;
                const iconColorClass = CATEGORY_COLORS[notif.category] || CATEGORY_COLORS.SYSTEM;
                const isUnread = notif.status === "UNREAD";

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 p-4 text-left cursor-pointer transition hover:bg-white/[0.04] ${
                      isUnread ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    {/* Icon Badge */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColorClass}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className={`text-xs leading-snug truncate ${isUnread ? "font-bold text-white" : "text-neutral-300"}`}>
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-green-400 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-400 leading-normal line-clamp-2">
                        {notif.body}
                      </p>
                      <p className="mt-2 text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
                        {getRelativeTime(notif.createdAt)}
                      </p>
                    </div>

                    {/* Delete action button */}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="text-neutral-600 hover:text-red-400 p-1 rounded hover:bg-white/[0.04] shrink-0 transition"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-white/10 p-2 text-center">
            <Link
              href={isAdmin ? "/admin/notifications" : "/dashboard/notifications"}
              onClick={() => setIsOpen(false)}
              className="block rounded-lg py-2 text-xs font-bold text-neutral-400 hover:bg-white/[0.04] hover:text-white transition"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}

      {/* Floating Foreground Real-Time Toast Alert */}
      {toast && (
        <div
          onClick={handleToastClick}
          className="fixed bottom-6 right-6 w-80 sm:w-96 rounded-2xl border border-white/10 bg-[#0b141b]/95 p-4 shadow-2xl backdrop-blur-xl z-[999] flex gap-3 cursor-pointer hover:border-green-500/20 active:scale-[0.99] transition animate-[slideIn_0.2s_ease-out]"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            CATEGORY_COLORS[toast.category] || CATEGORY_COLORS.SYSTEM
          }`}>
            {(() => {
              const Icon = CATEGORY_ICONS[toast.category] || Bell;
              return <Icon className="h-5 w-5" />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <h4 className="text-xs font-bold text-white truncate">{toast.title}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToast(null);
                }}
                className="text-neutral-500 hover:text-white p-0.5 rounded transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400 leading-normal line-clamp-2">
              {toast.body}
            </p>
            <p className="mt-2 text-[9px] text-green-400 font-bold tracking-widest uppercase">
              Click to view details
            </p>
          </div>
        </div>
      )}

      {/* CSS Animation Keyframes for dropdown fadeIn and toast slideIn */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
