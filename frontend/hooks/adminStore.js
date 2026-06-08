import { apiFetch } from "../lib/apiFetch";
import { create } from "zustand";

export const rolePermissions = {
  SUPER_ADMIN: {
    users: ["view", "create", "edit", "delete"],
    payments: ["view", "edit"],
    trades: ["view", "create", "edit", "delete"],
    partners: ["view", "create", "edit", "delete"],
    admins: ["view", "create", "edit", "delete"],
    reports: ["view"],
    settings: ["view", "edit"],
    "activity-logs": ["view"],
    "profit-distribution": ["view", "edit"],
    "pnl-reports": ["view"],
    notifications: ["view", "create", "edit", "delete"],
    campaigns: ["view", "create", "edit", "delete"],
    referrals: ["view", "create", "edit", "delete"],
    otp: ["view", "generate", "approve"],
    plans: ["view", "create", "edit", "delete"],
    inquiries: ["view", "edit"]
  },
  MANAGER: {
    users: ["view", "create", "edit"],
    payments: ["view", "edit"],
    trades: ["view", "create", "edit"],
    partners: ["view", "create"],
    admins: ["view", "edit"],
    reports: ["view"],
    settings: ["view"],
    "activity-logs": ["view"],
    "profit-distribution": ["view"],
    "pnl-reports": ["view"],
    notifications: ["view", "create", "edit"],
    campaigns: ["view", "create", "edit"],
    referrals: ["view", "create", "edit"],
    otp: ["view"],
    plans: ["view", "edit"],
    inquiries: ["view", "edit"]
  },
  VIEWER: {
    users: ["view"],
    payments: ["view"],
    trades: ["view"],
    partners: ["view"],
    admins: ["view"],
    reports: ["view"],
    settings: ["view"],
    "activity-logs": ["view"],
    "profit-distribution": ["view"],
    "pnl-reports": ["view"],
    notifications: ["view"],
    campaigns: ["view"],
    referrals: ["view"],
    otp: ["view"],
    plans: ["view"],
    inquiries: ["view"]
  }
};

export const useAdminStore = create((set, get) => ({
  // INITIAL STATE
  users: [],
  generatedReports: [],
  payments: [],
  withdrawals: [],
  trades: [],
  profitDistributions: [],
  profitSummary: { totalProfit: 0, pendingProfit: 0, monthlyProfit: 0, lastDistribution: null },
  partners: [],
  campaigns: [],
  referrals: [],
  admins: [],
  logs: [],
  transactions: [],
  adjustments: [
    { id: "adj-1", partnerId: "alpha-traders", partnerName: "AlphaTrade", type: "Bonus", amount: 1500, remark: "Performance milestone bonus", date: "May 25, 2026" },
    { id: "adj-2", partnerId: "beta-markets", partnerName: "BetaMarkets", type: "Correction", amount: -250, remark: "Deduction for duplicate txn logging", date: "May 24, 2026" }
  ],
  notifications: [
    { id: "notif-1", audience: "No Deposit Users", message: "Complete your first deposit", channel: "In-app", status: "Draft" },
    { id: "notif-2", audience: "Expired Users", message: "Renew your plan today", channel: "Email", status: "Sent" },
    { id: "notif-3", audience: "Active Users", message: "New trading update added", channel: "In-app", status: "Queued" }
  ],
  plans: [
    { id: "1", name: "Club Plan", subtitle: "Micro Capital", capitalLabel: "$10 - $100", desc: "Ideal plan for new traders starting out with small test capital.", features: ["5% fee on profits", "Beginner-friendly setup", "24/7 automated execution", "Access to core automation"], btnText: "Get Started", status: "Active", isPopular: false },
    { id: "2", name: "Individual Plan", subtitle: "Advanced / Full Access", capitalLabel: "$1000+", desc: "For advanced traders who require priority execution and higher capital limits.", features: ["Reduced profit fee (5% to 4%)", "Advanced trading access", "Priority low-latency execution API", "Enhanced performance tracking"], btnText: "Start Trading", status: "Active", isPopular: true },
    { id: "3", name: "Custom Plan", subtitle: "Flexible / Tailored", capitalLabel: "Custom Pricing", desc: "Need a personalized setup? Get a custom trading plan based on your capital, execution preference, and performance goals.", features: ["Customized profit fee structure", "Dedicated execution optimization", "Priority execution & support", "Scalable capital management"], btnText: "Contact Us", status: "Active", isPopular: false }
  ],
  settings: {
    upiId: "",
    upiName: "",
    upiQrCode: "",
    usdt: { network: "TRC20", walletAddress: "", usdtQrCode: "" },
    financials: { platformFee: 30, referralFee: 10 },
    system: { maintenanceMode: false },
    paymentModes: { upi: false, bank: false, usdt: true }
  },
  wallet: null,
  stats: {
    totalProfit: 0,
    realizedPnL: 0,
    unrealizedPnL: 0,
    winRate: 72.91,
    activeTradesCount: 0
  },
  pnlReports: null,
  currentUser: null,
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  dateRange: { start: null, end: null },
  setDateRange: (range) => set({ dateRange: range }),

  referralStats: null,
  loadingReferrals: false,
  loadingCampaigns: false,
  loadingReferralStats: false,
  campaignDetails: null,
  campaignUsers: [],
  loadingCampaignUsers: false,

  referralSettings: null,
  initiatedPayments: [],
  initiatedPaymentMetrics: null,
  dashboardStats: null,
  loadingDashboardStats: false,

  // INIT
  isInitialized: false,
  fetchData: async () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('tradebot-user') : null;
      if (!userStr) {
        set({ currentUser: null });
        return;
      }

      const meRes = await apiFetch("/api/auth/me");
      if (!meRes.ok) {
        if (meRes.status === 401) {
          localStorage.removeItem("tradebot-user");
          localStorage.removeItem("tradebot-authenticated");
          document.cookie = 'tradebot-token=; path=/; max-age=0; SameSite=Lax';
        }
        set({ currentUser: null });
        return;
      }
      const { user } = await meRes.json();
      set({ currentUser: user });

      if (user.role === "USER") {
        const dashRes = await apiFetch("/api/dashboard/data");
        if (dashRes.ok) {
          const data = await dashRes.json();
          set({
            stats: data.stats,
            wallet: data.wallet,
            trades: data.trades,
            payments: data.payments,
            withdrawals: data.withdrawals,
            profitDistributions: data.profitDistributions || [],
            profitSummary: data.profitSummary || { totalProfit: 0, pendingProfit: 0, monthlyProfit: 0, lastDistribution: null },
          });
        }
      } else {
        const adminRes = await apiFetch("/api/admin/data");
        if (adminRes.ok) {
          const data = await adminRes.json();
          set({
            stats: data.stats,
            users: data.users,
            payments: data.payments,
            withdrawals: data.withdrawals || [],
            trades: data.trades,
            logs: data.logs,
            partners: data.partners,
            campaigns: data.campaigns,
            referrals: data.referrals,
            admins: data.admins,
            transactions: data.transactions,
            settings: data.settings,
            plans: data.plans,
            profitDistributions: data.profitDistributions || [],
            referralSettings: data.referralSettings || null,
            generatedReports: data.generatedReports || [],
          });
        }
        await Promise.all([
          get().fetchReferrals(),
          get().fetchReferralStats(),
          get().fetchCampaigns(),
        ]);
      }
    } catch (e) {
      console.error("fetchData error:", e);
    } finally {
      set({ isLoading: false, isInitialized: true });
    }
  },

  fetchInitiatedPayments: async () => {
    try {
      const res = await apiFetch("/api/admin/initiated-payments");
      if (res.ok) {
        const data = await res.json();
        set({
          initiatedPayments: data.initiatedPayments || [],
          initiatedPaymentMetrics: data.metrics || null
        });
      }
    } catch (e) {
      console.error("fetchInitiatedPayments API error:", e);
    }
  },

  fetchDashboardStats: async () => {
    try {
      set({ loadingDashboardStats: true });
      const res = await apiFetch("/api/admin/dashboard/stats");
      if (res.ok) {
        const stats = await res.json();
        set({ dashboardStats: stats });
      }
    } catch (err) {
      console.error("fetchDashboardStats error:", err);
    } finally {
      set({ loadingDashboardStats: false });
    }
  },

  updateInitiatedPayment: async (id, payload) => {
    try {
      const res = await apiFetch(`/api/admin/initiated-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await get().fetchInitiatedPayments();
      }
    } catch (e) {
      console.error("updateInitiatedPayment API error:", e);
    }
  },

  fetchPnlReports: async () => {
    try {
      const res = await apiFetch("/api/admin/pnl-reports");
      if (res.ok) {
        const data = await res.json();
        set({ pnlReports: data });
      }
    } catch (e) {
      console.error("fetchPnlReports error:", e);
    }
  },

  fetchReferrals: async () => {
    set({ loadingReferrals: true });
    try {
      const res = await apiFetch("/api/admin/referrals");
      if (res.ok) {
        const data = await res.json();
        set({ referrals: data.referrals || data });
      }
    } catch (e) {
      console.error("fetchReferrals error:", e);
    } finally {
      set({ loadingReferrals: false });
    }
  },

  fetchReferralStats: async () => {
    set({ loadingReferralStats: true });
    try {
      const res = await apiFetch("/api/admin/referrals/stats");
      if (res.ok) {
        const data = await res.json();
        set({ referralStats: data.stats || data });
      }
    } catch (e) {
      console.error("fetchReferralStats error:", e);
    } finally {
      set({ loadingReferralStats: false });
    }
  },

  fetchCampaigns: async () => {
    set({ loadingCampaigns: true });
    try {
      const res = await apiFetch("/api/admin/campaigns");
      if (res.ok) {
        const data = await res.json();
        set({ campaigns: data.campaigns || data });
      }
    } catch (e) {
      console.error("fetchCampaigns error:", e);
    } finally {
      set({ loadingCampaigns: false });
    }
  },

  fetchCampaignUsers: async (idOrSlug) => {
    set({ loadingCampaignUsers: true, campaignDetails: null, campaignUsers: [] });
    try {
      const res = await apiFetch(`/api/admin/campaigns/${idOrSlug}/users`);
      if (res.ok) {
        const data = await res.json();
        set({
          campaignDetails: data.campaign,
          campaignUsers: data.users || [],
        });
      }
    } catch (e) {
      console.error("fetchCampaignUsers error:", e);
    } finally {
      set({ loadingCampaignUsers: false });
    }
  },

  refreshSection: async () => {
    await Promise.all([
      get().fetchReferrals(),
      get().fetchReferralStats(),
      get().fetchCampaigns(),
    ]);
  },

  fetchPlans: async () => {
    try {
      const res = await apiFetch("/api/plans");
      if (res.ok) {
        const { plans } = await res.json();
        set({ plans });
      }
    } catch (e) {
      console.error("fetchPlans error:", e);
    }
  },

  fetchAllPlans: async () => {
    try {
      const res = await apiFetch("/api/plans/all");
      if (res.ok) {
        const { plans } = await res.json();
        set({ plans });
      }
    } catch (e) {
      console.error("fetchAllPlans error:", e);
    }
  },



  setCurrentUserRole: (role) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, role } : null
    })),

  hasPermission: (module, action) => {
    const user = get().currentUser;
    if (!user) return false;
    // All admin roles have full permissions — no role-based restrictions.
    const adminRoles = ['SUPER_ADMIN', 'MANAGER', 'VIEWER'];
    if (adminRoles.includes(user.role)) return true;
    return rolePermissions[user.role]?.[module]?.includes(action) || false;
  },

  // USERS CRUD VIA API
  addUser: async (user) => {
    try {
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password: "password123", // default password
          partnerId: user.partnerId || null,
          plan: user.plan,
          deposit: user.deposit,
        }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("addUser API error:", e);
    }
  },

  editUser: async (id, updatedFields) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("editUser API error:", e);
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("deleteUser API error:", e);
    }
  },

  blockUser: async (id) => {
    try {
      const targetUser = get().users.find((u) => u.id === id);
      if (!targetUser) return;
      const nextStatus = targetUser.status === "Blocked" ? "Active" : "Blocked";
      await get().editUser(id, { status: nextStatus });
    } catch (e) {
      console.error("blockUser error:", e);
    }
  },




  // PAYMENTS ACTIONS VIA API
  verifyPayment: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/payments/${id}/verify`, { method: "POST" });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to verify payment" };
    } catch (e) {
      console.error("verifyPayment API error:", e);
      return { success: false, error: e.message };
    }
  },

  approvePayment: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/payments/${id}/approve`, { method: "POST" });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to approve payment" };
    } catch (e) {
      console.error("approvePayment API error:", e);
      return { success: false, error: e.message };
    }
  },

  rejectPayment: async (id, remark) => {
    try {
      const res = await apiFetch(`/api/admin/payments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to reject payment" };
    } catch (e) {
      console.error("rejectPayment API error:", e);
      return { success: false, error: e.message };
    }
  },

  addPayment: async (payment) => {
    try {
      const cleanAmount = Number(String(payment.amount).replace(/[^\d.-]/g, ""));
      // Generate a stable idempotency key for this payment attempt.
      // Passed by caller if already set (e.g. from PI flow); otherwise generate a fresh UUID.
      const idempotencyKey =
        payment.idempotencyKey ||
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `ik-${Date.now()}-${Math.random().toString(36).slice(2)}`);

      const res = await apiFetch("/api/dashboard/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: payment.plan,
          amount: cleanAmount,
          depositAmount: payment.depositAmount ? Number(payment.depositAmount) : undefined,
          txnHash: payment.txnHash,
          utr: payment.utr,
          paymentType: payment.paymentType || "USDT",
          network: payment.network || "TRC20",
          initiationId: payment.initiationId || null,
          idempotencyKey,
          email: payment.email || null,
          screenshot: payment.screenshot || null,
          remark: payment.remark || null,
        }),
      });
      if (res.ok) {
        get().fetchData().catch((e) => {
          console.error("post-payment refresh error:", e);
        });
        return { success: true };
      }
      const errorBody = await res.json().catch(() => null);
      if (res.status === 409 && errorBody?.message?.includes("already been completed")) {
        console.warn("addPayment: Payment initiation already completed.");
        return { success: true, alreadyCompleted: true };
      }
      console.error("addPayment API failed:", errorBody?.message || res.statusText);
      return { success: false, error: errorBody?.message || res.statusText };
    } catch (e) {
      console.error("addPayment API error:", e);
      return { success: false, error: e.message };
    }
  },

  // SETTINGS VIA API
  updateSettings: async (data) => {
    try {
      // Format to settings payload shape
      const payload = {
        upiId: data.upiId,
        usdtAddress: data.usdt?.walletAddress,
        usdtNetwork: data.usdt?.network,
        usdtQrCode: data.usdt?.usdtQrCode,
        platformFee: data.financials?.platformFee,
        referralFee: data.financials?.referralFee,
        maintenance: data.system?.maintenanceMode,
        individualProfitPct: data.profitDist?.individualProfitPct,
        clubProfitPct: data.profitDist?.clubProfitPct,
        enableBulkDist: data.profitDist?.enableBulkDist,
        allowDuplicateDist: data.profitDist?.allowDuplicateDist,
        upiEnabled: data.paymentModes?.upi,
        usdtEnabled: data.paymentModes?.usdt,
        upiName: data.upiName,
        upiQrCode: data.upiQrCode,
      };
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("updateSettings API error:", e);
    }
  },

  updateUserSettings: async (settings) => {
    try {
      const res = await apiFetch("/api/dashboard/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("updateUserSettings API error:", e);
    }
  },

  createManualTrade: async (pair, type) => {
    try {
      const res = await apiFetch("/api/trade/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pair, type }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("createManualTrade API error:", e);
    }
  },

  closeManualTrade: async (tradeId) => {
    try {
      const res = await apiFetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("closeManualTrade API error:", e);
    }
  },

  // TRADES VIA API
  addTrade: async (trade) => {
    try {
      const res = await apiFetch("/api/admin/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: trade.pair,
          side: trade.side,
          entryPrice: Number(trade.entryPrice),
          exitPrice: Number(trade.exitPrice),
          tradeDate: trade.tradeDate,
          profitLoss: Number(trade.profitLoss),
          result: trade.result,
          notes: trade.notes,
          status: trade.status || "published",
        }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("addTrade API error:", e);
    }
  },

  editTrade: async (id, fields) => {
    try {
      const res = await apiFetch(`/api/admin/trades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: fields.pair,
          side: fields.side,
          entryPrice: fields.entryPrice !== undefined ? Number(fields.entryPrice) : undefined,
          exitPrice: fields.exitPrice !== undefined ? Number(fields.exitPrice) : undefined,
          tradeDate: fields.tradeDate,
          profitLoss: fields.profitLoss !== undefined ? Number(fields.profitLoss) : undefined,
          result: fields.result,
          notes: fields.notes,
          status: fields.status,
        }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("editTrade API error:", e);
    }
  },

  closeTrade: async (id, exitPrice) => {
    try {
      const res = await apiFetch(`/api/admin/trades/${id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exitPrice: Number(exitPrice) }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("closeTrade API error:", e);
    }
  },

  deleteTrade: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/trades/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("deleteTrade API error:", e);
    }
  },

  publishTrade: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/trades/${id}/publish`, {
        method: "PATCH",
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("publishTrade API error:", e);
    }
  },

  unpublishTrade: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/trades/${id}/unpublish`, {
        method: "PATCH",
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("unpublishTrade API error:", e);
    }
  },

  // PARTNERS CRUD VIA API
  addPartner: async (partner) => {
    try {
      const res = await apiFetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: partner.name,
          companyName: partner.companyName,
          email: partner.email,
          password: "password123", // default password
          profitShare: Number(partner.profitShare),
          maxAllowedShare: Number(partner.maxAllowedShare),
          domain: partner.domain,
          logo: partner.logo,
        }),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("addPartner API error:", e);
    }
  },

  editPartner: (id, updated) => {
    set((state) => ({
      partners: state.partners.map((p) => (p.id === id ? { ...p, ...updated } : p))
    }));
  },

  deletePartner: (id) => {
    set((state) => ({
      partners: state.partners.map((p) => (p.id === id ? { ...p, status: "Suspended" } : p))
    }));
  },

  // WITHDRAWALS ACTIONS VIA API
  approveWithdrawal: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: "POST" });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to approve withdrawal" };
    } catch (e) {
      console.error("approveWithdrawal API error:", e);
      return { success: false, error: e.message };
    }
  },

  rejectWithdrawal: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/withdrawals/${id}/reject`, { method: "POST" });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.message || "Failed to reject withdrawal" };
    } catch (e) {
      console.error("rejectWithdrawal API error:", e);
      return { success: false, error: e.message };
    }
  },

  reverseTransaction: async (id, reason) => {
    try {
      const res = await apiFetch(`/api/admin/transactions/${id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.message };
      }
    } catch (e) {
      console.error("reverseTransaction API error:", e);
      return { success: false, error: "Network error occurred" };
    }
  },

  // CLIENT SIDE MOCK CRUD FOR MINOR ITEMS
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { id: `notif-${Date.now()}`, status: "Draft", ...notification },
        ...state.notifications
      ]
    })),

  editNotification: (id, updated) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, ...updated } : n))
    })),

  deleteNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id)
    })),

  addCampaign: async (campaign) => {
    try {
      const res = await apiFetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      if (res.ok) {
        await get().refreshSection();
      }
    } catch (e) {
      console.error("addCampaign error:", e);
    }
  },

  editCampaign: async (id, updated) => {
    try {
      const res = await apiFetch(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        await get().refreshSection();
      }
    } catch (e) {
      console.error("editCampaign error:", e);
    }
  },

  deleteCampaign: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/campaigns/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await get().refreshSection();
      }
    } catch (e) {
      console.error("deleteCampaign error:", e);
    }
  },

  addReferral: async (referral) => {
    set((state) => ({
      referrals: [
        { id: `ref-${Date.now()}`, status: "Pending", ...referral },
        ...state.referrals
      ]
    }));
  },

  editReferral: async (id, updated) => {
    try {
      const res = await apiFetch(`/api/admin/referrals/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: updated.status }),
      });
      if (res.ok) {
        await get().refreshSection();
      }
    } catch (e) {
      console.error("editReferral error:", e);
    }
  },

  deleteReferral: async (id) => {
    set((state) => ({
      referrals: state.referrals.filter((r) => r.id !== id)
    }));
  },

  addAdjustment: (adj) =>
    set((state) => ({
      adjustments: [
        { id: `adj-${Date.now()}`, date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }), ...adj },
        ...state.adjustments
      ]
    })),

  deleteAdjustment: (id) =>
    set((state) => ({
      adjustments: state.adjustments.filter((a) => a.id !== id)
    })),

  addAdmin: (admin) =>
    set((state) => ({
      admins: [
        { id: `admin-${Date.now()}`, status: "Active", permissions: { partners: ["view"], admins: [], reports: ["view"] }, ...admin },
        ...state.admins
      ]
    })),

  editAdmin: (id, updated) =>
    set((state) => ({
      admins: state.admins.map((a) => (a.id === id ? { ...a, ...updated } : a))
    })),

  deleteAdmin: (id) =>
    set((state) => ({
      admins: state.admins.map((a) => (a.id === id ? { ...a, status: "Inactive" } : a))
    })),

  addPlan: async (plan) => {
    try {
      const res = await apiFetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan),
      });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || "Failed to create plan" };
    } catch (e) {
      console.error("addPlan API error:", e);
      return { success: false, error: e.message || "Network error" };
    }
  },

  editPlan: async (id, updated) => {
    try {
      const res = await apiFetch(`/api/admin/plans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || "Failed to update plan" };
    } catch (e) {
      console.error("editPlan API error:", e);
      return { success: false, error: e.message || "Network error" };
    }
  },

  deletePlan: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/plans/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await get().fetchData();
        return { success: true };
      }
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.message || "Failed to delete plan" };
    } catch (e) {
      console.error("deletePlan API error:", e);
      return { success: false, error: e.message || "Network error" };
    }
  },

  distributeProfit: () => { },

  saveSettings: async (settings) => {
    try {
      const res = await apiFetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await get().fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  saveReferralSettings: async (settings) => {
    try {
      const res = await apiFetch("/api/admin/referral-settings", {
        method: "POST",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await get().fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  getOtpSettings: async () => {
    try {
      const res = await apiFetch("/api/auth/otp-settings");
      if (res.ok) {
        const data = await res.json();
        return data.settings;
      }
      return null;
    } catch (e) {
      console.error("getOtpSettings error:", e);
      return null;
    }
  },

  saveOtpSettings: async (settings) => {
    try {
      const res = await apiFetch("/api/auth/otp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        await get().fetchData();
        return true;
      }
      return false;
    } catch (e) {
      console.error("saveOtpSettings error:", e);
      return false;
    }
  },


  addProfitDistribution: async (body) => {
    try {
      const res = await apiFetch("/api/admin/profit-distributions", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("addProfitDistribution API error:", e);
    }
  },

  editProfitDistribution: async (id, body) => {
    try {
      const res = await apiFetch(`/api/admin/profit-distributions/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("editProfitDistribution API error:", e);
    }
  },

  deleteProfitDistribution: async (id) => {
    try {
      const res = await apiFetch(`/api/admin/profit-distributions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await get().fetchData();
      }
    } catch (e) {
      console.error("deleteProfitDistribution API error:", e);
    }
  },

  bulkDistributeProfit: async (payload) => {
    try {
      const res = await apiFetch("/api/admin/profit-distributions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (!payload.dryRun) {
          await get().fetchData();
        }
        return { success: true, summary: data.summary, skipped: data.skipped };
      } else {
        return { success: false, error: data.message || data.error || "Failed to execute bulk profit distribution" };
      }
    } catch (e) {
      console.error("bulkDistributeProfit error:", e);
      return { success: false, error: "Network error occurred. Please try again." };
    }
  },

  previewProfitDistribution: async (payload) => {
    try {
      const res = await apiFetch("/api/admin/profit-distributions/bulk/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      } else {
        return { success: false, error: data.message || data.error || "Failed to preview distribution" };
      }
    } catch (e) {
      console.error("preview error:", e);
      return { success: false, error: "Network error occurred. Please try again." };
    }
  },
}));
