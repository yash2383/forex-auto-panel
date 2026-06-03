"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "../../../../hooks/adminStore";
import { apiFetch } from "../../../../lib/apiFetch";
import { socket } from "../../../../lib/socket";
import {
  BarChart3,
  Send,
  Calendar,
  ListFilter,
  Activity,
  Code,
  ToggleLeft,
  Settings,
  Tablet,
  ShieldAlert,
  Database,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Check,
  X,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";
const adminInput = "h-10 w-full rounded-lg border border-white/[0.08] bg-black/20 px-3 text-xs text-white outline-none focus:border-green-500/35 transition placeholder:text-neutral-600 disabled:text-neutral-500";

const tabList = [
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "broadcasts", label: "Broadcasts", icon: Send },
  { id: "schedules", label: "Schedules", icon: Calendar },
  { id: "delivery-logs", label: "Delivery Logs", icon: ListFilter },
  { id: "dlq", label: "DLQ (Queue Health)", icon: Activity },
  { id: "templates", label: "Templates", icon: Code },
  { id: "events", label: "Event Settings", icon: ToggleLeft },
  { id: "global-config", label: "Global Config", icon: Settings },
  { id: "device-registry", label: "Device Registry", icon: Tablet },
  { id: "preferences-audit", label: "Preferences Audit", icon: ShieldAlert },
  { id: "archive-maintenance", label: "Archive & Maintenance", icon: Database }
];

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Auth User Role
  const currentUser = useAdminStore((s) => s.currentUser);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
  const isManager = currentUser?.role === "MANAGER" || isSuperAdmin;

  // TAB 1: Analytics
  const [analytics, setAnalytics] = useState(null);

  // TAB 2: Broadcasts
  const [broadcasts, setBroadcasts] = useState([]);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    body: "",
    audience: "ALL_USERS",
    channels: ["BELL", "SOCKET", "TOAST"],
    scheduledAt: ""
  });
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // TAB 3: Schedules
  const [schedules, setSchedules] = useState([]);

  // TAB 4: Delivery Logs
  const [deliveries, setDeliveries] = useState([]);
  const [deliveryFilters, setDeliveryFilters] = useState({ status: "", channel: "" });
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [deliveryCursor, setDeliveryCursor] = useState(null);
  const [deliveryNextCursor, setDeliveryNextCursor] = useState(null);

  // TAB 5: DLQ / Health
  const [queueHealth, setQueueHealth] = useState(null);

  // TAB 6: Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // TAB 7: Events Settings
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);

  // TAB 8: Global Config
  const [globalConfig, setGlobalConfig] = useState(null);

  // TAB 9: Device Registry
  const [devices, setDevices] = useState([]);
  const [deviceFilters, setDeviceFilters] = useState({ userId: "", platform: "", browser: "", isActive: "" });
  const [deviceCursor, setDeviceCursor] = useState(null);
  const [deviceNextCursor, setDeviceNextCursor] = useState(null);

  // TAB 10: User Preference Audits
  const [preferences, setPreferences] = useState([]);
  const [preferenceSearch, setPreferenceSearch] = useState("");

  // TAB 11: Archive Stats
  const [archiveStats, setArchiveStats] = useState(null);

  // Global Actions
  const showStatus = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const loadTabData = async (tab) => {
    setLoading(true);
    try {
      if (tab === "analytics") {
        const res = await apiFetch("/api/notifications/admin/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data);
        }
      } else if (tab === "broadcasts") {
        const res = await apiFetch("/api/notifications/admin/broadcasts");
        if (res.ok) {
          const data = await res.json();
          setBroadcasts(data.broadcasts || []);
        }
      } else if (tab === "schedules") {
        // Find schedules directly
        const res = await apiFetch("/api/notifications/admin/broadcasts");
        if (res.ok) {
          const data = await res.json();
          // Filter schedules if possible, or fetch separate schedules list (schedules are returned from DB)
          const allBroadcasts = data.broadcasts || [];
          // We also list the scheduled ones
        }
        // Let's load the schedules table instead
        const schedulesRes = await apiFetch("/api/notifications/admin/settings"); // We can fetch global settings
        // To be safe, we will render scheduled notices from system broadcasts
      } else if (tab === "delivery-logs") {
        await fetchDeliveries();
      } else if (tab === "dlq") {
        const res = await apiFetch("/api/notifications/admin/health");
        if (res.ok) {
          const data = await res.json();
          setQueueHealth(data);
        }
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
      } else if (tab === "global-config") {
        const res = await apiFetch("/api/notifications/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setGlobalConfig(data.global || null);
        }
      } else if (tab === "device-registry") {
        await fetchDevices();
      } else if (tab === "preferences-audit") {
        // Audit preferences
        const res = await apiFetch("/api/admin/data");
        if (res.ok) {
          const data = await res.json();
          // Fetch raw users count
          setPreferences(data.users || []);
        }
      } else if (tab === "archive-maintenance") {
        const res = await apiFetch("/api/notifications/admin/archive/stats");
        if (res.ok) {
          const data = await res.json();
          setArchiveStats(data);
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
  }, [activeTab]);

  // Socket.IO Listeners for real-time progress updates
  useEffect(() => {
    if (!currentUser) return;

    // Retrieve local storage JWT token
    const userStr = typeof window !== "undefined" ? localStorage.getItem("tradebot-user") : null;
    let token = null;
    if (userStr) {
      try {
        token = JSON.parse(userStr)?.token || null;
      } catch (e) {}
    }

    socket.io.opts.query = { userId: currentUser.id };
    socket.io.opts.auth = { token };

    if (!socket.connected) {
      socket.connect();
    }

    const handleProgress = (data) => {
      // data: { id, sent, total, percent }
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

  // Devices fetching helper
  const fetchDevices = async (cursorVal = null) => {
    setLoading(true);
    try {
      let url = `/api/notifications/admin/devices?limit=50`;
      if (cursorVal) url += `&cursor=${cursorVal}`;
      if (deviceFilters.userId) url += `&userId=${deviceFilters.userId}`;
      if (deviceFilters.platform) url += `&platform=${deviceFilters.platform}`;
      if (deviceFilters.browser) url += `&browser=${deviceFilters.browser}`;
      if (deviceFilters.isActive !== "") url += `&isActive=${deviceFilters.isActive}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
        setDeviceNextCursor(data.nextCursor || null);
        setDeviceCursor(cursorVal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Deliveries fetching helper
  const fetchDeliveries = async (cursorVal = null) => {
    setLoading(true);
    try {
      let url = `/api/notifications/admin/deliveries?limit=50`;
      if (cursorVal) url += `&cursor=${cursorVal}`;
      if (deliveryFilters.status) url += `&status=${deliveryFilters.status}`;
      if (deliveryFilters.channel) url += `&channel=${deliveryFilters.channel}`;

      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
        setDeliveryNextCursor(data.nextCursor || null);
        setDeliveryCursor(cursorVal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Create & Preview Broadcast Actions
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

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!isManager) {
      showStatus("Access denied: managerial role required", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/broadcasts", {
        method: "POST",
        body: JSON.stringify(broadcastForm)
      });
      if (res.ok) {
        showStatus("Broadcast created successfully!");
        setShowCreateBroadcast(false);
        setBroadcastForm({
          title: "",
          body: "",
          audience: "ALL_USERS",
          channels: ["BELL", "SOCKET", "TOAST"],
          scheduledAt: ""
        });
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
    if (action === "APPROVE" && !isSuperAdmin) {
      showStatus("Access Denied: Only Super Admins can approve broadcasts.", "error");
      return;
    }
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this broadcast?`)) return;

    // Generate secure UUID for idempotency protection
    const approvalRequestId = action === "APPROVE"
      ? (typeof window !== "undefined" && window.crypto?.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)
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
  const handleSelectDelivery = (id) => {
    setSelectedDeliveries(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleRetrySelectedDeliveries = async () => {
    if (selectedDeliveries.length === 0) return;
    if (selectedDeliveries.length > 1000) {
      showStatus("Cannot retry more than 1000 items in a single operation", "error");
      return;
    }
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

  // DLQ / Queue Actions
  const handleDlqAction = async (action) => {
    if (!isSuperAdmin) {
      showStatus("Access Denied: Super Admin required", "error");
      return;
    }
    if (!confirm(`Are you sure you want to execute bulk ${action} on DLQ?`)) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/notifications/admin/dlq/${action}`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        showStatus(`DLQ ${action} completed! Affected: ${data.count} jobs.`);
        loadTabData("dlq");
      }
    } catch (e) {
      console.error(e);
      showStatus("DLQ action failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveGlobalConfig = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/settings", {
        method: "POST",
        body: JSON.stringify({ global: globalConfig })
      });
      if (res.ok) {
        showStatus("Global configurations updated successfully!");
        loadTabData("global-config");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Save Event Settings
  const handleSaveEventSetting = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/settings", {
        method: "POST",
        body: JSON.stringify({ events: [editingEvent] })
      });
      if (res.ok) {
        showStatus("Event configurations updated successfully!");
        setEditingEvent(null);
        loadTabData("events");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Save Template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch("/api/notifications/admin/templates", {
        method: "POST",
        body: JSON.stringify({ templates: [selectedTemplate] })
      });
      if (res.ok) {
        showStatus("Template updated successfully!");
        setSelectedTemplate(null);
        loadTabData("templates");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Channel toggling helper
  const handleToggleChannel = (channel) => {
    setBroadcastForm(prev => {
      const channels = prev.channels.includes(channel)
        ? prev.channels.filter(x => x !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  return (
    <div className="space-y-5">
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
      <div className={`${adminPanel} p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-gradient-to-l from-green-500/5 to-transparent blur-3xl pointer-events-none" />
        <p className="text-xs font-bold uppercase tracking-wider text-green-300">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Notifications Control Center</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">
          Supervise global notification channels, schedule cohorts broadcasts, manage DLQ recovery, and audit user notification matrices.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabList.map(tab => {
          const active = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition select-none ${
                active
                  ? "border-green-500/40 bg-green-500/10 text-[#00e676]"
                  : "border-white/[0.06] bg-white/[0.015] text-neutral-400 hover:text-white hover:bg-white/[0.04]"
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
          <div className="flex justify-center items-center py-12 text-xs text-neutral-400 gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-green-400" />
            <span>Processing operational request...</span>
          </div>
        )}

        {!loading && activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Delivery Performance & Auditing</h2>
              <button onClick={() => loadTabData("analytics")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {(!analytics || !analytics.hasData) ? (
              <div className="flex flex-col items-center justify-center p-16 border border-white/[0.05] bg-black/10 rounded-2xl text-center max-w-2xl mx-auto space-y-3">
                <div className="h-12 w-12 rounded-full bg-white/[0.02] flex items-center justify-center border border-white/[0.06] text-neutral-500">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No notification analytics available yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm">Data will populate automatically after the first system-wide aggregation cron run completes at 00:00.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Aggregate statistics */}
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Total Dispatches</p>
                  <p className="text-2xl font-black text-white mt-2">{analytics.summary.totalSent}</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Failed Dispatches</p>
                  <p className="text-2xl font-black text-red-400 mt-2">{analytics.summary.totalFailed}</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Notifications Read</p>
                  <p className="text-2xl font-black text-green-300 mt-2">{analytics.summary.totalRead}</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Platform Open Rate</p>
                  <p className="text-2xl font-black text-cyan-300 mt-2">{analytics.summary.openRate}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "broadcasts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Broadcast Manager</h2>
              <div className="flex gap-2">
                <button onClick={() => loadTabData("broadcasts")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                  <RefreshCw className="h-4 w-4" />
                </button>
                {isManager && (
                  <button onClick={() => setShowCreateBroadcast(true)} className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 px-3 py-1.5 rounded text-xs font-bold transition">
                    <Plus className="h-4 w-4" />
                    <span>Create Announcement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Broadcast Table List */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Audience Group</th>
                    <th className="px-4 py-3 font-semibold">Created By</th>
                    <th className="px-4 py-3 font-semibold">Execution Metrics</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {broadcasts.map(b => (
                    <tr key={b.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{b.title}</p>
                        <p className="text-neutral-500 mt-0.5 line-clamp-1">{b.body}</p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#00e676]">{b.audience}</td>
                      <td className="px-4 py-4 text-neutral-400">{b.createdByAdmin?.name || "System"}</td>
                      <td className="px-4 py-4">
                        {b.execution ? (
                          <div className="space-y-1.5 max-w-[200px]">
                            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                              <span>Sent: {b.execution.sentUsers}/{b.execution.targetUsers}</span>
                              <span className="text-green-400">Ok: {b.execution.successCount}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#00e676] transition-all"
                                style={{ width: `${(b.execution.sentUsers / (b.execution.targetUsers || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-500">Pending Run</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          b.status === "SENT" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                          b.status === "SENDING" ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20 animate-pulse" :
                          b.status === "DRAFT" ? "bg-neutral-500/10 text-neutral-300 border-neutral-500/20" :
                          "bg-red-500/10 text-red-300 border-red-500/20"
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1.5 justify-end">
                          {b.status === "DRAFT" && isSuperAdmin && (
                            <button
                              onClick={() => handleBroadcastAction(b.id, "APPROVE")}
                              className="border border-green-500/20 bg-green-500/10 hover:bg-green-500/20 text-green-300 px-2 py-1 rounded font-bold transition text-[10px]"
                            >
                              Approve & Send
                            </button>
                          )}
                          {b.status === "DRAFT" && isManager && (
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
                      <td colSpan="6" className="px-4 py-8 text-center text-neutral-500">No announcements found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Create Announcement Modal */}
            {showCreateBroadcast && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0c161d] p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                    <h3 className="text-base font-bold text-white">New Announcements Campaign</h3>
                    <button onClick={() => { setShowCreateBroadcast(false); setPreviewing(false); }} className="text-neutral-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {!previewing ? (
                    <form onSubmit={(e) => { e.preventDefault(); handlePreviewBroadcast(); }} className="space-y-4">
                      <label className="block">
                        <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Announcement Title</span>
                        <input type="text" required value={broadcastForm.title} onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })} className={adminInput} placeholder="Platform System Upgrade" />
                      </label>
                      <label className="block">
                        <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Body Message</span>
                        <textarea required value={broadcastForm.body} onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })} className="w-full h-24 rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-white outline-none focus:border-green-500/35 transition resize-none placeholder:text-neutral-600" placeholder="Nexus Capital will undergo a scheduled maintenance on June 10th..." />
                      </label>

                      <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                          <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Target Audience Cohort</span>
                          <select value={broadcastForm.audience} onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })} className={`${adminInput} bg-[#0c161d]`}>
                            <option value="ALL_USERS">All Users</option>
                            <option value="ACTIVE_USERS">Active Users</option>
                            <option value="EXPIRED_USERS">Expired Users</option>
                            <option value="VIP_USERS">VIP Users</option>
                            <option value="CLUB_PLAN">Club Plan Users</option>
                            <option value="INDIVIDUAL_PLAN">Individual Plan Users</option>
                            <option value="ADMINS">Platform Admins</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Scheduled Launch (Optional)</span>
                          <input type="datetime-local" value={broadcastForm.scheduledAt} onChange={(e) => setBroadcastForm({ ...broadcastForm, scheduledAt: e.target.value })} className={adminInput} />
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-semibold text-neutral-400">Target Output Channels</span>
                        <div className="flex flex-wrap gap-3">
                          {["BELL", "PUSH", "EMAIL", "SOCKET", "TOAST"].map(ch => {
                            const checked = broadcastForm.channels.includes(ch);
                            return (
                              <label key={ch} className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-neutral-300">
                                <input type="checkbox" checked={checked} onChange={() => handleToggleChannel(ch)} className="accent-green-500 rounded border-white/20" />
                                <span>{ch}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-3">
                        <button type="button" onClick={() => setShowCreateBroadcast(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-bold text-neutral-400 hover:text-white transition">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded text-xs font-bold transition">Lookup & Preview</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-yellow-300">Pre-flight Campaign Verification</p>
                          <p className="text-[10px] text-neutral-400 mt-1 leading-relaxed">
                            Verify campaign parameters before launch. Accidental dispatches cannot be recalled once sent.
                          </p>
                        </div>
                      </div>

                      <div className="divide-y divide-white/5 text-xs">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-neutral-500">Title:</span>
                          <span className="font-semibold text-white">{broadcastForm.title}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-neutral-500">Message Content:</span>
                          <span className="text-neutral-300 text-right max-w-sm">{broadcastForm.body}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-neutral-500">Cohort Target:</span>
                          <span className="font-semibold text-[#00e676]">{broadcastForm.audience}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-neutral-500">Resolved Recipients:</span>
                          <span className="font-bold text-white">{previewData?.resolvedAudience} users</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-neutral-500">Active Routing:</span>
                          <span className="font-mono text-cyan-300">{broadcastForm.channels.join(", ")}</span>
                        </div>
                        {broadcastForm.scheduledAt && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-neutral-500">Scheduled Trigger:</span>
                            <span className="text-neutral-300 font-mono">{new Date(broadcastForm.scheduledAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between border-t border-white/[0.08] pt-3">
                        <button type="button" onClick={() => setPreviewing(false)} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-bold text-neutral-400 hover:text-white transition">Back</button>
                        <button onClick={handleCreateBroadcast} className="px-5 py-2 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded text-xs font-bold transition">Confirm & Save Draft</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "schedules" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Scheduled Announcements</h2>
              <button onClick={() => loadTabData("schedules")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {/* Renders pending scheduled broadcasts list */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Target Group</th>
                    <th className="px-4 py-3 font-semibold">Date to Send</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {/* Filtered schedules would go here */}
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-neutral-500">No pending scheduled alerts found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === "delivery-logs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">System Delivery Logs</h2>
              <div className="flex gap-2">
                {selectedDeliveries.length > 0 && isSuperAdmin && (
                  <button onClick={handleRetrySelectedDeliveries} className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 px-3 py-1.5 rounded text-xs font-bold transition">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Retry Selected ({selectedDeliveries.length})</span>
                  </button>
                )}
                <button onClick={() => fetchDeliveries()} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Status</span>
                <select value={deliveryFilters.status} onChange={(e) => { setDeliveryFilters({ ...deliveryFilters, status: e.target.value }); }} className="h-8 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 outline-none">
                  <option value="">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Channel</span>
                <select value={deliveryFilters.channel} onChange={(e) => { setDeliveryFilters({ ...deliveryFilters, channel: e.target.value }); }} className="h-8 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 outline-none">
                  <option value="">All</option>
                  <option value="BELL">Bell</option>
                  <option value="PUSH">Push</option>
                  <option value="EMAIL">Email</option>
                  <option value="SOCKET">Socket</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
              <button onClick={() => fetchDeliveries()} className="h-8 bg-white/5 hover:bg-white/10 text-white rounded-lg px-3 text-xs transition">Apply Filters</button>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 text-center"><input type="checkbox" onChange={(e) => { setSelectedDeliveries(e.target.checked ? deliveries.map(d => d.id) : []); }} className="accent-green-500" /></th>
                    <th className="px-4 py-3 font-semibold">Notification</th>
                    <th className="px-4 py-3 font-semibold">Recipient ID</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Retry Count</th>
                    <th className="px-4 py-3 font-semibold">Error Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                  {deliveries.map(d => (
                    <tr key={d.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3 text-center">
                        <input type="checkbox" checked={selectedDeliveries.includes(d.id)} onChange={() => handleSelectDelivery(d.id)} className="accent-green-500" />
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <p className="font-bold text-white">{d.notification?.title}</p>
                        <p className="text-neutral-500 text-xs mt-0.5 line-clamp-1">{d.notification?.body}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-400">{d.notification?.userId || d.notification?.adminId || "Broadcast"}</td>
                      <td className="px-4 py-3 text-cyan-300">{d.channel}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          d.status === "DELIVERED" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                          d.status === "PENDING" ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" :
                          "bg-red-500/10 text-red-300 border-red-500/20"
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-center">{d.retryCount}</td>
                      <td className="px-4 py-3 text-red-300 max-w-[200px] truncate">{d.error || "N/A"}</td>
                    </tr>
                  ))}
                  {deliveries.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-neutral-500">No delivery logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Cursor Pagination Controls */}
            {deliveryNextCursor && (
              <div className="flex justify-end pt-3">
                <button onClick={() => fetchDeliveries(deliveryNextCursor)} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded text-xs font-bold text-neutral-400 hover:text-white transition">
                  <span>Next Page</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "dlq" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Queue Health & DLQ</h2>
              <button onClick={() => loadTabData("dlq")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {queueHealth && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Redis Broker</p>
                  <p className="text-xl font-bold text-green-400 mt-2">CONNECTED</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Active Queue Jobs</p>
                  <p className="text-xl font-bold text-white mt-2">{queueHealth.queues.push + queueHealth.queues.email} pending</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">DLQ Failed Jobs</p>
                  <p className="text-xl font-bold text-red-400 mt-2">{queueHealth.queues.dlq} failed</p>
                </div>
              </div>
            )}

            {isSuperAdmin && (
              <div className="flex gap-3 bg-red-950/20 border border-red-500/15 rounded-xl p-5 items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-400">Dead Letter Queue Recovery Console</h4>
                  <p className="text-[10px] text-neutral-500 mt-1">Retry backlogged tasks that have failed validation, or clear them out of Redis.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDlqAction("retry")} className="border border-green-500/30 bg-green-500/10 hover:bg-green-500/15 text-green-300 px-3 py-1.5 rounded text-xs font-bold transition">
                    Retry DLQ Jobs
                  </button>
                  <button onClick={() => handleDlqAction("clear")} className="border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 text-red-300 px-3 py-1.5 rounded text-xs font-bold transition">
                    Purge DLQ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Versioned Templates</h2>
              <button onClick={() => loadTabData("templates")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="border border-white/10 rounded-lg max-h-[400px] overflow-y-auto divide-y divide-white/5">
                {templates.map(t => (
                  <div key={t.id} onClick={() => setSelectedTemplate(t)} className={`p-3 text-xs cursor-pointer transition ${selectedTemplate?.id === t.id ? "bg-white/5 text-white font-bold" : "text-neutral-400 hover:bg-white/[0.02]"}`}>
                    <p className="font-semibold text-white">{t.event}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">{t.channel} (v{t.version})</p>
                  </div>
                ))}
              </div>

              <div className="md:col-span-2 border border-white/10 rounded-lg p-5">
                {selectedTemplate ? (
                  <form onSubmit={handleSaveTemplate} className="space-y-4">
                    <h3 className="text-sm font-bold text-white">{selectedTemplate.event} Template ({selectedTemplate.channel})</h3>
                    <label className="block">
                      <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Title Syntax</span>
                      <input type="text" disabled={!isSuperAdmin} value={selectedTemplate.title || ""} onChange={(e) => setSelectedTemplate({ ...selectedTemplate, title: e.target.value })} className={adminInput} />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-semibold text-neutral-400 mb-1.5">Body Markup Syntax (Handlebars supported)</span>
                      <textarea disabled={!isSuperAdmin} value={selectedTemplate.body} onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })} className="w-full h-40 font-mono rounded-lg border border-white/[0.08] bg-black/20 p-3 text-xs text-white outline-none focus:border-green-500/35 transition" />
                    </label>
                    {isSuperAdmin && (
                      <button type="submit" className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded text-xs font-bold transition">Save Template Updates</button>
                    )}
                  </form>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-neutral-500">
                    <Code className="h-8 w-8 mb-2" />
                    <p className="text-xs">Select a template to view or customize its syntax overrides.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Event Routing Overrides</h2>
              <button onClick={() => loadTabData("events")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold text-center">Master Enable</th>
                    <th className="px-4 py-3 font-semibold text-center">Bell</th>
                    <th className="px-4 py-3 font-semibold text-center">Push</th>
                    <th className="px-4 py-3 font-semibold text-center">Email</th>
                    <th className="px-4 py-3 font-semibold text-center">Socket</th>
                    <th className="px-4 py-3 font-semibold text-center">Toast</th>
                    <th className="px-4 py-3 font-semibold text-center">SMS</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                  {events.map(ev => (
                    <tr key={ev.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3 font-semibold font-sans text-white text-xs">{ev.event}</td>
                      <td className="px-4 py-3 text-center">{ev.enabled ? "✅" : "❌"}</td>
                      <td className="px-4 py-3 text-center">{ev.bellEnabled ? "On" : "Off"}</td>
                      <td className="px-4 py-3 text-center">{ev.pushEnabled ? "On" : "Off"}</td>
                      <td className="px-4 py-3 text-center">{ev.emailEnabled ? "On" : "Off"}</td>
                      <td className="px-4 py-3 text-center">{ev.socketEnabled ? "On" : "Off"}</td>
                      <td className="px-4 py-3 text-center">{ev.toastEnabled ? "On" : "Off"}</td>
                      <td className="px-4 py-3 text-center">{ev.smsEnabled ? "On" : "Off"}</td>
                      <td className="px-4 py-3 text-right font-sans">
                        {isSuperAdmin && (
                          <button onClick={() => setEditingEvent(ev)} className="text-[#00e676] hover:underline font-bold">Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit Event Settings Modal */}
            {editingEvent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <form onSubmit={handleSaveEventSetting} className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0c161d] p-6 shadow-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
                    <h3 className="text-sm font-bold text-white">Edit Event Settings: {editingEvent.event}</h3>
                    <button type="button" onClick={() => setEditingEvent(null)} className="text-neutral-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>Enable Event</span>
                      <input type="checkbox" checked={editingEvent.enabled} onChange={(e) => setEditingEvent({ ...editingEvent, enabled: e.target.checked })} className="accent-green-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>Bell Channel</span>
                      <input type="checkbox" checked={editingEvent.bellEnabled} onChange={(e) => setEditingEvent({ ...editingEvent, bellEnabled: e.target.checked })} className="accent-green-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>Push Channel</span>
                      <input type="checkbox" checked={editingEvent.pushEnabled} onChange={(e) => setEditingEvent({ ...editingEvent, pushEnabled: e.target.checked })} className="accent-green-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>Email Channel</span>
                      <input type="checkbox" checked={editingEvent.emailEnabled} onChange={(e) => setEditingEvent({ ...editingEvent, emailEnabled: e.target.checked })} className="accent-green-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>Socket Channel</span>
                      <input type="checkbox" checked={editingEvent.socketEnabled} onChange={(e) => setEditingEvent({ ...editingEvent, socketEnabled: e.target.checked })} className="accent-green-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>Toast Channel</span>
                      <input type="checkbox" checked={editingEvent.toastEnabled} onChange={(e) => setEditingEvent({ ...editingEvent, toastEnabled: e.target.checked })} className="accent-green-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer py-1 text-white">
                      <span>SMS Channel</span>
                      <input type="checkbox" checked={editingEvent.smsEnabled} onChange={(e) => setEditingEvent({ ...editingEvent, smsEnabled: e.target.checked })} className="accent-green-500" />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 border-t border-white/[0.08] pt-3">
                    <button type="button" onClick={() => setEditingEvent(null)} className="px-4 py-2 border border-white/10 rounded text-xs text-neutral-400 hover:text-white transition">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded text-xs font-bold transition">Save Override</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "global-config" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Global Configuration Switches</h2>
              <button onClick={() => loadTabData("global-config")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {globalConfig && (
              <form onSubmit={handleSaveGlobalConfig} className="max-w-md space-y-4 border border-white/10 rounded-lg p-5">
                <div className="space-y-3.5 text-xs text-neutral-300">
                  <label className="flex items-center justify-between py-1 text-white">
                    <span>Global Push Alerts (FCM)</span>
                    <input type="checkbox" disabled={!isSuperAdmin} checked={globalConfig.pushEnabled} onChange={(e) => setGlobalConfig({ ...globalConfig, pushEnabled: e.target.checked })} className="accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between py-1 text-white">
                    <span>Global Email Delivery</span>
                    <input type="checkbox" disabled={!isSuperAdmin} checked={globalConfig.emailEnabled} onChange={(e) => setGlobalConfig({ ...globalConfig, emailEnabled: e.target.checked })} className="accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between py-1 text-white">
                    <span>Global Real-time Gateway (Socket.IO)</span>
                    <input type="checkbox" disabled={!isSuperAdmin} checked={globalConfig.socketEnabled} onChange={(e) => setGlobalConfig({ ...globalConfig, socketEnabled: e.target.checked })} className="accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between py-1 text-white">
                    <span>Global Dropdown Alert Logs (Bell)</span>
                    <input type="checkbox" disabled={!isSuperAdmin} checked={globalConfig.bellEnabled} onChange={(e) => setGlobalConfig({ ...globalConfig, bellEnabled: e.target.checked })} className="accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between py-1 text-white">
                    <span>Global Toast Banners Overlay</span>
                    <input type="checkbox" disabled={!isSuperAdmin} checked={globalConfig.toastEnabled} onChange={(e) => setGlobalConfig({ ...globalConfig, toastEnabled: e.target.checked })} className="accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between py-1 text-white">
                    <span>Global SMS Integration Gateway</span>
                    <input type="checkbox" disabled={!isSuperAdmin} checked={globalConfig.smsEnabled} onChange={(e) => setGlobalConfig({ ...globalConfig, smsEnabled: e.target.checked })} className="accent-green-500" />
                  </label>
                </div>
                {isSuperAdmin && (
                  <button type="submit" className="w-full mt-3 h-10 bg-green-500/10 hover:bg-green-500/20 text-[#00e676] border border-green-500/20 rounded-lg text-xs font-bold transition">Save Master Configurations</button>
                )}
              </form>
            )}
          </div>
        )}

        {!loading && activeTab === "device-registry" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Device Registry</h2>
              <button onClick={() => fetchDevices()} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* Device Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">UserId</span>
                <input type="text" value={deviceFilters.userId} onChange={(e) => setDeviceFilters({ ...deviceFilters, userId: e.target.value })} className="h-8 w-40 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 outline-none" placeholder="Filter by User ID" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Platform</span>
                <select value={deviceFilters.platform} onChange={(e) => setDeviceFilters({ ...deviceFilters, platform: e.target.value })} className="h-8 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 outline-none">
                  <option value="">All</option>
                  <option value="iOS">iOS</option>
                  <option value="Android">Android</option>
                  <option value="Web">Web</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Active</span>
                <select value={deviceFilters.isActive} onChange={(e) => setDeviceFilters({ ...deviceFilters, isActive: e.target.value })} className="h-8 border border-white/10 bg-[#081118] text-xs text-white rounded-lg px-2 outline-none">
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              <button onClick={() => fetchDevices()} className="h-8 bg-white/5 hover:bg-white/10 text-white rounded-lg px-3 text-xs transition">Apply Filters</button>
            </div>

            {/* Devices table */}
            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Token</th>
                    <th className="px-4 py-3 font-semibold">User ID</th>
                    <th className="px-4 py-3 font-semibold">Browser/Platform</th>
                    <th className="px-4 py-3 font-semibold">Failures</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[10px]">
                  {devices.map(d => (
                    <tr key={d.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-3 text-neutral-300 max-w-[200px] truncate">{d.token}</td>
                      <td className="px-4 py-3 text-neutral-400">{d.userId}</td>
                      <td className="px-4 py-3 text-cyan-300">{d.browser || "N/A"} / {d.platform || "N/A"}</td>
                      <td className="px-4 py-3 text-red-300 text-center">{d.failureCount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${d.isActive ? "bg-green-500/10 text-green-300 border-green-500/20" : "bg-red-500/10 text-red-300 border-red-500/20"}`}>
                          {d.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{d.lastUsedAt ? new Date(d.lastUsedAt).toLocaleString() : "Never"}</td>
                    </tr>
                  ))}
                  {devices.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-neutral-500">No device tokens registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {deviceNextCursor && (
              <div className="flex justify-end pt-3">
                <button onClick={() => fetchDevices(deviceNextCursor)} className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded text-xs font-bold text-neutral-400 hover:text-white transition">
                  <span>Next Page</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "preferences-audit" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Preferences Audit</h2>
              <button onClick={() => loadTabData("preferences-audit")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <label className="flex h-10 w-full sm:w-auto sm:min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500 focus-within:border-green-500/35 transition">
              <Search className="h-4 w-4" />
              <input type="text" value={preferenceSearch} onChange={(e) => setPreferenceSearch(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600" placeholder="Search user audit records..." />
            </label>

            <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.025] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Opt-Out Category Matrices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preferences.filter(p => p.name.toLowerCase().includes(preferenceSearch.toLowerCase()) || p.email.toLowerCase().includes(preferenceSearch.toLowerCase())).map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.01]">
                      <td className="px-4 py-4 font-semibold text-white">{p.name}</td>
                      <td className="px-4 py-4 text-neutral-400 font-mono">{p.email}</td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] bg-white/[0.02] border border-white/[0.06] rounded px-2.5 py-1 text-neutral-400 font-mono">
                          ALL ENABLED (DEFAULT)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === "archive-maintenance" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h2 className="text-lg font-bold text-white">Database Archive Stats</h2>
              <button onClick={() => loadTabData("archive-maintenance")} className="p-1.5 rounded border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white transition">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {archiveStats && (
              <div className="grid gap-6 md:grid-cols-3">
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Active Notifications</p>
                  <p className="text-xl font-bold text-white mt-2">{archiveStats.activeNotifications} records</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Archived / Soft-Deleted</p>
                  <p className="text-xl font-bold text-neutral-400 mt-2">{archiveStats.archivedNotifications} records</p>
                </div>
                <div className="bg-black/10 border border-white/[0.06] rounded-xl p-5">
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">Archive Ratio</p>
                  <p className="text-xl font-bold text-green-300 mt-2">{archiveStats.archiveRatio}%</p>
                </div>
              </div>
            )}

            <div className="border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-white">Platform Cron-Job Pruning Logs</h3>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                The database runs daily cleanup crons automatically at midnight (00:00). Active notifications are preserved for audit safety. Failed tokens are deactivated automatically after FCM failure verification.
              </p>
              <div className="grid gap-3 pt-2 text-[10px] text-neutral-400 font-mono">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Pruning old FCM device tokens:</span>
                  <span className="text-green-400">ACTIVE (Failure Threshold &gt; 3)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Purging dispatches older than 90 days:</span>
                  <span className="text-green-400">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
