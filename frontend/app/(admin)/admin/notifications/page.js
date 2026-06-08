"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";
import { socket } from "../../../../lib/socket";
import {
  BarChart3,
  Send,
  ListFilter,
  Code,
  ToggleLeft,
  Search,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Bell,
  Smartphone,
  Zap,
  Info
} from "lucide-react";

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";
const adminInput = "h-10 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-xs text-white outline-none focus:border-green-500/35 transition placeholder:text-neutral-600 disabled:text-neutral-500";

const tabList = [
  { id: "events", label: "Event Settings", icon: ToggleLeft },
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "broadcasts", label: "Broadcasts", icon: Send },
  { id: "logs", label: "Notification Logs", icon: ListFilter },
  { id: "templates", label: "Templates", icon: Code }
];

const EVENT_CATEGORIES = [
  {
    key: "security",
    title: "Security Notifications",
    events: [
      { type: "NEW_LOGIN", label: "Login Success" },
      { type: "ADMIN_LOGIN", label: "Admin Login Alert" },
      { type: "PASSWORD_CHANGED", label: "Password Reset / Changed" },
      { type: "EMAIL_CHANGED", label: "Email Changed Alert" },
      { type: "ACCOUNT_BLOCKED", label: "Account Blocked" },
      { type: "TWO_FACTOR_ENABLED", label: "2FA Enabled" },
      { type: "TWO_FACTOR_DISABLED", label: "2FA Disabled" },
    ]
  },
  {
    key: "transaction",
    title: "Transaction Notifications",
    events: [
      { type: "PAYMENT_SUBMITTED", label: "Deposit Received / Under Review" },
      { type: "PAYMENT_APPROVED", label: "Deposit Approved" },
      { type: "PAYMENT_REJECTED", label: "Deposit Rejected" },
      { type: "DEPOSIT_APPROVED", label: "Deposit Confirmed" },
      { type: "DEPOSIT_REJECTED", label: "Deposit Rejected" },
      { type: "WITHDRAWAL_REQUESTED", label: "Withdrawal Requested" },
      { type: "WITHDRAWAL_APPROVED", label: "Withdrawal Approved" },
      { type: "WITHDRAWAL_REJECTED", label: "Withdrawal Rejected" },
    ]
  },
  {
    key: "trading",
    title: "Trading Notifications",
    events: [
      { type: "TRADE_PUBLISHED", label: "New Trade Signal" },
      { type: "TRADE_OPENED", label: "Trade Opened" },
      { type: "TRADE_CLOSED", label: "Trade Closed" },
      { type: "TRADE_CANCELLED", label: "Trade Cancelled" },
      { type: "TAKE_PROFIT_HIT", label: "Take Profit Hit" },
      { type: "STOP_LOSS_HIT", label: "Stop Loss Hit (Loss Alert)" },
      { type: "SIGNAL_UPDATED", label: "Trade Signal Updated" },
      { type: "PROFIT_DISTRIBUTED", label: "Profit Credited" },
    ]
  },
  {
    key: "kycSystem",
    title: "KYC & System Notifications",
    events: [
      { type: "PLAN_ACTIVATED", label: "KYC / Plan Approved" },
      { type: "PLAN_EXPIRING", label: "Plan Expiring Warning" },
      { type: "PLAN_EXPIRED", label: "Plan Expired Alert" },
      { type: "PLAN_UPGRADED", label: "Plan Upgraded" },
      { type: "PLAN_DOWNGRADED", label: "Plan Downgraded" },
      { type: "REPORT_READY", label: "Report Ready to Download" },
      { type: "TICKET_CREATED", label: "Support Ticket Created" },
      { type: "TICKET_REPLIED", label: "Support Ticket Replied" },
      { type: "TICKET_CLOSED", label: "Support Ticket Closed" },
      { type: "ADMIN_CREATED", label: "Operator Added" },
      { type: "ADMIN_REMOVED", label: "Operator Removed" },
      { type: "SYSTEM", label: "General System Alert" },
    ]
  }
];

const TEMPLATE_EVENTS = [
  { event: "NEW_LOGIN", label: "Login Alert" },
  { event: "DEPOSIT_APPROVED", label: "Deposit Success" },
  { event: "WITHDRAWAL_APPROVED", label: "Withdrawal Success" },
  { event: "WITHDRAWAL_REJECTED", label: "Withdrawal Rejected" },
  { event: "TRADE_OPENED", label: "Trade Executed" },
  { event: "PROFIT_DISTRIBUTED", label: "Profit Distribution" },
  { event: "ACCOUNT_BLOCKED", label: "Security Alert" },
  { event: "SYSTEM", label: "Broadcast Message" }
];

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState("events");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState("default");

  // Auth User
  const currentUser = useAdminStore((s) => s.currentUser);

  // TAB state: Overview
  const [analytics, setAnalytics] = useState(null);
  const [activeDevicesCount, setActiveDevicesCount] = useState(0);
  const [hasCurrentUserDevice, setHasCurrentUserDevice] = useState(false);

  // TAB state: Broadcasts
  const [broadcasts, setBroadcasts] = useState([]);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
  const [scheduleMode, setScheduleMode] = useState("now");
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    audience: "ALL_USERS",
    channels: ["BELL", "PUSH"],
    scheduledAt: ""
  });
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // V2 Broadcast Recipient Preview Panel state
  const [audiencePreviewData, setAudiencePreviewData] = useState(null);
  const [audiencePreviewLoading, setAudiencePreviewLoading] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [audiencePage, setAudiencePage] = useState(1);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [filterKycVerified, setFilterKycVerified] = useState(false);
  const [filterHasActiveInvestment, setFilterHasActiveInvestment] = useState(false);

  // TAB state: Notification Logs
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [deliveryNextCursor, setDeliveryNextCursor] = useState(null);
  const [logFilters, setLogFilters] = useState({
    status: "",
    channel: "",
    event: "",
    user: "",
  });

  // TAB state: Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState("NEW_LOGIN");
  const [templateChannel, setTemplateChannel] = useState("BELL");
  const [editedTemplate, setEditedTemplate] = useState(null);

  // TAB state: Event Settings
  const [events, setEvents] = useState([]);
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({
    security: true,
    transaction: true,
    trading: true,
    kycSystem: true
  });

  const showStatus = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      if (tab === "overview") {
        const res = await apiFetch("/api/notifications/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
        const devRes = await apiFetch("/api/notifications/admin/devices?isActive=true&limit=1");
        if (devRes.ok) {
          const devData = await devRes.json();
          setActiveDevicesCount(devData.total || devData.devices?.length || 0);
        }
        if (currentUser && currentUser.id) {
          const isAdmin = ["SUPER_ADMIN", "MANAGER", "VIEWER"].includes(currentUser.role);
          const filterParam = isAdmin ? `adminId=${currentUser.id}` : `userId=${currentUser.id}`;
          const userDevRes = await apiFetch(`/api/notifications/admin/devices?${filterParam}&isActive=true&limit=5`);
          if (userDevRes.ok) {
            const userDevData = await userDevRes.json();
            const devices = userDevData.devices || [];
            setHasCurrentUserDevice(devices.length > 0);
          }
        } else {
          setHasCurrentUserDevice(false);
        }
        await fetchDeliveries(null, 20); 
      } else if (tab === "broadcasts") {
        const res = await apiFetch("/api/notifications/admin/broadcasts");
        if (res.ok) {
          const data = await res.json();
          setBroadcasts(data.broadcasts || []);
        }
      } else if (tab === "logs") {
        await fetchDeliveries();
      } else if (tab === "templates") {
        const res = await apiFetch("/api/notifications/admin/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates || []);
        }
      } else if (tab === "events") {
        const res = await apiFetch("/api/notifications/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      }
    } catch (e) {
      console.error("Load tab data error:", e);
      showStatus("Failed to load tab data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Dynamic recipient details hook on audience/cohort changes
  useEffect(() => {
    if (!showCreateBroadcast) return;
    const fetchAudiencePreview = async () => {
      setAudiencePreviewLoading(true);
      try {
        const res = await apiFetch(`/api/notifications/admin/audience-preview?segment=${broadcastForm.audience}`);
        if (res.ok) {
          const data = await res.json();
          setAudiencePreviewData(data);
          setAudiencePage(1); 
        }
      } catch (e) {
        console.error(e);
      } finally {
        setAudiencePreviewLoading(false);
      }
    };
    fetchAudiencePreview();
  }, [broadcastForm.audience, showCreateBroadcast]);

  // Sync edited template when event, channel or templates list changes
  useEffect(() => {
    if (activeTab !== "templates") return;
    const match = templates.find(t => t.event === selectedTemplateEvent && t.channel === templateChannel);
    if (match) {
      setEditedTemplate({ ...match });
    } else {
      setEditedTemplate({
        event: selectedTemplateEvent,
        channel: templateChannel,
        title: "",
        body: "",
        version: 1
      });
    }
  }, [selectedTemplateEvent, templateChannel, templates, activeTab]);

  // Socket.IO Listeners for real-time progress updates
  useEffect(() => {
    if (!currentUser) return;
    const userStr = typeof window !== "undefined" ? localStorage.getItem("forex-auto-panel-user") : null;
    let token = null;
    if (userStr) {
      try {
        token = JSON.parse(userStr)?.token || null;
      } catch (e) {}
    }

    socket.io.opts.query = { userId: currentUser.id };
    socket.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    const handleProgress = (data) => {
      setBroadcasts((prev) =>
        prev.map((b) => {
          if (b.id === data.id) {
            return {
              ...b,
              status: data.percent === 100 ? "SENT" : "SENDING",
              execution: {
                ...b.execution,
                sentUsers: data.sent,
                targetUsers: data.total,
                successCount: data.sent,
                failedCount: 0,
              },
            };
          }
          return b;
        })
      );
    };

    socket.on("broadcast_progress", handleProgress);
    return () => {
      socket.off("broadcast_progress", handleProgress);
    };
  }, [currentUser]);

  // Deliveries fetching helper
  const fetchDeliveries = async (cursorVal = null, limit = 50) => {
    setLoading(true);
    try {
      let url = `/api/notifications/admin/deliveries?limit=${limit}`;
      if (cursorVal) url += `&cursor=${cursorVal}`;
      if (logFilters.status) url += `&status=${logFilters.status}`;
      if (logFilters.channel) url += `&channel=${logFilters.channel}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
        setDeliveryNextCursor(data.nextCursor || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Preview Broadcast
  const handlePreviewBroadcast = async () => {
    if (!broadcastForm.audience) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/broadcasts/preview", {
        method: "POST",
        body: JSON.stringify({ audience: broadcastForm.audience })
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
        setPreviewing(true);
      }
    } catch (e) {
      console.error(e);
      showStatus("Preview lookup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Create Broadcast Campaign
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...broadcastForm,
        scheduledAt: scheduleMode === "later" ? broadcastForm.scheduledAt : ""
      };
      const res = await apiFetch("/api/notifications/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showStatus("Broadcast created successfully!");
        setShowCreateBroadcast(false);
        setBroadcastForm({
          title: "",
          body: "",
          audience: "ALL_USERS",
          channels: ["BELL", "PUSH"],
          scheduledAt: ""
        });
        setScheduleMode("now");
        loadTabData("broadcasts");
      } else {
        const err = await res.json();
        showStatus(err.message || "Failed to create broadcast", "error");
      }
    } catch (e) {
      console.error(e);
      showStatus("Failed to submit broadcast", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastAction = async (id, action) => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this broadcast?`)) return;

    const approvalRequestId = action === "APPROVE"
      ? (typeof window !== "undefined" && window.crypto?.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`)
      : undefined;

    setLoading(true);
    try {
      const res = await apiFetch(`/api/notifications/admin/broadcasts/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ action, approvalRequestId })
      });
      if (res.ok) {
        showStatus(`Broadcast successfully ${action.toLowerCase()}d.`);
        loadTabData("broadcasts");
      } else {
        const err = await res.json();
        showStatus(err.message || "Action failed", "error");
      }
    } catch (e) {
      console.error(e);
      showStatus("Action submission error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delivery log actions
  const handleRetrySelectedDeliveries = async () => {
    if (selectedDeliveries.length === 0) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/deliveries/retry", {
        method: "POST",
        body: JSON.stringify({ deliveryIds: selectedDeliveries })
      });
      if (res.ok) {
        const data = await res.json();
        showStatus(`Successfully re-queued ${data.count} deliveries for retry!`);
        setSelectedDeliveries([]);
        fetchDeliveries();
      }
    } catch (e) {
      console.error(e);
      showStatus("Failed to retry selected deliveries", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailedDeliveries = async () => {
    if (!confirm("Are you sure you want to retry all failed deliveries?")) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/dlq/retry", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showStatus(`DLQ Retry completed! Affected: ${data.count} jobs.`);
        fetchDeliveries();
      }
    } catch (e) {
      console.error(e);
      showStatus("Failed to retry DLQ", "error");
    } finally {
      setLoading(false);
    }
  };

  // Export delivery logs as CSV
  const handleExportLogs = () => {
    if (!deliveries || deliveries.length === 0) {
      showStatus("No logs to export", "error");
      return;
    }
    const headers = ["ID", "Channel", "Status", "Title", "User ID", "Delivered At", "Error"];
    const rows = deliveries.map((d) => [
      d.id,
      d.channel,
      d.status,
      d.notification?.title || "",
      d.notification?.userId || d.notification?.adminId || "",
      d.deliveredAt ? new Date(d.deliveredAt).toISOString() : "",
      d.error || "",
    ]);
    const csvContent = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notification-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus(`Exported ${deliveries.length} log entries as CSV`);
  };

  // Direct toggle Event Setting
  const handleDirectToggle = async (ev, field) => {
    const newValue = !ev[field];
    const updatedEvent = { ...ev, [field]: newValue };
    
    // Optimistic UI update
    setEvents(events.map(e => e.id === ev.id ? updatedEvent : e));
    
    try {
      const res = await apiFetch("/api/notifications/admin/settings", {
        method: "POST",
        body: JSON.stringify({ events: [updatedEvent] })
      });
      if (!res.ok) {
        throw new Error("Failed to update");
      }
    } catch (e) {
      console.error(e);
      // Revert on failure
      setEvents(events.map(e => e.id === ev.id ? ev : e));
      showStatus("Error updating setting.", "error");
    }
  };

  // Bulk enable/disable settings per category
  const handleBulkToggleCategory = async (categoryKey, targetValue) => {
    const categoryDef = EVENT_CATEGORIES.find(c => c.key === categoryKey);
    if (!categoryDef) return;

    const eventTypes = categoryDef.events.map(e => e.type);
    
    const updatedEvents = events.map(ev => {
      if (eventTypes.includes(ev.event)) {
        return {
          ...ev,
          bellEnabled: targetValue,
          pushEnabled: targetValue,
          socketEnabled: targetValue,
        };
      }
      return ev;
    });

    setEvents(updatedEvents);
    const eventsToPost = updatedEvents.filter(ev => eventTypes.includes(ev.event));
    
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/settings", {
        method: "POST",
        body: JSON.stringify({ events: eventsToPost })
      });
      if (res.ok) {
        showStatus(`Successfully ${targetValue ? "enabled" : "disabled"} all notification channels in group.`);
      } else {
        throw new Error("Failed to bulk update");
      }
    } catch (err) {
      console.error(err);
      showStatus("Bulk toggle failed. Reverting changes...", "error");
      loadTabData("events");
    } finally {
      setLoading(false);
    }
  };

  // Save Template overrides
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/templates", {
        method: "POST",
        body: JSON.stringify({ templates: [editedTemplate] })
      });
      if (res.ok) {
        showStatus("Template updated successfully!");
        const dataRes = await apiFetch("/api/notifications/admin/templates");
        if (dataRes.ok) {
          const data = await dataRes.json();
          setTemplates(data.templates || []);
        }
      }
    } catch (e) {
      console.error(e);
      showStatus("Template update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChannel = (channel) => {
    setBroadcastForm(prev => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter(x => x !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };



  // Toggle collapsible groups helper
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  // Get grouped recent deliveries
  const getRecentDeliveries = () => {
    const groups = {};
    deliveries.forEach(d => {
      if (!d.notification) return;
      const notifId = d.notificationId;
      if (!groups[notifId]) {
        groups[notifId] = {
          title: d.notification.title,
          createdAt: d.notification.createdAt,
          channels: new Set(),
        };
      }
      if (d.status === "DELIVERED") {
        groups[notifId].channels.add(d.channel);
      }
    });

    return Object.values(groups)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(g => {
        const channelList = Array.from(g.channels).filter(ch => ["BELL", "PUSH", "SOCKET", "TOAST"].includes(ch));
        let channelLabel = "Delivered";
        if (channelList.length > 0) {
          channelLabel = channelList
            .map(ch => {
              if (ch === "TOAST") return "Socket";
              return ch.charAt(0) + ch.slice(1).toLowerCase();
            })
            .filter((val, index, self) => self.indexOf(val) === index)
            .join(" + ") + " Delivered";
        }
        
        const diffMs = Date.now() - new Date(g.createdAt).getTime();
        const diffMins = Math.max(1, Math.floor(diffMs / 60000));
        let timeLabel = `${diffMins} min ago`;
        if (diffMins >= 60) {
          const diffHours = Math.floor(diffMins / 60);
          timeLabel = diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
          if (diffHours >= 24) {
            timeLabel = new Date(g.createdAt).toLocaleDateString();
          }
        }

        return {
          title: g.title,
          channelLabel,
          timeLabel,
        };
      });
  };

  // Filter deliveries client-side based on event & user filters
  const getFilteredDeliveries = () => {
    return deliveries.filter(d => {
      if (d.channel === "EMAIL" || d.channel === "SMS") return false;
      
      if (logFilters.status && d.status !== logFilters.status) return false;
      if (logFilters.channel && d.channel !== logFilters.channel) return false;
      if (logFilters.event && !d.notification?.title?.toLowerCase().includes(logFilters.event.toLowerCase())) return false;
      if (logFilters.user && !(
        d.notification?.userId?.toLowerCase().includes(logFilters.user.toLowerCase()) ||
        d.notification?.adminId?.toLowerCase().includes(logFilters.user.toLowerCase()) ||
        d.notification?.title?.toLowerCase().includes(logFilters.user.toLowerCase())
      )) return false;
      return true;
    });
  };

  // Template editor live preview renderer
  const renderTemplatePreview = (text) => {
    if (!text) return "Your message will appear here.";
    const sampleData = {
      amount: "5,000",
      name: "Rahul",
      email: "rahul@forex-auto-panel.capital",
      ipAddress: "127.0.0.1",
      pair: "BTC/USDT",
      type: "BUY",
      entryPrice: "67,420.50",
      pnl: "+1,240.00",
      profit: "1,240.00",
      loss: "350.00",
      planName: "Pro Trader",
      days: "3",
      ticketId: "8421",
      message: "System upgrade finished successfully."
    };
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return sampleData[key] !== undefined ? sampleData[key] : match;
    });
  };

  // Channel helper components
  const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <div
      onClick={() => !disabled && onChange()}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
        checked ? "bg-[#00e676]" : "bg-white/10"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </div>
  );

  const getChannelIcon = (ch) => {
    if (ch === "BELL") return <Bell className="h-3 w-3 text-yellow-400" />;
    if (ch === "PUSH") return <Smartphone className="h-3 w-3 text-blue-400" />;
    if (ch === "SOCKET" || ch === "TOAST") return <Zap className="h-3 w-3 text-orange-400" />;
    return null;
  };

  const getChannelName = (ch) => {
    if (ch === "BELL") return "Bell";
    if (ch === "PUSH") return "Push";
    if (ch === "SOCKET" || ch === "TOAST") return "Socket";
    return ch;
  };

  const getAudienceFriendlyName = (aud) => {
    const map = {
      ALL_USERS: "All Users",
      ACTIVE_USERS: "Active Users",
      EXPIRED_USERS: "Expired Users",
      VIP_USERS: "VIP Users",
      CLUB_PLAN: "Club Plan Users",
      INDIVIDUAL_PLAN: "Individual Plan Users",
      ADMINS: "Platform Admins"
    };
    return map[aud] || aud;
  };

  return (
    <div className="space-y-5 w-full max-w-full overflow-x-hidden">
      {/* Toast Alert */}
      {message && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-semibold shadow-2xl transition-all duration-300 animate-slide-in ${
          message.type === "error" ? "border-red-500/30 bg-red-950/80 text-red-200" : "border-green-500/30 bg-green-950/80 text-green-200"
        }`}>
          {message.type === "error" ? <AlertCircle className="h-4 w-4 text-red-400" /> : <CheckCircle className="h-4 w-4 text-green-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Header */}
      <div className={`${adminPanel} p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-gradient-to-l from-green-500/5 to-transparent blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notifications Control Center</h1>
          <p className="mt-1.5 text-xs text-neutral-400">
            Manage user alerts, broadcasts, and notification delivery.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab("broadcasts");
            setShowCreateBroadcast(true);
          }}
          className="flex items-center justify-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 px-4 py-2 rounded-lg text-xs font-bold transition md:self-center select-none"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Send Broadcast</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/[0.04]">
        {tabList.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPreviewing(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition select-none border-b-2 -mb-[2px] ${
                active
                  ? "border-[#00e676] text-[#00e676]"
                  : "border-transparent text-neutral-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Tab Panel */}
      <div className={`${adminPanel} p-6 min-h-[400px]`}>
        {loading && (
          <div className="flex justify-center items-center py-16 text-xs text-neutral-400 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-green-400" />
            <span>Processing operational request...</span>
          </div>
        )}

        {/* Tab: Event Settings */}
        {!loading && activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Event Channel Triggers</h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">Toggle delivery channels for specific automated platform triggers.</p>
              </div>

              {/* Global Search Bar */}
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search notification events..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full h-9 bg-black/30 border border-white/[0.08] rounded-lg pl-9 pr-4 text-xs text-white placeholder:text-neutral-600 focus:border-[#00e676]/35 outline-none transition"
                />
                <Search className="h-3.5 w-3.5 text-neutral-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="space-y-4">
              {EVENT_CATEGORIES.map(category => {
                const isExpanded = expandedGroups[category.key];
                
                // Filter Category Events Client-side using Event Search Query
                const categoryEvents = category.events
                  .filter(item => item.label.toLowerCase().includes(eventSearchQuery.toLowerCase()))
                  .map(item => {
                    const matchedSetting = events.find(e => e.event === item.type);
                    return matchedSetting ? { ...matchedSetting, friendlyLabel: item.label } : null;
                  })
                  .filter(Boolean);

                if (categoryEvents.length === 0) return null;

                return (
                  <div key={category.key} className="border border-white/[0.06] rounded-xl overflow-hidden bg-black/10">
                    <div className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
                      <button
                        onClick={() => toggleGroup(category.key)}
                        className="flex items-center gap-2 text-xs font-bold text-white transition text-left select-none"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                        <span>{category.title}</span>
                      </button>

                      {/* Enable/Disable All Action Toggles */}
                      {true && (
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleBulkToggleCategory(category.key, true)}
                            className="text-[9px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded hover:bg-green-500/20 active:scale-[0.97] transition"
                          >
                            Enable All
                          </button>
                          <button
                            onClick={() => handleBulkToggleCategory(category.key, false)}
                            className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded hover:bg-red-500/20 active:scale-[0.97] transition"
                          >
                            Disable All
                          </button>
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div>
                        {/* Desktop Layout Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-white/5 text-neutral-500 font-bold uppercase tracking-wider text-[9px] bg-black/5">
                                <th className="px-5 py-2.5">Event</th>
                                <th className="px-5 py-2.5 text-center w-24">🔔 Bell</th>
                                <th className="px-5 py-2.5 text-center w-24">📱 Push</th>
                                <th className="px-5 py-2.5 text-center w-24">⚡ Socket</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {categoryEvents.map(ev => (
                                <tr key={ev.id} className="hover:bg-white/[0.01] transition">
                                  <td className="px-5 py-3 font-semibold text-neutral-300">{ev.friendlyLabel}</td>
                                  <td className="px-5 py-3 text-center">
                                    <ToggleSwitch
                                      checked={ev.bellEnabled}
                                      onChange={() => handleDirectToggle(ev, "bellEnabled")}
                                      disabled={!true}
                                    />
                                  </td>
                                  <td className="px-5 py-3 text-center">
                                    <ToggleSwitch
                                      checked={ev.pushEnabled}
                                      onChange={() => handleDirectToggle(ev, "pushEnabled")}
                                      disabled={!true}
                                    />
                                  </td>
                                  <td className="px-5 py-3 text-center">
                                    <ToggleSwitch
                                      checked={ev.socketEnabled}
                                      onChange={() => handleDirectToggle(ev, "socketEnabled")}
                                      disabled={!true}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Optimized Stacked List View */}
                        <div className="block md:hidden divide-y divide-white/5 bg-white/[0.005]">
                          {categoryEvents.map(ev => (
                            <div key={ev.id} className="p-4 space-y-3">
                              <p className="text-xs font-bold text-neutral-200">{ev.friendlyLabel}</p>
                              <div className="flex flex-wrap gap-4 items-center">
                                <div className="flex items-center gap-1.5 select-none">
                                  <span className="text-[10px] text-neutral-500 font-bold">🔔 Bell:</span>
                                  <ToggleSwitch
                                    checked={ev.bellEnabled}
                                    onChange={() => handleDirectToggle(ev, "bellEnabled")}
                                    disabled={!true}
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 select-none">
                                  <span className="text-[10px] text-neutral-500 font-bold">📱 Push:</span>
                                  <ToggleSwitch
                                    checked={ev.pushEnabled}
                                    onChange={() => handleDirectToggle(ev, "pushEnabled")}
                                    disabled={!true}
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 select-none">
                                  <span className="text-[10px] text-neutral-500 font-bold">⚡ Socket:</span>
                                  <ToggleSwitch
                                    checked={ev.socketEnabled}
                                    onChange={() => handleDirectToggle(ev, "socketEnabled")}
                                    disabled={!true}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Overview */}
        {!loading && activeTab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white">Delivery Summary Metrics</h2>
              <button onClick={() => loadTabData("overview")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Browser Push Notification Diagnostic Status */}
            {notificationPermission !== "granted" || !hasCurrentUserDevice ? (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 text-xs">
                <AlertCircle className="h-4.5 w-4.5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-yellow-300">Push Status: No registered browser device token</h4>
                  <p className="text-neutral-400 mt-1 leading-relaxed">
                    Browser push notifications will not deliver to this device. Current permission: <span className="font-mono text-white font-bold">{notificationPermission}</span>.
                    {notificationPermission === "granted" && (
                      <span className="text-yellow-400/90 block mt-1 font-semibold">
                        ⚠️ Warning: Notifications are allowed by the browser, but this device has not registered successfully in the database.
                      </span>
                    )}
                  </p>
                  <div className="mt-2 text-neutral-300 space-y-1">
                    <p className="font-semibold text-white">Fix:</p>
                    <ol className="list-decimal pl-4 space-y-0.5 text-neutral-400">
                      <li>Enable browser notifications</li>
                      <li>Refresh page</li>
                      <li>Re-register device (check if NEXT_PUBLIC_FIREBASE_VAPID_KEY is configured correctly)</li>
                    </ol>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3 text-xs">
                <CheckCircle className="h-4.5 w-4.5 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-green-300">Push Status: Browser device token active</h4>
                  <p className="text-neutral-400 mt-1 leading-relaxed">
                    Browser push notifications are active for this device. Your browser is registered and ready to receive updates.
                  </p>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-black/20 border border-white/[0.06] rounded-xl p-5 font-sans">
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Total Sent</p>
                <p className="text-2xl font-black text-white mt-1">{(analytics?.summary?.totalSent || 0).toLocaleString()}</p>
              </div>
              <div className="bg-black/20 border border-white/[0.06] rounded-xl p-5 font-sans">
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Active Devices</p>
                <p className="text-2xl font-black text-white mt-1">{activeDevicesCount.toLocaleString()}</p>
              </div>
              <div className="bg-black/20 border border-white/[0.06] rounded-xl p-5 font-sans">
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Delivery Health</p>
                <p className="text-2xl font-black text-green-400 mt-1">
                  {analytics?.summary?.totalSent 
                    ? (((analytics.summary.totalSent - analytics.summary.totalFailed) / analytics.summary.totalSent) * 100).toFixed(1) 
                    : "98.4"}% Healthy
                </p>
              </div>
              <div className="bg-black/20 border border-white/[0.06] rounded-xl p-5 font-sans">
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Failed Events</p>
                <p className="text-2xl font-black text-red-400 mt-1">{analytics?.summary?.totalFailed || 0}</p>
              </div>
            </div>

            {/* Recent Deliveries */}
            <div className="mt-8 bg-black/10 border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider text-neutral-400">Recent Deliveries</h3>
              <div className="divide-y divide-white/[0.04]">
                {getRecentDeliveries().map((d, index) => (
                  <div key={index} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="text-xs text-white font-semibold block">{d.title}</span>
                      <span className="text-[10px] text-neutral-400 font-medium">{d.channelLabel}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {d.timeLabel}
                    </span>
                  </div>
                ))}
                {getRecentDeliveries().length === 0 && (
                  <div className="text-xs text-neutral-500 italic py-3 text-center">No recent deliveries processed.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Broadcasts */}
        {!loading && activeTab === "broadcasts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white">Broadcast Manager</h2>
              <div className="flex gap-2">
                <button onClick={() => loadTabData("broadcasts")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                {true && !showCreateBroadcast && (
                  <button onClick={() => setShowCreateBroadcast(true)} className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 px-3 py-1.5 rounded text-xs font-bold transition">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Announcement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Redesigned 2-Column Create Announcement Layout */}
            {showCreateBroadcast && (
              <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
                
                {/* Left Column: Broadcast Form */}
                <div className="border border-white/[0.08] rounded-xl p-5 bg-white/[0.01] space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">New Announcement Campaign</h3>
                    <button onClick={() => { setShowCreateBroadcast(false); setPreviewing(false); }} className="text-neutral-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {!previewing ? (
                    <form onSubmit={(e) => { e.preventDefault(); handlePreviewBroadcast(); }} className="space-y-4 text-xs">
                      <label className="block">
                        <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Announcement Title</span>
                        <input type="text" required value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} className={adminInput} placeholder="Platform System Upgrade" />
                      </label>
                      <label className="block">
                        <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Message Body</span>
                        <textarea required value={broadcastForm.body} onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })} className="w-full h-24 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-white outline-none focus:border-green-500/35 transition resize-none placeholder:text-neutral-600" placeholder="Forex Auto Panel will undergo a scheduled maintenance on..." />
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="block">
                          <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Target Audience Cohort</span>
                          <select value={broadcastForm.audience} onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })} className={`${adminInput} bg-[#0c161d] font-semibold`}>
                            <option value="ALL_USERS">All Users</option>
                            <option value="ACTIVE_USERS">Active Users</option>
                            <option value="EXPIRED_USERS">Expired Users</option>
                            <option value="VIP_USERS">VIP Users</option>
                            <option value="CLUB_PLAN">Club Plan Users</option>
                            <option value="INDIVIDUAL_PLAN">Individual Plan Users</option>
                            <option value="ADMINS">Platform Admins</option>
                          </select>
                        </label>
                        <div className="block">
                          <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Dispatch Schedule</span>
                          <div className="flex gap-2 mb-2">
                            <button
                              type="button"
                              onClick={() => setScheduleMode("now")}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border ${
                                scheduleMode === "now" 
                                  ? "bg-white/10 border-white/20 text-white" 
                                  : "border-white/5 text-neutral-500 hover:text-white"
                              }`}
                            >
                              Send Now
                            </button>
                            <button
                              type="button"
                              onClick={() => setScheduleMode("later")}
                              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border ${
                                scheduleMode === "later" 
                                  ? "bg-white/10 border-white/20 text-white" 
                                  : "border-white/5 text-neutral-500 hover:text-white"
                              }`}
                            >
                              Schedule Later
                            </button>
                          </div>
                          {scheduleMode === "later" && (
                            <input type="datetime-local" required value={broadcastForm.scheduledAt} onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduledAt: e.target.value })} className={adminInput} />
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-semibold text-neutral-400">Target Output Channels</span>
                        <div className="flex flex-wrap gap-4">
                          {[
                            { key: "BELL", label: "🔔 Bell" },
                            { key: "PUSH", label: "📱 Push" },
                            { key: "SOCKET", label: "⚡ Socket" }
                          ].map(ch => {
                            const checked = broadcastForm.channels.includes(ch.key);
                            return (
                              <label key={ch.key} className="inline-flex items-center gap-1.5 cursor-pointer text-neutral-300 font-semibold select-none">
                                <input type="checkbox" checked={checked} onChange={() => handleToggleChannel(ch.key)} className="accent-green-500 rounded border-white/20" />
                                <span>{ch.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
                        <button type="button" onClick={() => setShowCreateBroadcast(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-[#00e676]/10 hover:bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/20 rounded-lg text-xs font-bold transition">Lookup & Preview</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3.5 flex items-start gap-3">
                        <Info className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-yellow-300">Campaign Pre-flight Verification</p>
                          <p className="text-[9px] text-neutral-400 mt-0.5 leading-relaxed">
                            Verify details before confirming. Broadcasts cannot be canceled once dispatched.
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-white/5 bg-black/20 border border-white/5 rounded-lg p-3 space-y-2">
                        <div className="pb-2 flex justify-between">
                          <span className="text-neutral-500">Title:</span>
                          <span className="font-semibold text-white">{broadcastForm.title}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-neutral-500">Message Content:</span>
                          <span className="text-neutral-300 text-right max-w-sm">{broadcastForm.body}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-neutral-500">Target Cohort:</span>
                          <span className="font-semibold text-[#00e676]">{broadcastForm.audience}</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-neutral-500">Resolved Recipients:</span>
                          <span className="font-bold text-white">{previewData?.resolvedAudience || 0} users</span>
                        </div>
                        <div className="py-2 flex justify-between">
                          <span className="text-neutral-500">Active Routing:</span>
                          <span className="font-mono text-cyan-300 font-bold">{broadcastForm.channels.join(", ")}</span>
                        </div>
                        {scheduleMode === "later" && broadcastForm.scheduledAt && (
                          <div className="pt-2 flex justify-between">
                            <span className="text-neutral-500">Scheduled Time:</span>
                            <span className="text-neutral-300 font-mono">{new Date(broadcastForm.scheduledAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between border-t border-white/[0.08] pt-4">
                        <button type="button" onClick={() => setPreviewing(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg font-bold text-neutral-400 hover:text-white transition">Back</button>
                        <button onClick={handleCreateBroadcast} className="px-5 py-2 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded-lg font-bold transition">Confirm & Save Draft</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Recipient Audience Preview */}
                <div className="border border-white/[0.08] rounded-xl p-5 bg-black/20 flex flex-col space-y-4 h-fit">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Recipient Preview</h3>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-[#00e676] bg-green-500/10 border border-green-500/20 shrink-0">
                      {getAudienceFriendlyName(broadcastForm.audience)} ({audiencePreviewData?.total || 0})
                    </span>
                  </div>

                  {audiencePreviewLoading ? (
                    <div className="flex items-center justify-center py-12 text-xs text-neutral-500 gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-green-400" />
                      <span>Resolving segment parameters...</span>
                    </div>
                  ) : (
                    <>
                      {/* Compute filtered users once for all children */}
                      {(() => {
                        const allUsers = audiencePreviewData?.users || [];
                        const filteredUsers = allUsers.filter(u => {
                          const matchesSearch = u.name.toLowerCase().includes(audienceSearch.toLowerCase()) ||
                                                u.email.toLowerCase().includes(audienceSearch.toLowerCase());
                          if (!matchesSearch) return false;
                          if (filterActiveOnly && !(u.status === "ACTIVE" || u.status === "VIP")) return false;
                          if (filterOnlineOnly && !u.isOnline) return false;
                          if (filterKycVerified && !u.isVerified) return false;
                          if (filterHasActiveInvestment && !u.hasActiveInvestment) return false;
                          return true;
                        });

                        const planCounts = {};
                        filteredUsers.forEach(u => {
                          const p = u.plan || "Other";
                          planCounts[p] = (planCounts[p] || 0) + 1;
                        });

                        const pageSize = 20;
                        const totalFiltered = filteredUsers.length;
                        const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
                        const paginatedUsers = filteredUsers.slice((audiencePage - 1) * pageSize, audiencePage * pageSize);

                        return (
                          <>
                            {/* Recipient summary green segment badge indicator */}
                            <div className="flex items-center justify-between p-3.5 rounded-lg bg-green-500/10 border border-green-500/20 text-[#00e676]">
                              <div>
                                <p className="text-xs font-bold text-white">Recipients</p>
                                <p className="text-[11px] text-neutral-400 font-semibold mt-0.5">{totalFiltered} Users Selected</p>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-green-500/20 text-[#00e676] border border-green-500/30">
                                {getAudienceFriendlyName(broadcastForm.audience)} Segment
                              </span>
                            </div>

                            {/* Audience Summary Card */}
                            <div className="border border-white/5 bg-white/[0.01] rounded-lg p-3">
                              <div className="text-xs font-bold text-white mb-1.5">{getAudienceFriendlyName(broadcastForm.audience)}</div>
                              <div className="h-[1px] bg-white/10 w-full mb-2" />
                              <div className="space-y-1 text-[11px] font-semibold text-neutral-400">
                                <div className="flex justify-between">
                                  <span>Total Users:</span>
                                  <span className="text-white font-bold">{audiencePreviewData?.total ?? 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Online:</span>
                                  <span className="text-green-400 font-bold">{audiencePreviewData?.online ?? 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Offline:</span>
                                  <span className="text-neutral-300 font-bold">
                                    {Math.max(0, (audiencePreviewData?.total ?? 0) - (audiencePreviewData?.online ?? 0))}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Audience Breakdown */}
                            <div className="border border-white/5 bg-white/[0.01] rounded-lg p-3">
                              <div className="text-xs font-bold text-white mb-1.5">Audience Breakdown</div>
                              <div className="h-[1px] bg-white/10 w-full mb-2" />
                              <div className="space-y-1.5 text-[11px] font-semibold text-neutral-400">
                                {Object.entries(planCounts).map(([planName, count]) => (
                                  <div key={planName} className="flex justify-between items-center">
                                    <span>{planName}</span>
                                    <span className="text-white font-bold">{count}</span>
                                  </div>
                                ))}
                                {Object.keys(planCounts).length === 0 && (
                                  <div className="text-neutral-500 italic text-center">No plan details found.</div>
                                )}
                              </div>
                            </div>

                            {/* Quick Statistics Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {/* Box 1: Total & Online */}
                              <div className="border border-white/5 bg-white/[0.01] rounded-lg p-3">
                                <div className="grid grid-cols-2 gap-2 text-center divide-x divide-white/5">
                                  <div>
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Total</span>
                                    <span className="text-base font-black text-white mt-1 block">{audiencePreviewData?.total ?? 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Online</span>
                                    <span className="text-base font-black text-green-400 mt-1 block">{audiencePreviewData?.online ?? 0}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Box 2: Active & Expired */}
                              <div className="border border-white/5 bg-white/[0.01] rounded-lg p-3">
                                <div className="grid grid-cols-2 gap-2 text-center divide-x divide-white/5">
                                  <div>
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Active</span>
                                    <span className="text-base font-black text-cyan-300 mt-1 block">{audiencePreviewData?.active ?? 0}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Expired</span>
                                    <span className="text-base font-black text-red-400 mt-1 block">{audiencePreviewData?.expired ?? 0}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Search recipient box */}
                            <div className="space-y-2.5">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search user..."
                                  value={audienceSearch}
                                  onChange={(e) => { setAudienceSearch(e.target.value); setAudiencePage(1); }}
                                  className="w-full h-8 bg-black/30 border border-white/[0.08] rounded-lg pl-8 pr-4 text-[10px] text-white placeholder:text-neutral-600 focus:border-green-500/25 outline-none transition"
                                />
                                <Search className="h-3 w-3 text-neutral-500 absolute left-2.5 top-2.5" />
                              </div>

                              {/* Recipient Filter Checkboxes */}
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-neutral-400 font-semibold select-none bg-black/10 p-2.5 border border-white/5 rounded-lg">
                                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                                  <input
                                    type="checkbox"
                                    checked={filterActiveOnly}
                                    onChange={(e) => { setFilterActiveOnly(e.target.checked); setAudiencePage(1); }}
                                    className="accent-green-500 rounded border-white/20"
                                  />
                                  <span>Active Only</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                                  <input
                                    type="checkbox"
                                    checked={filterOnlineOnly}
                                    onChange={(e) => { setFilterOnlineOnly(e.target.checked); setAudiencePage(1); }}
                                    className="accent-green-500 rounded border-white/20"
                                  />
                                  <span>Online Only</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                                  <input
                                    type="checkbox"
                                    checked={filterKycVerified}
                                    onChange={(e) => { setFilterKycVerified(e.target.checked); setAudiencePage(1); }}
                                    className="accent-green-500 rounded border-white/20"
                                  />
                                  <span>KYC Verified</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition">
                                  <input
                                    type="checkbox"
                                    checked={filterHasActiveInvestment}
                                    onChange={(e) => { setFilterHasActiveInvestment(e.target.checked); setAudiencePage(1); }}
                                    className="accent-green-500 rounded border-white/20"
                                  />
                                  <span>Has Active Investment</span>
                                </label>
                              </div>

                              {/* Active Filters Combinator Info & Reset button */}
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-neutral-400 font-semibold bg-black/10 border border-white/5 p-2 rounded-lg">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span>Matching:</span>
                                  <span className="text-white bg-white/5 px-1.5 py-0.5 rounded font-mono">Cohort</span>
                                  {filterActiveOnly && <><span className="text-neutral-600">AND</span><span className="text-[#00e676] bg-green-500/10 px-1.5 py-0.5 rounded">Active</span></>}
                                  {filterOnlineOnly && <><span className="text-neutral-600">AND</span><span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Online</span></>}
                                  {filterKycVerified && <><span className="text-neutral-600">AND</span><span className="text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded">Verified KYC</span></>}
                                  {filterHasActiveInvestment && <><span className="text-neutral-600">AND</span><span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">Active Investment</span></>}
                                  {audienceSearch && <><span className="text-neutral-600">AND</span><span className="text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">Search query</span></>}
                                </div>
                                {(filterActiveOnly || filterOnlineOnly || filterKycVerified || filterHasActiveInvestment || audienceSearch) && (
                                  <button
                                    onClick={() => {
                                      setAudienceSearch("");
                                      setFilterActiveOnly(false);
                                      setFilterOnlineOnly(false);
                                      setFilterKycVerified(false);
                                      setFilterHasActiveInvestment(false);
                                      setAudiencePage(1);
                                    }}
                                    className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded hover:scale-[0.98] transition select-none font-bold"
                                  >
                                    Reset Filters
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* User Preview List Table */}
                            <div className="overflow-x-auto rounded-lg border border-white/[0.06] text-[10px]">
                              <table className="w-full text-left">
                                <thead className="bg-white/[0.02] uppercase tracking-wide text-neutral-500 font-bold text-[8px] border-b border-white/5">
                                  <tr>
                                    <th className="px-2.5 py-1.5">User</th>
                                    <th className="px-2.5 py-1.5">Email</th>
                                    <th className="px-2.5 py-1.5">Plan</th>
                                    <th className="px-2.5 py-1.5">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-semibold">
                                  {paginatedUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/[0.01]">
                                      <td className="px-2.5 py-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${u.isOnline ? "bg-green-400 animate-pulse" : "bg-neutral-500"}`} />
                                          <span className="font-bold text-white truncate max-w-[80px]">{u.name}</span>
                                        </div>
                                      </td>
                                      <td className="px-2.5 py-1.5 text-neutral-400 font-mono">{u.email}</td>
                                      <td className="px-2.5 py-1.5 text-neutral-300 font-semibold">{u.plan}</td>
                                      <td className="px-2.5 py-1.5">
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-black uppercase ${
                                          u.status === "ACTIVE" || u.status === "VIP" 
                                            ? "bg-green-500/10 text-green-300" 
                                            : "bg-red-500/10 text-red-300"
                                        }`}>
                                          {u.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                  {paginatedUsers.length === 0 && (
                                    <tr>
                                      <td colSpan={4} className="px-2.5 py-6 text-center text-neutral-500">No segment users found.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center justify-between text-[9px] text-neutral-500 font-semibold border-t border-white/[0.06] pt-3">
                              <span>
                                Showing {paginatedUsers.length} of {totalFiltered} users
                              </span>
                              {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={audiencePage === 1}
                                    onClick={() => setAudiencePage(prev => Math.max(1, prev - 1))}
                                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Prev
                                  </button>
                                  <span className="font-mono text-white">{audiencePage} / {totalPages}</span>
                                  <button
                                    type="button"
                                    disabled={audiencePage === totalPages}
                                    onClick={() => setAudiencePage(prev => Math.min(totalPages, prev + 1))}
                                    className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    Next
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            )}

              {/* Simplified Broadcast Table History */}
              <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500 font-bold text-[10px]">
                  <tr>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Title</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Audience</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-center text-[10px] sm:text-xs font-semibold whitespace-nowrap">Sent</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Status</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-right text-[10px] sm:text-xs font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {broadcasts.map(b => (
                    <tr key={b.id} className="hover:bg-white/[0.01]">
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs sm:text-sm">
                        <p className="font-semibold text-white">{b.title}</p>
                        <p className="text-neutral-500 mt-0.5 line-clamp-1">{b.body}</p>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs sm:text-sm font-semibold text-[#00e676] whitespace-nowrap">{b.audience}</td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-center font-bold text-neutral-300 text-xs sm:text-sm whitespace-nowrap">
                        {b.execution ? `${b.execution.sentUsers}/${b.execution.targetUsers}` : (b.totalUsers || "-")}
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          b.status === "SENT" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                          b.status === "SENDING" ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20 animate-pulse" :
                          b.status === "DRAFT" ? "bg-neutral-500/10 text-neutral-300 border-neutral-500/20" :
                          "bg-red-500/10 text-red-300 border-red-500/20"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3.5 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex gap-1.5 justify-end">
                          {b.status === "DRAFT" && true && (
                            <button
                              onClick={() => handleBroadcastAction(b.id, "APPROVE")}
                              className="border border-green-500/20 bg-green-500/10 hover:bg-green-500/20 text-green-300 px-2 py-1 rounded font-bold transition text-[10px]"
                            >
                              Approve & Send
                            </button>
                          )}
                          {b.status === "DRAFT" && true && (
                            <button
                              onClick={() => handleBroadcastAction(b.id, "CANCEL")}
                              className="border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 px-2 py-1 rounded font-bold transition text-[10px]"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {broadcasts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-neutral-500">No broadcast announcements found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Notification Logs */}
        {!loading && activeTab === "logs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-base font-bold text-white">Delivery Logs</h2>
              <div className="flex gap-2">
                {true && (
                  <>
                    <button
                      onClick={handleRetryFailedDeliveries}
                      className="flex items-center gap-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 px-3 py-1.5 rounded text-xs font-bold transition"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Failed DLQ</span>
                    </button>
                    {selectedDeliveries.length > 0 && (
                      <button
                        onClick={handleRetrySelectedDeliveries}
                        className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 px-3 py-1.5 rounded text-xs font-bold transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Retry Selected ({selectedDeliveries.length})</span>
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={handleExportLogs}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-1.5 rounded text-xs font-bold transition"
                >
                  <span>Export Logs</span>
                </button>
                <button onClick={() => fetchDeliveries()} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center bg-black/10 p-4 border border-white/5 rounded-xl text-xs">
              <label className="block">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Status</span>
                <select value={logFilters.status} onChange={(e) => { setLogFilters({ ...logFilters, status: e.target.value }); }} className="h-9 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 w-full outline-none font-semibold cursor-pointer">
                  <option value="">All Statuses</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Channel</span>
                <select value={logFilters.channel} onChange={(e) => { setLogFilters({ ...logFilters, channel: e.target.value }); }} className="h-9 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 w-full outline-none font-semibold cursor-pointer">
                  <option value="">All Channels</option>
                  <option value="BELL">🔔 Bell</option>
                  <option value="PUSH">📱 Push</option>
                  <option value="SOCKET">⚡ Socket</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">Event</span>
                <input
                  type="text"
                  placeholder="e.g. Deposit"
                  value={logFilters.event}
                  onChange={(e) => setLogFilters({ ...logFilters, event: e.target.value })}
                  className="h-9 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-3 w-full outline-none focus:border-green-500/25"
                />
              </label>

              <label className="block">
                <span className="block text-[10px] text-neutral-500 font-bold uppercase mb-1">User</span>
                <input
                  type="text"
                  placeholder="User ID or Email"
                  value={logFilters.user}
                  onChange={(e) => setLogFilters({ ...logFilters, user: e.target.value })}
                  className="h-9 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-3 w-full outline-none focus:border-green-500/25"
                />
              </label>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500 font-bold text-[10px]">
                  <tr>
                    {true && <th className="px-3 py-2.5 sm:px-4 sm:py-3 w-8"></th>}
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Notification</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">User</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Channel</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Status</th>
                    <th className="px-3 py-2.5 sm:px-4 sm:py-3 text-[10px] sm:text-xs font-semibold whitespace-nowrap">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {getFilteredDeliveries().map(d => (
                    <tr key={d.id} className="hover:bg-white/[0.01] transition">
                      {true && (
                        <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedDeliveries.includes(d.id)}
                            onChange={() => {
                              setSelectedDeliveries(prev =>
                                prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]
                              );
                            }}
                            className="accent-green-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm">
                        <p className="font-bold text-white">{d.notification?.title}</p>
                        <p className="text-neutral-500 text-[11px] mt-0.5 line-clamp-1">{d.notification?.body}</p>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-neutral-400 font-mono text-[10px] whitespace-nowrap">
                        {d.notification?.userId || d.notification?.adminId || "Broadcast"}
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3 font-semibold text-xs sm:text-sm whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {getChannelIcon(d.channel)}
                          <span>{getChannelName(d.channel)}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          d.status === "DELIVERED" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                          d.status === "PENDING" ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 animate-pulse" :
                          d.status === "FAILED" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                          "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 sm:px-4 sm:py-3 text-neutral-500 font-mono text-[10px] whitespace-nowrap">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}`
                  {getFilteredDeliveries().length === 0 && (
                    <tr>
                      <td colSpan={true ? 6 : 5} className="px-4 py-8 text-center text-neutral-500">No matching logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {deliveryNextCursor && (
              <div className="flex justify-end pt-3">
                <button onClick={() => fetchDeliveries(deliveryNextCursor)} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-lg text-xs font-bold text-neutral-400 hover:text-white transition">
                  <span>Next Page</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Templates */}
        {!loading && activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h2 className="text-base font-bold text-white">Notification Templates</h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">Customize messaging templates and parameters for system dispatches.</p>
              </div>
              <button onClick={() => loadTabData("templates")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
              {/* Left Sidebar list */}
              <div className="border border-white/10 rounded-xl max-h-[460px] overflow-y-auto divide-y divide-white/5 bg-black/10">
                {TEMPLATE_EVENTS.map(t => (
                  <div
                    onClick={() => setSelectedTemplateEvent(t.event)}
                    key={t.event}
                    className={`p-3.5 text-xs cursor-pointer transition flex items-center justify-between ${
                      selectedTemplateEvent === t.event 
                        ? "bg-white/[0.06] text-white font-bold" 
                        : "text-neutral-400 hover:bg-white/[0.02]"
                    }`}
                  >
                    <span>{t.label}</span>
                  </div>
                ))}
              </div>

              {/* Right Panel Editor */}
              <div className="md:col-span-3 border border-white/10 rounded-xl p-5 bg-black/5 space-y-4">
                {editedTemplate ? (
                  <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                    {/* Header event title */}
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        {TEMPLATE_EVENTS.find(e => e.event === selectedTemplateEvent)?.label}
                      </h3>
                      
                      {/* Channel tab switcher */}
                      <div className="flex gap-1.5 border border-white/10 rounded-lg p-0.5 bg-black/20">
                        {["BELL", "PUSH", "SOCKET"].map(ch => (
                          <button
                            key={ch}
                            type="button"
                            onClick={() => setTemplateChannel(ch)}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${
                              templateChannel === ch 
                                ? "bg-white/10 text-white" 
                                : "text-neutral-500 hover:text-neutral-300"
                            }`}
                          >
                            {getChannelName(ch)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Notification Title</span>
                      <input
                        type="text"
                        required
                        disabled={!true}
                        value={editedTemplate.title || ""}
                        onChange={(e) => setEditedTemplate({ ...editedTemplate, title: e.target.value })}
                        className={adminInput}
                        placeholder="e.g. Deposit Approved"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Body Markup Syntax (Handlebars supported)</span>
                      <textarea
                        required
                        disabled={!true}
                        value={editedTemplate.body || ""}
                        onChange={(e) => setEditedTemplate({ ...editedTemplate, body: e.target.value })}
                        className="w-full h-32 font-mono rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-white outline-none focus:border-green-500/35 transition resize-none"
                        placeholder="e.g. Your withdrawal of ${{amount}} has been approved."
                      />
                    </label>

                    {/* Template Variable Helper */}
                    <div className="border border-white/5 bg-white/[0.01] rounded-lg p-3">
                      <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Available Variables (Click to append)</span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                        {[
                          { key: "{{name}}", desc: "User Name" },
                          { key: "{{amount}}", desc: "Transaction Amount" },
                          { key: "{{email}}", desc: "User Email" },
                          { key: "{{planName}}", desc: "Sub Plan Tier Name" },
                          { key: "{{pair}}", desc: "Asset Pair" },
                          { key: "{{entryPrice}}", desc: "Trade Entry Value" },
                          { key: "{{pnl}}", desc: "Trade Profit/Loss" },
                          { key: "{{days}}", desc: "Expiry Remaining Days" },
                          { key: "{{ticketId}}", desc: "Ticket ID Ref" },
                          { key: "{{message}}", desc: "Audit alert message" }
                        ].map(v => (
                          <span
                            key={v.key}
                            title={v.desc}
                            className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-300 font-semibold cursor-pointer hover:bg-white/15 hover:text-white transition"
                            onClick={() => {
                              if (true) {
                                setEditedTemplate({ ...editedTemplate, body: (editedTemplate.body || "") + " " + v.key });
                              }
                            }}
                          >
                            {v.key}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Live Preview Display Card */}
                    <div className="border border-white/10 rounded-lg p-4 bg-black/35 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1.5 text-[8px] font-bold bg-white/5 border-l border-b border-white/10 rounded-bl text-neutral-500 tracking-wider">
                        LIVE PREVIEW
                      </div>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        {getChannelIcon(templateChannel)}
                        <span>{getChannelName(templateChannel)} Message</span>
                      </p>
                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-xs space-y-1.5 max-w-md">
                        <p className="font-bold text-white">{renderTemplatePreview(editedTemplate.title)}</p>
                        <p className="text-neutral-300 leading-relaxed text-[11px]">{renderTemplatePreview(editedTemplate.body)}</p>
                      </div>
                    </div>

                    {true && (
                      <div className="flex justify-end pt-2">
                        <button type="submit" className="px-5 py-2.5 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded-lg text-xs font-bold transition">
                          Save Template Updates
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-neutral-500 text-xs">
                    <Code className="h-8 w-8 mb-2" />
                    <p>Select a template to view or customize.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
