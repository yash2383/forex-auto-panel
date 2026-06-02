"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ArrowRight, Ban, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, FileDown, 
  MessageSquare, MoreVertical, Pencil, Plus, Search, Send, SlidersHorizontal, Trash2, X, AlertTriangle, User, Users,
  DollarSign, Wallet, TrendingUp, UserCheck
} from "lucide-react";
import Link from "next/link";
import { useAdminStore } from "../../../../hooks/adminStore";
import { adminNavGroups, adminPermissionMatrix, quickActions } from "../_components/adminData";

const toneMap = {
  green: "border-green-500/25 bg-green-500/10 text-green-300",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  blue: "border-blue-500/25 bg-blue-500/10 text-blue-300",
  amber: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  purple: "border-purple-500/25 bg-purple-500/10 text-purple-300",
  red: "border-red-500/25 bg-red-500/10 text-red-300",
  pink: "border-pink-500/25 bg-pink-500/10 text-pink-300",
  cyan: "border-cyan-500/25 bg-cyan-500/10 text-cyan-300",
};

const quickBorder = {
  green: "border-green-500/45 hover:border-green-400",
  violet: "border-violet-500/45 hover:border-violet-400",
  amber: "border-yellow-500/45 hover:border-yellow-400",
  blue: "border-blue-500/45 hover:border-blue-400",
  pink: "border-pink-500/45 hover:border-pink-400",
  cyan: "border-cyan-500/45 hover:border-cyan-400",
};

const adminPanel = "rounded-xl border border-white/[0.08] bg-[#081118]/95 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)]";
const adminControl = "rounded-lg border border-white/[0.08] bg-white/[0.025]";

const createLabels = {
  users: "Add User",
  trades: "Add Trade",
  notifications: "Send Notification",
  campaigns: "Create Campaign",
  admins: "Add Admin",
  plans: "Add Plan",
};

const exportOnlySections = new Set(["pnl-reports", "reports", "activity-logs"]);

const actionStyles = {
  view: "border-white/[0.08] bg-white/[0.025] text-white hover:bg-white/[0.08]",
  create: "border-green-500/30 bg-green-500 text-black hover:bg-green-400",
  edit: "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/15",
  approve: "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/15",
  reject: "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
  delete: "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15",
  warn: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/15",
  disabled: "cursor-not-allowed border-white/[0.08] bg-white/[0.02] text-neutral-600",
};

const sparklinePoints = {
  green: "M0 34 L12 29 L24 31 L36 23 L48 25 L60 19 L72 21 L84 16 L96 18 L108 12 L120 15 L132 8 L144 10 L156 2",
  violet: "M0 35 L12 31 L24 29 L36 33 L48 24 L60 26 L72 20 L84 18 L96 22 L108 15 L120 17 L132 10 L144 12 L156 6",
  blue: "M0 33 L12 28 L24 30 L36 22 L48 24 L60 20 L72 25 L84 18 L96 21 L108 15 L120 17 L132 13 L144 9 L156 3",
  amber: "M0 34 L12 31 L24 32 L36 25 L48 27 L60 22 L72 23 L84 19 L96 21 L108 15 L120 18 L132 13 L144 11 L156 4",
  purple: "M0 35 L12 30 L24 32 L36 25 L48 27 L60 21 L72 23 L84 17 L96 20 L108 14 L120 17 L132 12 L144 9 L156 3",
};

const sparklineStroke = {
  green: "rgb(34 197 94)",
  violet: "rgb(139 92 246)",
  blue: "rgb(14 165 233)",
  amber: "rgb(245 158 11)",
  purple: "rgb(168 85 247)",
};

const sparklineFill = {
  green: "rgba(34,197,94,0.13)",
  violet: "rgba(139,92,246,0.13)",
  blue: "rgba(14,165,233,0.13)",
  amber: "rgba(245,158,11,0.13)",
  purple: "rgba(168,85,247,0.13)",
};

const sectionContent = {
  users: {
    permissionKey: "users",
    title: "User Management",
    description: "Manage all registered users, track activity, and control access.",
    metrics: [["Total Users", "12,648"], ["No Deposit Users", "2,184"], ["Active Users", "5,892"], ["VIP Users", "316"]],
    filters: ["No Deposit", "New", "Active", "VIP", "Expired"],
    headers: ["Name", "Email", "Deposit", "Plan", "Status"],
  },
  payments: {
    permissionKey: "payments",
    title: "Payment Management",
    description: "Review and manage USDT payments submitted with transaction IDs.",
    metrics: [["Pending", "32"], ["Approved", "1,284"], ["Rejected", "19"], ["Revenue", "$248,250"]],
    headers: ["ID", "User", "Plan", "Amount", "Method", "Transaction ID", "Status"],
  },
  trades: {
    permissionKey: "trades",
    title: "Master Trade Database",
    description: "Manage historical trade records. Draft items are only visible to admins; published records populate the public homepage and user past trades archives.",
    metrics: [["Total Records", "0"], ["Published", "0"], ["Drafts", "0"], ["Win Rate", "0.0%"]],
    filters: ["Wins", "Losses", "Published", "Draft"],
    headers: ["Pair", "Side", "Entry", "Exit", "Date", "Result", "P/L", "Status"],
  },
  "pnl-reports": {
    permissionKey: "pnl-reports",
    title: "Profit & Loss Reports",
    description: "Analyze platform-wide trading performance and profitability.",
    metrics: [["Total PnL", "$356,780"], ["User-wise Avg", "$214"], ["Best Setup", "Breakout"], ["Win Rate", "72.91%"]],
    headers: ["Scope", "PnL", "ROI", "Win Rate"],
    rows: [
      ["All Users", "$356,780", "18.4%", "72.91%"],
      ["Premium Users", "$284,120", "22.1%", "76.2%"],
      ["Basic Users", "$72,660", "11.8%", "64.5%"],
    ],
  },
  notifications: {
    permissionKey: "notifications",
    title: "Notifications",
    description: "Send targeted messages to users based on behavior and activity.",
    metrics: [["Pending", "18"], ["Sent Today", "420"], ["Open Rate", "58%"], ["Target Groups", "6"]],
    filters: ["No Deposit Users", "One-Time Deposit Users", "Active Subscribers", "Expired Users", "High Value Users", "Campaign Users"],
    headers: ["Audience", "Message", "Channel", "Status"],
    rows: [
      ["No Deposit Users", "Complete your first deposit", "In-app", "Draft"],
      ["Expired Users", "Renew your plan today", "Email", "Sent"],
      ["Active Users", "New trading update added", "In-app", "Queued"],
    ],
  },
  campaigns: {
    permissionKey: "campaigns",
    title: "Campaign Management",
    description: "Create and track marketing campaigns to measure user acquisition.",
    metrics: [["Campaigns", "14"], ["Users", "335"], ["Deposits", "142"], ["Revenue", "$32,500"]],
    headers: ["Campaign", "Tracking Link", "Users", "Revenue"],
    rows: [
      ["SUMMER2025", "/register?campaign=SUMMER2025", "120", "$12,000"],
      ["GOOGLE_ADS", "/register?campaign=GOOGLE_ADS", "80", "$8,500"],
    ],
  },
  referrals: {
    permissionKey: "referrals",
    title: "Referral System",
    description: "Manage referral rewards and track user-to-user growth.",
    metrics: [["Referral %", "10%"], ["Referrals", "1,204"], ["Payouts", "$18,420"], ["Revenue", "$92,100"]],
    headers: ["Referrer", "User", "Deposit", "Reward"],
    rows: [
      ["Harsh", "Rahul", "$10,000", "$1,000"],
      ["Amit", "Neha", "$5,000", "$500"],
    ],
  },
  admins: {
    permissionKey: "admins",
    title: "Admin Management",
    description: "Manage platform administrators and their roles.",
    metrics: [["Admins", "8"], ["Support", "3"], ["Super Admins", "2"], ["Pending Invites", "1"]],
    headers: ["Admin Name", "Role", "Assigned Module Permissions", "Status"],
  },
  reports: {
    permissionKey: "reports",
    title: "Reports & Analytics",
    description: "Access detailed reports on users, revenue, and platform activity.",
    metrics: [["Revenue Reports", "24"], ["Growth Reports", "18"], ["Exports", "92"], ["This Month", "$42,800"]],
    headers: ["Report Name", "Category", "Last Updated", "File Format"],
    rows: [
      ["Monthly Revenue", "Finance", "Today", "Excel"],
      ["User Growth", "Growth", "Yesterday", "PDF"],
      ["Active Trade Logs", "Trading", "May 25", "Excel"],
    ],
  },
  settings: {
    permissionKey: "settings",
    title: "Platform Settings",
    description: "Configure global platform rules and system behavior.",
    metrics: [["Referral %", "10%"], ["Platform Fee", "4%"], ["Payment QR", "Active"], ["Configs", "16"]],
    headers: ["Setting", "Current Value", "Owner", "Status"],
  },
  "activity-logs": {
    permissionKey: "activity-logs",
    title: "Activity Logs",
    description: "Track all actions performed on the platform for transparency and security.",
    metrics: [["Logs Today", "642"], ["Admin Actions", "84"], ["User Actions", "558"], ["Alerts", "3"]],
    headers: ["Auditor Name", "Logged Action", "Target Module", "Timestamp", "IP Address"],
  },
  otp: {
    permissionKey: "otp",
    title: "OTP Override Management",
    description: "Manage security overrides and manual OTP generation for users encountering network delivery issues.",
    metrics: [["Pending Requests", "2"], ["Active/Generated", "0"], ["Verified Overrides", "0"], ["Daily Limit", "Max 10 / admin"]],
    headers: ["ID", "User Details", "Type", "Risk level", "Status", "Request Date"],
  },
  transactions: {
    permissionKey: "payments",
    title: "Transaction History",
    description: "Full ledger of all deposits and withdrawal requests across the platform.",
    metrics: [["Total Volume", "₹1,12,100"], ["Deposits", "6"], ["Withdrawals", "4"], ["Pending Withdrawals", "1"]],
    filters: ["All", "Deposit", "Withdrawal", "Pending", "Completed", "Rejected"],
    headers: ["Txn ID", "User", "Type", "Amount", "Method", "Ref / UTR", "Status", "Date"],
  },
  plans: {
    permissionKey: "plans",
    title: "Pricing Plans",
    description: "Manage system-wide pricing plans (Club Plan, Individual Plan, Custom Plan), modify features, limits, and toggle visibility.",
    metrics: [["Total Plans", "3"], ["Active Plans", "3"], ["Micro Capital", "1"], ["Premium Plans", "2"]],
    headers: ["Plan Name", "Subtitle", "Capital Limit", "Features", "Status"],
  },
  withdrawals: {
    permissionKey: "payments",
    title: "Withdrawal Requests",
    description: "Manage system-wide withdrawal requests. Reserve balances immediately and audit them.",
    metrics: [["Total Requests", "0"], ["Pending", "0"], ["Approved", "0"], ["Rejected", "0"]],
    filters: ["Pending", "Approved", "Rejected"],
    headers: ["Request ID", "User", "Amount", "Method", "Status", "Date"],
  },
};


function CrudButton({ icon: Icon, label, tone = "view", disabled = false, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition ${disabled ? actionStyles.disabled : actionStyles[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

function canMutate(value) {
  return value && value !== "No" && value !== "Auto";
}

function getEditLabel(permissionKey, editPermission) {
  if (permissionKey === "payments") return "Status";
  if (permissionKey === "settings") return "Update";
  if (permissionKey === "referrals") return "Settings";
  if (editPermission === "Draft only") return "Draft";
  return "Edit";
}

function CreateActionButton({ permissionKey, onClick }) {
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const canCreate = hasPermission(permissionKey, "create");

  if (exportOnlySections.has(permissionKey)) {
    return <CrudButton icon={FileDown} label="Export" tone="view" />;
  }

  if (!canCreate) {
    return null;
  }

  return <CrudButton icon={Plus} label={createLabels[permissionKey] || "Create"} tone="create" onClick={onClick} />;
}

function RecordActions({ permissionKey, sectionTitle, itemId, itemRow, onView, onEdit, onDelete, onBlock, onVerify, onApprove, onReject, onCloseTrade, onPublish, onUnpublish }) {
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const canEdit = hasPermission(permissionKey, "edit");
  const canDelete = hasPermission(permissionKey, "delete");

  if (["notifications", "campaigns", "referrals"].includes(permissionKey)) {
    return (
      <div className="flex justify-end gap-2">
        <CrudButton icon={Eye} label="View" tone="view" onClick={() => onView(itemId)} />
        {canEdit && <CrudButton icon={Pencil} label="Edit" tone="edit" onClick={() => onEdit(itemId)} />}
        {canDelete && <CrudButton icon={Trash2} label="Delete" tone="delete" onClick={() => onDelete(itemId)} />}
      </div>
    );
  }

  if (permissionKey === "payments" && sectionTitle !== "Transaction History") {
    const status = itemRow[6]; 
    if (!canEdit) return <span className="text-xs text-neutral-500">Read-Only</span>;
    if (status === "Pending") {
      return (
        <div className="flex gap-2">
          <CrudButton icon={Check} label="Verify" tone="warn" onClick={() => onVerify(itemId)} />
        </div>
      );
    }
    if (status === "Verified") {
      return (
        <div className="flex gap-2">
          <CrudButton icon={Check} label="Approve" tone="approve" onClick={() => onApprove(itemId)} />
          <CrudButton icon={X} label="Reject" tone="reject" onClick={() => onReject(itemId)} />
        </div>
      );
    }
    return <span className="text-xs text-neutral-500">Processed</span>;
  }

  if (permissionKey === "users") {
    const status = itemRow[4];
    return (
      <div className="flex gap-2">
        <CrudButton icon={Eye} label="View" tone="view" onClick={() => onView(itemId)} />
        {canEdit && <CrudButton icon={Pencil} label="Edit" tone="edit" onClick={() => onEdit(itemId)} />}
        {canEdit && <CrudButton icon={Ban} label={status === "Blocked" ? "Unblock" : "Block"} tone="warn" onClick={() => onBlock(itemId)} />}
        {canDelete && <CrudButton icon={Trash2} label="Delete" tone="delete" onClick={() => onDelete(itemId)} />}
      </div>
    );
  }

  if (permissionKey === "trades") {
    const status = itemRow[7];
    return (
      <div className="flex gap-2">
        {canEdit && <CrudButton icon={Pencil} label="Edit" tone="edit" onClick={() => onEdit(itemId)} />}
        {canEdit && status === "draft" && (
          <CrudButton icon={Check} label="Publish" tone="approve" onClick={() => onPublish(itemId)} />
        )}
        {canEdit && status === "published" && (
          <CrudButton icon={X} label="Unpublish" tone="reject" onClick={() => onUnpublish(itemId)} />
        )}
        {canDelete && <CrudButton icon={Trash2} label="Delete" tone="delete" onClick={() => onDelete(itemId)} />}
        {!canEdit && !canDelete && <span className="text-xs text-neutral-500">Read-Only</span>}
      </div>
    );
  }

  if (permissionKey === "admins") {
    const role = itemRow[1];
    return (
      <div className="flex gap-2">
        {canEdit && <CrudButton icon={Pencil} label="Edit" tone="edit" onClick={() => onEdit(itemId)} />}
        {canDelete && (
          <CrudButton 
            icon={Trash2} 
            label="Remove" 
            tone="delete" 
            disabled={role === "Super Admin"}
            onClick={() => onDelete(itemId)} 
          />
        )}
        {!canEdit && !canDelete && <span className="text-xs text-neutral-500">Read-Only</span>}
      </div>
    );
  }

  if (permissionKey === "otp") {
    const status = itemRow[4];
    const canGenerate = hasPermission("otp", "generate");
    if (status === "pending") {
      return (
        <div className="flex gap-2 justify-end">
          {canGenerate && <CrudButton icon={Check} label="Handle Request" tone="approve" onClick={() => onEdit(itemId)} />}
          {canGenerate && <CrudButton icon={X} label="Reject" tone="reject" onClick={() => onDelete(itemId)} />}
          {!canGenerate && <span className="text-xs text-neutral-500">Read-Only</span>}
        </div>
      );
    }
    return <span className="text-xs text-neutral-500 capitalize">{status}</span>;
  }

  if (sectionTitle === "Withdrawal Requests") {
    const status = itemRow[4];
    const canApprove = hasPermission("payments", "edit");
    return (
      <div className="flex gap-2 justify-end items-center">
        <CrudButton icon={Eye} label="View" tone="view" onClick={() => onView(itemId)} />
        {status === "Pending" && canApprove && (
          <>
            <CrudButton icon={Check} label="Approve" tone="approve" onClick={() => onApprove(itemId)} />
            <CrudButton icon={X} label="Reject" tone="reject" onClick={() => onReject(itemId)} />
          </>
        )}
        {status !== "Pending" && (
          <span className={`text-xs font-bold ${
            status === "Approved" ? "text-green-300" : "text-red-300"
          }`}>{status}</span>
        )}
      </div>
    );
  }

  if (permissionKey === "plans") {
    return (
      <div className="flex justify-end gap-2">
        {canEdit && <CrudButton icon={Pencil} label="Edit" tone="edit" onClick={() => onEdit(itemId)} />}
        {canDelete && <CrudButton icon={Trash2} label="Delete" tone="delete" onClick={() => onDelete(itemId)} />}
        {!canEdit && !canDelete && <span className="text-xs text-neutral-500">Read-Only</span>}
      </div>
    );
  }

  if (permissionKey === "transactions" || sectionTitle === "Transaction History") {
    const type = itemRow[2];
    const status = itemRow[6];
    const canApprove = hasPermission("payments", "edit");
    const isWithdrawal = type === "Withdrawal" || type === "↑ Withdrawal";
    
    return (
      <div className="flex gap-2 justify-end items-center">
        {isWithdrawal && (
          <CrudButton icon={Eye} label="View" tone="view" onClick={() => onView(itemId)} />
        )}
        {isWithdrawal && status === "Pending" && canApprove && (
          <>
            <CrudButton icon={Check} label="Approve" tone="approve" onClick={() => onApprove(itemId)} />
            <CrudButton icon={X} label="Reject" tone="reject" onClick={() => onReject(itemId)} />
          </>
        )}
        {(!isWithdrawal || status !== "Pending") && (
          <span className={`text-xs font-bold ${
            status === "Completed" || status === "Approved" ? "text-green-300" :
            status === "Rejected" ? "text-red-300" :
            status === "Failed" ? "text-red-400" :
            "text-yellow-300"
          }`}>{status}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <span className="text-xs text-neutral-500">Read-Only</span>
    </div>
  );
}

function MetricCard({ item }) {
  const Icon = item.icon;
  const isPayments = item.label === "Pending Payments";
  const path = sparklinePoints[item.tone] || sparklinePoints.green;
  const stroke = sparklineStroke[item.tone] || sparklineStroke.green;
  const fill = sparklineFill[item.tone] || sparklineFill.green;

  return (
    <article className={`${adminPanel} overflow-hidden p-4`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${toneMap[item.tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-neutral-400 leading-tight">{item.label}</p>
          <p className="mt-1.5 text-xl font-semibold tracking-tight text-white break-all leading-tight">{item.value}</p>
        </div>
      </div>
      <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${isPayments ? "text-yellow-300" : "text-green-300"}`}>
        {isPayments ? item.sub : `+ ${item.sub}`}
        {isPayments && <ArrowRight className="h-3.5 w-3.5" />}
      </p>
      <svg viewBox="0 0 156 38" className="mt-2 h-8 w-full" aria-hidden="true">
        <path d={`${path} L156 38 L0 38 Z`} fill={fill} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" />
      </svg>
    </article>
  );
}

function RevenueChart() {
  const labels = ["May 19", "May 20", "May 21", "May 22", "May 23", "May 24", "May 25"];
  const points = [[35, 168], [126, 146], [216, 100], [307, 128], [398, 88], [489, 45], [568, 70]];
  const path = points.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const area = `${path} L 568 205 L 35 205 Z`;

  return (
    <section className={`${adminPanel} p-5 xl:col-span-6`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-violet-300">R</span>
            <h2 className="text-lg font-semibold text-white">Revenue Overview</h2>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <p className="text-3xl font-semibold tracking-tight text-white">$248,250.75</p>
            <p className="pb-1 text-sm text-neutral-400"><span className="text-green-300">+ 23.8%</span> vs last week</p>
          </div>
        </div>
        <button className={`inline-flex h-10 items-center gap-2 px-4 text-sm text-white ${adminControl}`}>
          This Week
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </button>
      </div>

      <div className="mt-5 h-[255px] overflow-hidden">
        <svg viewBox="0 0 620 230" className="h-full w-full" role="img" aria-label="Revenue chart">
          {[0, 1, 2, 3, 4, 5].map((line) => (
            <line key={line} x1="35" x2="590" y1={25 + line * 36} y2={25 + line * 36} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 5" />
          ))}
          {["$60K", "$50K", "$40K", "$30K", "$20K", "$10K", "$0"].map((label, index) => (
            <text key={label} x="0" y={25 + index * 30} fill="rgb(156 163 175)" fontSize="12">{label}</text>
          ))}
          <defs>
            <linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(34 197 94)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="rgb(34 197 94)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#revenueArea)" />
          <path d={path} fill="none" stroke="rgb(34 197 94)" strokeWidth="2.5" />
          {points.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.5" fill="rgb(34 197 94)" />
          ))}
          {labels.map((label, index) => (
            <text key={label} x={35 + index * 89} y="225" fill="rgb(156 163 175)" fontSize="12" textAnchor="middle">{label}</text>
          ))}
        </svg>
      </div>
    </section>
  );
}

function SubscriptionStatus() {
  const rows = [
    ["Active", "4,250 (72.1%)", "bg-green-400"],
    ["Expired", "1,012 (17.2%)", "bg-red-400"],
    ["Pending", "492 (8.4%)", "bg-yellow-300"],
    ["Cancelled", "138 (2.3%)", "bg-slate-300"],
  ];

  return (
    <section className={`${adminPanel} p-5 xl:col-span-3`}>
      <h2 className="text-lg font-semibold text-white">Subscription Status</h2>
      <div className="mt-8 grid items-center gap-8 sm:grid-cols-[190px_1fr] xl:grid-cols-1 2xl:grid-cols-[190px_1fr]">
        <div className="relative mx-auto h-44 w-44 rounded-full bg-[conic-gradient(#22c55e_0_72%,#ef4444_72%_89%,#facc15_89%_97%,#cbd5e1_97%_100%)]">
          <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-[#081118]">
            <p className="text-3xl font-semibold text-white">5,892</p>
            <p className="mt-1 text-sm text-neutral-400">Total</p>
          </div>
        </div>
        <div className="space-y-4">
          {rows.map(([name, value, color]) => (
            <div key={name} className="flex items-start gap-3">
              <span className={`mt-1 h-3 w-3 rounded-sm ${color}`}></span>
              <div>
                <p className="text-sm font-medium text-white">{name}</p>
                <p className="text-sm text-neutral-400">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <a href="/admin/dashboard?section=payments" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-green-300">
        View all subscriptions
        <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  );
}

function ActivityFeed() {
  const logs = useAdminStore((s) => s.logs);
  return (
    <section className={`${adminPanel} p-5 xl:col-span-3`}>
      <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
      <div className="mt-6 space-y-5">
        {logs.slice(0, 5).map((item) => (
          <div key={item.id} className="flex gap-4">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300`}>
              <Search className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-3">
                <p className="text-sm font-semibold text-white">{item.action}</p>
                <span className="shrink-0 text-sm text-neutral-400">{item.time}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-400">Module: {item.module} {item.targetId && `| Ref: ${item.targetId}`}</p>
            </div>
          </div>
        ))}
      </div>
      <a href="/admin/dashboard?section=activity-logs" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-green-300">
        View all activity
        <ArrowRight className="h-4 w-4" />
      </a>
    </section>
  );
}

function PendingPaymentsTable({ onVerify, onApprove, onReject }) {
  const payments = useAdminStore((s) => s.payments);
  const searchQuery = useAdminStore((s) => s.searchQuery || "");
  const addPayment = useAdminStore((s) => s.addPayment);
  const [showInitiate, setShowInitiate] = useState(false);
  const [initForm, setInitForm] = useState({ user: "", email: "", plan: "", amount: "", txnHash: "", screenshot: "", network: "TRC20" });
  let pending = payments.filter((p) => p.status === "Pending" || p.status === "Verified");

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    pending = pending.filter((p) => 
      p.id.toLowerCase().includes(q) || 
      p.user.toLowerCase().includes(q) || 
      p.email.toLowerCase().includes(q) || 
      (p.utr && p.utr.toLowerCase().includes(q)) || 
      (p.txnHash && p.txnHash.toLowerCase().includes(q))
    );
  }

  return (
    <section className={`${adminPanel} p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-green-300">P</span>
          <h2 className="text-lg font-semibold text-white">Pending Transactions</h2>
          <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-black text-green-300">{pending.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInitiate(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-bold text-white hover:bg-white/[0.06]"
          >
            Initiate Payment
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              {["ID", "User", "Plan", "Amount", "Method", "Transaction ID", "Status", "Actions"].map((head) => (
                <th key={head} className="px-4 py-4 font-semibold">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {pending.map((payment) => (
              <tr key={payment.id} className="hover:bg-white/[0.025]">
                <td className="px-4 py-4 font-bold text-white">{payment.id}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-slate-800">{payment.initials}</span>
                    <div>
                      <p className="font-semibold text-white">{payment.user}</p>
                      <p className="text-xs text-neutral-500">{payment.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">{payment.plan}</td>
                <td className="px-4 py-4 font-semibold text-white">{payment.amount}</td>
                <td className="px-4 py-4">
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300">
                    {payment.paymentType}
                  </span>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-neutral-300">
                  <div>
                    <span className="block font-semibold text-neutral-400">Transaction ID:</span>
                    <span className="block select-all text-amber-300">{payment.txnHash}</span>
                    <span className="text-[10px] text-neutral-500">Network: {payment.network || "TRC20"}</span>
                    {payment.screenshot && (
                      <a href={payment.screenshot} target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-[10px] font-bold text-green-300 hover:bg-white/[0.08]">
                        <img src={payment.screenshot} alt="Payment proof preview" className="h-10 w-10 rounded object-cover" />
                        View Screenshot
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    payment.status === "Verified" ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                  }`}>
                    {payment.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {payment.status === "Pending" && (
                      <button onClick={() => onVerify(payment.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 text-xs font-bold text-yellow-300 hover:bg-yellow-500/20">
                        Verify
                      </button>
                    )}
                    {payment.status === "Verified" && (
                      <>
                        <button onClick={() => onApprove(payment.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 text-xs font-bold text-green-300 hover:bg-green-500/20">
                          Approve
                        </button>
                        <button onClick={() => onReject(payment.id)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-bold text-red-300 hover:bg-red-500/20">
                          Reject
                        </button>
                      </>
                    )}
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-neutral-400">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-sm text-neutral-500">No pending transactions.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showInitiate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#0A0A0A]/95 p-6">
            <h3 className="text-lg font-semibold text-white">Initiate Payment</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addPayment({
                  user: initForm.user || "Guest",
                  email: initForm.email || "unknown@tradebot.local",
                  plan: initForm.plan || "Manual",
                  amount: initForm.amount || "$0.00",
                  txnHash: initForm.txnHash || "Pending",
                  screenshot: initForm.screenshot || "",
                  network: initForm.network || "TRC20",
                });
                setShowInitiate(false);
                setInitForm({ user: "", email: "", plan: "", amount: "", txnHash: "", screenshot: "", network: "TRC20" });
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs text-neutral-400">User name</label>
                <input value={initForm.user} onChange={(e) => setInitForm({ ...initForm, user: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Email</label>
                <input value={initForm.email} onChange={(e) => setInitForm({ ...initForm, email: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-400">Plan</label>
                  <input value={initForm.plan} onChange={(e) => setInitForm({ ...initForm, plan: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-400">Amount</label>
                  <input value={initForm.amount} onChange={(e) => setInitForm({ ...initForm, amount: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Transaction ID</label>
                <input value={initForm.txnHash} onChange={(e) => setInitForm({ ...initForm, txnHash: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-neutral-400">Screenshot URL (optional)</label>
                <input value={initForm.screenshot} onChange={(e) => setInitForm({ ...initForm, screenshot: e.target.value })} className="mt-1 w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowInitiate(false)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-bold text-white">Cancel</button>
                <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg bg-green-500 px-3 text-xs font-bold text-black">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function QuickActionCard({ item }) {
  const Icon = item.icon;
  const url = item.title === "Users" ? "/admin/dashboard?section=users" :
              item.title === "Send Notification" ? "/admin/dashboard?section=notifications" :
              item.title === "Create Campaign" ? "/admin/dashboard?section=campaigns" :
              item.title === "Referral Settings" ? "/admin/dashboard?section=referrals" :
              item.title === "White Label" ? "/admin/white-label" : "/admin/dashboard?section=reports";

  return (
    <Link href={url} className={`block rounded-xl border bg-[#081118]/95 p-5 shadow-[0_18px_65px_-55px_rgba(0,208,156,0.65)] transition ${quickBorder[item.tone]}`}>
      <div className="flex items-start gap-4">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${toneMap[item.tone]}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-semibold text-white">{item.title}</h3>
          <p className="mt-1 text-sm text-neutral-400">{item.text}</p>
        </div>
      </div>
      <span className={`mt-7 inline-flex items-center gap-2 text-sm font-semibold ${toneMap[item.tone].split(" ").at(-1)}`}>
        {item.action}
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function PlatformOverview({ onVerify, onApprove, onReject }) {
  const users = useAdminStore((s) => s.users);
  const totalUserWalletBalance = users.reduce((sum, user) => {
    const amount = Number(String(user.deposit).replace(/[^0-9.-]+/g, ""));
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  return (
    <>
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[
          { icon: Users, label: "Total Users", value: "12,648", sub: "18.6% this week", tone: "green" },
          { icon: UserCheck, label: "Active Users", value: "5,892", sub: "14.3% this week", tone: "violet" },
          { icon: DollarSign, label: "Total Revenue", value: "$248,250.75", sub: "23.8% this week", tone: "blue" },
          { icon: Wallet, label: "Total Capital", value: "$1,842,500.00", sub: "12.4% this week", tone: "amber" },
          { icon: Wallet, label: "Total User Wallet Balance", value: `$${totalUserWalletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Current sum of user deposits", tone: "cyan" },
          { icon: Wallet, label: "Active Wallet Balance", value: "$927,340.00", sub: "9.8% this week", tone: "purple" },
          { icon: TrendingUp, label: "Total Profit", value: "$356,780.45", sub: "31.2% this week", tone: "green" },
        ].map((item) => (
          <MetricCard key={item.label} item={item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <RevenueChart />
        <SubscriptionStatus />
        <ActivityFeed />
      </section>

      <PendingPaymentsTable onVerify={onVerify} onApprove={onApprove} onReject={onReject} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {quickActions.map((item) => (
          <QuickActionCard key={item.title} item={item} />
        ))}
      </section>
    </>
  );
}

function AdminSectionPage({ 
  section, activeFilter = "All", onView, onEdit, onDelete, onBlock, onVerify, onApprove, onReject, 
  onAddClick, onCloseTrade, activeSettings, onSaveSettings, referralListModal, setReferralListModal,
  onPublish, onUnpublish
}) {
  const [selectedTrades, setSelectedTrades] = useState([]);
  
  const showFilterTabs = section.permissionKey === "users" || section.title === "Transaction History" || section.permissionKey === "trades" || section.title === "Withdrawal Requests";
  const filterBaseUrl = section.title === "Transaction History" ? "/admin/dashboard?section=transactions" : section.permissionKey === "trades" ? "/admin/dashboard?section=trades" : section.title === "Withdrawal Requests" ? "/admin/dashboard?section=withdrawals" : "/admin/dashboard?section=users";

  useEffect(() => {
    setSelectedTrades([]);
  }, [section, activeFilter]);

  const users = useAdminStore((s) => s.users);
  const payments = useAdminStore((s) => s.payments);
  const trades = useAdminStore((s) => s.trades);
  const settings = useAdminStore((s) => s.settings);
  const logs = useAdminStore((s) => s.logs);
  const admins = useAdminStore((s) => s.admins);
  const partners = useAdminStore((s) => s.partners);
  const notifications = useAdminStore((s) => s.notifications || []);
  const campaigns = useAdminStore((s) => s.campaigns || []);
  const referrals = useAdminStore((s) => s.referrals || []);
  const otpRequests = useAdminStore((s) => s.otpRequests || []);
  const transactions = useAdminStore((s) => s.transactions || []);
  const plans = useAdminStore((s) => s.plans || []);
  const withdrawals = useAdminStore((s) => s.withdrawals || []);
  const hasPermission = useAdminStore((s) => s.hasPermission);
  const canEditSettings = hasPermission("settings", "edit");
  const searchQuery = useAdminStore((s) => s.searchQuery || "");
  const setSearchQuery = useAdminStore((s) => s.setSearchQuery);

  // Filters for Reports section
  const [reportDateRange, setReportDateRange] = useState("all");
  const [reportPartnerId, setReportPartnerId] = useState("all");
  const [reportUserId, setReportUserId] = useState("all");

  // Search/Filters for Activity Logs section
  const [logModuleFilter, setLogModuleFilter] = useState("all");
  const sectionMetrics = section.permissionKey === "trades"
    ? [
        ["Total Records", trades.length.toLocaleString()],
        ["Published", trades.filter((trade) => trade.status === "published").length.toLocaleString()],
        ["Drafts", trades.filter((trade) => trade.status === "draft").length.toLocaleString()],
        ["Win Rate", (() => {
          const wins = trades.filter((t) => t.profitLoss > 0).length;
          return trades.length > 0 ? `${((wins / trades.length) * 100).toFixed(1)}%` : "0.0%";
        })()],
      ]
    : section.title === "Withdrawal Requests"
    ? [
        ["Total Requests", withdrawals.length.toString()],
        ["Pending", withdrawals.filter((w) => w.status === "Pending").length.toString()],
        ["Approved", withdrawals.filter((w) => w.status === "Approved").length.toString()],
        ["Rejected", withdrawals.filter((w) => w.status === "Rejected").length.toString()],
      ]
    : section.metrics;

  let rows = [];
  if (section.permissionKey === "users") {
    let list = users;
    if (activeFilter === "No Deposit") {
      list = users.filter((u) => u.deposit === "$0" || u.deposit === "₹0" || u.plan === "None");
    } else if (activeFilter !== "All") {
      list = users.filter((u) => u.status === activeFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((u) => 
        u.name.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) ||
        u.plan.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
      );
    }
    rows = list.map((u) => [u.name, u.email, u.deposit, u.plan, u.status, u.id]);
  } else if (section.permissionKey === "payments" && section.title !== "Transaction History") {
    let list = payments;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => 
        p.id.toLowerCase().includes(q) || 
        p.user.toLowerCase().includes(q) || 
        p.email.toLowerCase().includes(q) ||
        p.plan.toLowerCase().includes(q) ||
        p.amount.toLowerCase().includes(q) ||
        p.paymentType.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        (p.utr && p.utr.toLowerCase().includes(q)) ||
        (p.txnHash && p.txnHash.toLowerCase().includes(q))
      );
    }
    rows = list.map((p) => [p.id, p.user, p.plan, p.amount, p.paymentType, p.utr || p.txnHash || "N/A", p.status, p.id]);
  } else if (section.permissionKey === "trades") {
    let list = trades;
    if (activeFilter === "Wins") {
      list = trades.filter((t) => t.profitLoss > 0);
    } else if (activeFilter === "Losses") {
      list = trades.filter((t) => t.profitLoss <= 0);
    } else if (activeFilter === "Published") {
      list = trades.filter((t) => t.status === "published");
    } else if (activeFilter === "Draft") {
      list = trades.filter((t) => t.status === "draft");
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => 
        t.pair.toLowerCase().includes(q) || 
        t.side.toLowerCase().includes(q) || 
        t.status.toLowerCase().includes(q) ||
        (t.result && t.result.toLowerCase().includes(q))
      );
    }
    rows = list.map((t) => [
      t.pair, 
      t.side, 
      `₹${Number(t.entryPrice).toLocaleString("en-IN")}`, 
      `₹${Number(t.exitPrice).toLocaleString("en-IN")}`, 
      t.tradeDate ? new Date(t.tradeDate).toLocaleDateString("en-IN") : "N/A", 
      t.result, 
      t.profitLoss >= 0 ? `+₹${t.profitLoss.toLocaleString("en-IN")}` : `-₹${Math.abs(t.profitLoss).toLocaleString("en-IN")}`, 
      t.status, 
      t.id
    ]);
  } else if (section.permissionKey === "admins") {
    let list = admins;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) => 
        a.name.toLowerCase().includes(q) || 
        a.role.toLowerCase().includes(q) || 
        a.status.toLowerCase().includes(q)
      );
    }
    rows = list.map((a) => [
      a.name,
      a.role,
      Object.keys(a.permissions).filter((k) => a.permissions[k].length > 0).map((k) => `${k[0].toUpperCase()}${k.slice(1)}`).join(", ") || "None",
      a.status,
      a.id
    ]);
  } else if (section.permissionKey === "reports") {
    // Dynamic reports table using dropdown filters
    let list = section.rows || [];
    if (reportPartnerId !== "all") {
      list = list.filter((r) => r[0].toLowerCase().includes("revenue") || r[1].toLowerCase().includes("trading"));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => 
        r[0].toLowerCase().includes(q) || 
        r[1].toLowerCase().includes(q)
      );
    }
    rows = list.map((r, idx) => [r[0], r[1], reportDateRange === "today" ? "Today" : r[2], r[3], `report-id-${idx}`]);
  } else if (section.permissionKey === "notifications") {
    let list = notifications;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((n) =>
        n.audience.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.channel.toLowerCase().includes(q) ||
        n.status.toLowerCase().includes(q)
      );
    }
    rows = list.map((n) => [n.audience, n.message, n.channel, n.status, n.id]);
  } else if (section.permissionKey === "campaigns") {
    let list = campaigns;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.trackingLink.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q)
      );
    }
    rows = list.map((c) => [c.name, c.trackingLink, String(c.users), c.revenue, c.id]);
  } else if (section.permissionKey === "referrals") {
    let list = referrals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        r.referrer.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.deposit.toLowerCase().includes(q) ||
        r.reward.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      );
    }
    rows = list.map((r) => [r.referrer, r.user, r.deposit, r.reward, r.id]);
  } else if (section.permissionKey === "activity-logs") {
    let filteredLogs = logs;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredLogs = logs.filter((l) => 
        l.actor.toLowerCase().includes(q) || 
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q)
      );
    }
    if (logModuleFilter !== "all") {
      filteredLogs = filteredLogs.filter((l) => l.module.toLowerCase() === logModuleFilter.toLowerCase());
    }
    rows = filteredLogs.map((l) => [l.actor, l.action, l.module, l.time, l.ipAddress || "127.0.0.1", l.id]);
  } else if (section.permissionKey === "otp") {
    let list = otpRequests;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    }
    rows = list.map((r) => [
      r.id,
      `${r.userName} (${r.userEmail})`,
      r.type,
      r.riskFlag,
      r.status,
      new Date(r.createdAt).toLocaleString(),
      r.id
    ]);
  } else if (section.title === "Withdrawal Requests") {
    let list = withdrawals;
    if (activeFilter === "Pending") list = list.filter(w => w.status === "Pending");
    else if (activeFilter === "Approved") list = list.filter(w => w.status === "Approved");
    else if (activeFilter === "Rejected") list = list.filter(w => w.status === "Rejected");

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(w =>
        w.withdrawalId.toLowerCase().includes(q) ||
        w.userName.toLowerCase().includes(q) ||
        w.userEmail.toLowerCase().includes(q) ||
        w.method.toLowerCase().includes(q) ||
        w.status.toLowerCase().includes(q)
      );
    }
    rows = list.map(w => [
      w.withdrawalId,
      w.userName,
      `₹${w.amount.toLocaleString()}`,
      w.method,
      w.status,
      w.date,
      w.id
    ]);
  } else if (section.title === "Transaction History") {
    let list = transactions;
    // Type filter
    if (activeFilter === "Deposit") list = list.filter(t => t.type === "Deposit");
    else if (activeFilter === "Withdrawal") list = list.filter(t => t.type === "Withdrawal");
    else if (activeFilter === "Pending") list = list.filter(t => t.status === "Pending");
    else if (activeFilter === "Completed") list = list.filter(t => t.status === "Completed");
    else if (activeFilter === "Rejected") list = list.filter(t => t.status === "Rejected");
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q) ||
        t.txRef.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      );
    }
    rows = list.map(t => [
      t.id,
      `${t.userName}`,
      t.type,
      `₹${t.amount.toLocaleString()}`,
      t.method,
      t.txRef,
      t.status,
      `${t.date} ${t.time}`,
      t.id
    ]);
  } else if (section.permissionKey === "plans") {
    let list = plans;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.capitalLabel.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)
      );
    }
    rows = list.map(p => [
      p.name,
      p.subtitle,
      p.capitalLabel,
      p.features.join(", "),
      p.status,
      p.id
    ]);
  } else {
    rows = section.rows || [];
  }

  // Settings Panel specific states
  const [upiIdInput, setUpiIdInput] = useState(activeSettings.upiId);
  const [usdtNetwork, setUsdtNetwork] = useState(activeSettings.usdt.network);
  const [usdtAddress, setUsdtAddress] = useState(activeSettings.usdt.walletAddress);
  const [platformFee, setPlatformFee] = useState(activeSettings.financials.platformFee);
  const [referralFee, setReferralFee] = useState(activeSettings.financials.referralFee);
  const [upiEnabled, setUpiEnabled] = useState(activeSettings.paymentModes.upi);
  const [bankEnabled, setBankEnabled] = useState(activeSettings.paymentModes.bank);
  const [usdtEnabled, setUsdtEnabled] = useState(activeSettings.paymentModes.usdt);
  const [maintenanceMode, setMaintenanceMode] = useState(activeSettings.system.maintenanceMode);

  useEffect(() => {
    setUpiIdInput(activeSettings.upiId);
    setUsdtNetwork(activeSettings.usdt.network);
    setUsdtAddress(activeSettings.usdt.walletAddress);
    setPlatformFee(activeSettings.financials.platformFee);
    setReferralFee(activeSettings.financials.referralFee);
    setUpiEnabled(activeSettings.paymentModes.upi);
    setBankEnabled(activeSettings.paymentModes.bank);
    setUsdtEnabled(activeSettings.paymentModes.usdt);
    setMaintenanceMode(activeSettings.system.maintenanceMode);
  }, [activeSettings]);

  const handleSave = () => {
    onSaveSettings({
      upiId: "",
      paymentModes: { upi: false, bank: false, usdt: true },
      usdt: { network: usdtNetwork, walletAddress: usdtAddress },
      financials: { platformFee: Number(platformFee), referralFee: Number(referralFee) },
      system: { maintenanceMode: maintenanceMode }
    });
  };

  return (
    <section className="space-y-5">
      <div className={`${adminPanel} p-6`}>
        <p className="text-xs font-bold uppercase tracking-wider text-green-300">Super Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{section.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-400">{section.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(section.permissionKey === "otp"
          ? [
              ["Pending Requests", otpRequests.filter(r => r.status === "pending").length.toString()],
              ["Active/Generated", otpRequests.filter(r => r.status === "generated").length.toString()],
              ["Verified Overrides", otpRequests.filter(r => r.status === "verified").length.toString()],
              ["Daily Limit", "Max 10 / admin"]
            ]
          : sectionMetrics
        ).map(([label, value]) => (
          <article key={label} className={`${adminPanel} p-5`}>
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </div>

      {section.permissionKey === "reports" && (
        <section className={`${adminPanel} p-4 flex flex-wrap gap-4 items-center justify-between`}>
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm text-neutral-400 font-semibold">Filters:</span>
            <select value={reportDateRange} onChange={(e) => setReportDateRange(e.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-xs text-white outline-none">
              <option value="all">Date: All Time</option>
              <option value="today">Date: Today</option>
            </select>
            <select value={reportPartnerId} onChange={(e) => setReportPartnerId(e.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-xs text-white outline-none">
              <option value="all">Partner: All Brands</option>
              {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={reportUserId} onChange={(e) => setReportUserId(e.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-xs text-white outline-none">
              <option value="all">User: All Clients</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button className="h-10 rounded-lg bg-green-500 px-4 text-xs font-bold text-black hover:bg-green-400">Export All</button>
        </section>
      )}

      {section.permissionKey === "activity-logs" && (
        <section className={`${adminPanel} p-4 flex flex-wrap gap-4 items-center justify-between`}>
          <label className="flex h-10 min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500">
            <Search className="h-4 w-4" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600" 
              placeholder="Search logs by operator or details..." 
            />
          </label>
          <div className="flex gap-3">
            <select value={logModuleFilter} onChange={(e) => setLogModuleFilter(e.target.value)} className="h-10 rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-xs text-white outline-none">
              <option value="all">All Modules</option>
              <option value="payments">Payments</option>
              <option value="users">Users</option>
              <option value="trades">Trades</option>
              <option value="settings">Settings</option>
              <option value="partner">Partner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </section>
      )}

      {section.permissionKey !== "settings" && (
        <section className={`${adminPanel} p-5`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-semibold text-white">Records</h2>
              {section.permissionKey !== "activity-logs" && (
                <label className="flex h-10 min-w-[280px] items-center gap-2 rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-neutral-500 focus-within:border-green-500/35 transition">
                  <Search className="h-4 w-4" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-neutral-600" 
                    placeholder={`Search ${section.title.toLowerCase()}...`} 
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="text-neutral-500 hover:text-white cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </label>
              )}
              {section.permissionKey === "trades" && selectedTrades.length > 0 && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/25 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-300">
                  <span>{selectedTrades.length} selected</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete the selected trade records?")) {
                        for (const id of selectedTrades) {
                          await onDelete(id);
                        }
                        setSelectedTrades([]);
                      }
                    }}
                    className="inline-flex items-center gap-1 hover:text-red-400 font-bold ml-2 transition border-l border-white/10 pl-2"
                  >
                    <Trash2 className="h-3 w-3" /> Delete Selected
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      for (const id of selectedTrades) {
                        await onPublish(id);
                      }
                      setSelectedTrades([]);
                    }}
                    className="inline-flex items-center gap-1 hover:text-green-200 font-bold ml-2 transition"
                  >
                    <Check className="h-3 w-3" /> Publish Selected
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      for (const id of selectedTrades) {
                        await onUnpublish(id);
                      }
                      setSelectedTrades([]);
                    }}
                    className="inline-flex items-center gap-1 hover:text-yellow-200 font-bold ml-2 transition"
                  >
                    <X className="h-3 w-3" /> Unpublish Selected
                  </button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button className={`h-10 px-4 text-sm font-bold text-white ${adminControl}`}>Filter</button>
              <CreateActionButton permissionKey={section.permissionKey} onClick={onAddClick} />
            </div>
          </div>

          {showFilterTabs && (
            <div className="mb-4 flex flex-wrap gap-2">
              {(section.filters ? ["All", ...section.filters.filter(f => f !== "All")] : ["All", ...section.filters]).map((filter) => {
                const active = (filter === "All" ? (activeFilter === "All" || !activeFilter) : activeFilter === filter);
                const href = filter === "All" ? filterBaseUrl : `${filterBaseUrl}&filter=${encodeURIComponent(filter)}`;

                return (
                  <Link
                    key={filter}
                    href={href}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      active ? "border-green-500/40 bg-green-500/15 text-green-300" : "border-white/[0.08] bg-white/[0.025] text-neutral-300 hover:bg-white/[0.08]"
                    }`}>
                    {filter}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  {section.permissionKey === "trades" && (
                    <th className="px-4 py-4 font-semibold w-10">
                      <input 
                        type="checkbox" 
                        checked={rows.length > 0 && selectedTrades.length === rows.length} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTrades(rows.map(r => r[r.length - 1]));
                          } else {
                            setSelectedTrades([]);
                          }
                        }}
                        className="h-4 w-4 rounded border-white/10 bg-white/[0.02] text-green-500 focus:ring-green-500/50 cursor-pointer" 
                      />
                    </th>
                  )}
                  {section.headers.map((header) => (
                    <th key={header} className="px-4 py-4 font-semibold">{header}</th>
                  ))}
                  <th className="px-4 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row, index) => {
                  const itemId = row[row.length - 1];
                  const cells = row.slice(0, -1);

                  return (
                    <tr key={`${itemId}-${index}`} className="hover:bg-white/[0.025]">
                      {section.permissionKey === "trades" && (
                        <td className="px-4 py-4 w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedTrades.includes(itemId)} 
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTrades(prev => [...prev, itemId]);
                              } else {
                                setSelectedTrades(prev => prev.filter(id => id !== itemId));
                              }
                            }}
                            className="h-4 w-4 rounded border-white/10 bg-white/[0.02] text-green-500 focus:ring-green-500/50 cursor-pointer" 
                          />
                        </td>
                      )}
                      {cells.map((cell, idx) => {
                        if (section.permissionKey === "payments" && section.title === "Payment Management") {
                          const paymentItem = payments.find(p => p.id === itemId);
                          if (paymentItem) {
                            if (idx === 1) {
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-slate-800">{paymentItem.initials}</span>
                                    <div>
                                      <p className="font-semibold text-white">{paymentItem.user}</p>
                                      <p className="text-xs text-neutral-500">{paymentItem.email}</p>
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                            if (idx === 4) {
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded px-2 py-0.5 text-xs font-bold ${
                                    "bg-amber-500/10 text-amber-300"
                                  }`}>
                                    {paymentItem.paymentType}
                                  </span>
                                </td>
                              );
                            }
                            if (idx === 5) {
                              return (
                                <td key={idx} className="px-4 py-4 font-mono text-xs text-neutral-300">
                                  <div>
                                    <span className="block font-semibold text-neutral-400">Transaction ID:</span>
                                    <span className="block select-all text-amber-300">{paymentItem.txnHash}</span>
                                    <span className="text-[10px] text-neutral-500">Network: {paymentItem.network || "TRC20"}</span>
                                    {paymentItem.screenshot && (
                                      <a href={paymentItem.screenshot} target="_blank" className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-[10px] font-bold text-green-300 hover:bg-white/[0.08]">
                                        <img src={paymentItem.screenshot} alt="Payment proof preview" className="h-10 w-10 rounded object-cover" />
                                        View Screenshot
                                      </a>
                                    )}
                                  </div>
                                </td>
                              );
                            }
                            if (idx === 6) {
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    paymentItem.status === "Approved" ? "bg-green-500/10 text-green-300 border border-green-500/20" :
                                    paymentItem.status === "Rejected" ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                                    paymentItem.status === "Verified" ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" :
                                    "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20"
                                  }`}>
                                    {paymentItem.status}
                                  </span>
                                  {paymentItem.remark && (
                                    <span className="block text-[10px] text-red-400 mt-1">Remark: {paymentItem.remark}</span>
                                  )}
                                </td>
                              );
                            }
                          }
                        }

                        if (section.title === "Withdrawal Requests") {
                          const wItem = withdrawals.find(w => w.id === itemId);
                          if (wItem) {
                            if (idx === 1) {
                              const initials = (wItem.userName || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-slate-800">{initials}</span>
                                    <div>
                                      <p className="font-semibold text-white">{wItem.userName}</p>
                                      <p className="text-xs text-neutral-500">{wItem.userEmail}</p>
                                    </div>
                                  </div>
                                </td>
                              );
                            }
                            if (idx === 4) {
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                                    wItem.status === "Approved" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                                    wItem.status === "Rejected" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                                    "bg-yellow-500/10 text-yellow-300 border-yellow-500/20"
                                  }`}>
                                    {wItem.status}
                                  </span>
                                </td>
                              );
                            }
                          }
                        }

                        // Trades dynamic state render
                        if (section.permissionKey === "trades") {
                          const tradeItem = trades.find(t => t.id === itemId);
                          if (tradeItem) {
                            if (idx === 5) { // Result column
                              const winTone = tradeItem.result?.toUpperCase() === "WIN" ? "text-green-400 bg-green-500/10 border border-green-500/20" : tradeItem.result?.toUpperCase() === "LOSS" ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-neutral-400 bg-neutral-500/10 border border-neutral-500/20";
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded px-2.5 py-0.5 text-xs font-bold ${winTone}`}>
                                    {tradeItem.result}
                                  </span>
                                </td>
                              );
                            }
                            if (idx === 6) { // P/L column
                              const plColor = tradeItem.profitLoss >= 0 ? "text-green-300 font-bold" : "text-red-300 font-bold";
                              return (
                                <td key={idx} className={`px-4 py-4 font-mono ${plColor}`}>
                                  {tradeItem.profitLoss >= 0 ? `+₹${tradeItem.profitLoss.toLocaleString("en-IN")}` : `-₹${Math.abs(tradeItem.profitLoss).toLocaleString("en-IN")}`}
                                </td>
                              );
                            }
                            if (idx === 7) { // Status column
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tradeItem.status === "published" ? "bg-green-500/10 text-green-300" : "bg-yellow-500/10 text-yellow-300"}`}>
                                    {tradeItem.status}
                                  </span>
                                </td>
                              );
                            }
                          }
                        }

                        // Admins dynamic state render
                        if (section.permissionKey === "admins") {
                          const adminItem = admins.find(a => a.id === itemId);
                          if (adminItem) {
                            if (idx === 3) {
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${adminItem.status === "Active" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                                    {adminItem.status}
                                  </span>
                                </td>
                              );
                            }
                          }
                        }

                        // Activity logs dynamic status render
                        if (section.permissionKey === "activity-logs") {
                          const logItem = logs.find(l => l.id === itemId);
                          if (logItem) {
                            if (idx === 3) { // time column
                              return (
                                <td key={idx} className="px-4 py-4 text-xs text-neutral-400 font-mono">
                                  {logItem.time}
                                </td>
                              );
                            }
                          }
                        }

                        if (section.permissionKey === "otp") {
                          const otpItem = otpRequests.find(r => r.id === itemId);
                          if (otpItem) {
                            if (idx === 1) { // User Details
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <div>
                                    <p className="font-semibold text-white">{otpItem.userName}</p>
                                    <p className="text-xs text-neutral-500">{otpItem.userEmail}</p>
                                  </div>
                                </td>
                              );
                            }
                            if (idx === 3) { // Risk level
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    otpItem.riskFlag === "HIGH" ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                                    otpItem.riskFlag === "MEDIUM" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                                    "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                  }`}>
                                    {otpItem.riskFlag}
                                  </span>
                                </td>
                              );
                            }
                            if (idx === 4) { // Status
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    otpItem.status === "verified" ? "bg-green-500/10 text-green-300 border border-green-500/20" :
                                    otpItem.status === "generated" ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" :
                                    otpItem.status === "pending" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                                    "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20"
                                  }`}>
                                    {otpItem.status.toUpperCase()}
                                  </span>
                                </td>
                              );
                            }
                          }
                          }

                        if (section.title === "Transaction History") {
                          const txnItem = transactions.find(t => t.id === itemId);
                          if (txnItem) {
                            if (idx === 2) { // Type badge
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded px-2.5 py-0.5 text-xs font-bold ${
                                    txnItem.type === "Deposit" ? "bg-green-500/10 text-green-300 border border-green-500/20" :
                                    "bg-red-500/10 text-red-300 border border-red-500/20"
                                  }`}>
                                    {txnItem.type === "Deposit" ? "↓ Deposit" : "↑ Withdrawal"}
                                  </span>
                                </td>
                              );
                            }
                            if (idx === 3) { // Amount
                              return (
                                <td key={idx} className={`px-4 py-4 font-mono font-bold ${
                                  txnItem.type === "Deposit" ? "text-green-300" : "text-red-300"
                                }`}>
                                  {txnItem.type === "Deposit" ? "+" : "-"}₹{txnItem.amount.toLocaleString()}
                                </td>
                              );
                            }
                            if (idx === 6) { // Status
                              return (
                                <td key={idx} className="px-4 py-4">
                                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold border ${
                                    txnItem.status === "Completed" ? "bg-green-500/10 text-green-300 border-green-500/20" :
                                    txnItem.status === "Pending" ? "bg-yellow-500/10 text-yellow-300 border-yellow-500/20" :
                                    txnItem.status === "Rejected" ? "bg-red-500/10 text-red-300 border-red-500/20" :
                                    "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                                  }`}>
                                    {txnItem.status}
                                  </span>
                                </td>
                              );
                            }
                          }
                        }


                        return (
                          <td key={`${cell}-${idx}`} className={`px-4 py-4 ${idx === 0 ? "font-semibold text-white" : "text-neutral-300"}`}>
                            {section.permissionKey === "referrals" && idx === 0 ? (
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-semibold text-white">{cell}</span>
                                <button type="button" onClick={() => setReferralListModal(cell)} className="ml-3 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-[11px] font-bold text-neutral-300 hover:bg-white/[0.04]">View all</button>
                              </div>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-right">
                        <RecordActions 
                          permissionKey={section.permissionKey}
                          sectionTitle={section.title}
                          itemId={itemId} 
                          itemRow={row}
                          onView={onView}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onBlock={onBlock}
                          onVerify={onVerify}
                          onApprove={onApprove}
                          onReject={onReject}
                          onCloseTrade={onCloseTrade}
                          onPublish={onPublish}
                          onUnpublish={onUnpublish}
                        />
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={section.headers.length + 1} className="px-4 py-8 text-center text-sm text-neutral-500">
                      No records match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {section.permissionKey === "settings" && (
        <section className="space-y-5">
          {/* Payment Configuration */}
          <section className={`${adminPanel} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">💳 Payment Configuration</h2>
                <p className="mt-1 text-sm text-neutral-400">USDT is the only accepted deposit method. Users submit transaction ID only.</p>
              </div>
              {canEditSettings && (
                <button onClick={handleSave} className="h-10 rounded-lg bg-green-500 px-5 text-sm font-bold text-black hover:bg-green-400 transition">
                  Save Payment Settings
                </button>
              )}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {/* Payment Toggles */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-300">Enabled Modes</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.015] p-3 text-sm text-neutral-300 hover:bg-white/[0.03]">
                    <span>UPI Gateway</span>
                    <input type="checkbox" disabled checked={false} className="h-4 w-4 accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.015] p-3 text-sm text-neutral-300 hover:bg-white/[0.03]">
                    <span>Bank Transfer</span>
                    <input type="checkbox" disabled checked={false} className="h-4 w-4 accent-green-500" />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.015] p-3 text-sm text-neutral-300 hover:bg-white/[0.03]">
                    <span>USDT</span>
                    <input type="checkbox" disabled checked className="h-4 w-4 accent-green-500" />
                  </label>
                </div>
              </div>

              {/* UPI Form */}
              <div className="hidden">
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-300">🏦 UPI Configuration</h3>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-neutral-400">UPI Address ID</span>
                  <input 
                    type="text" 
                    value={upiIdInput} 
                    disabled={!upiEnabled || !canEditSettings}
                    onChange={(e) => setUpiIdInput(e.target.value)} 
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" 
                  />
                </label>
                <div className="rounded-lg border border-dashed border-white/[0.12] bg-white/[0.01] p-3 text-center">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Static QR Preview</span>
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded bg-white text-black font-bold text-[10px]">
                    [ UPI QR ]
                  </div>
                  <button type="button" disabled={!upiEnabled || !canEditSettings} className="mt-2 text-xs font-bold text-green-300 hover:underline">Upload New QR</button>
                </div>
              </div>

              {/* USDT Config */}
              <div className={`space-y-4 ${!canEditSettings ? "opacity-40" : ""}`}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-green-300">🪙 USDT Configuration</h3>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-neutral-400">Network Type</span>
                  <select 
                    value={usdtNetwork} 
                    disabled={!canEditSettings}
                    onChange={(e) => setUsdtNetwork(e.target.value)} 
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50"
                  >
                    <option value="TRC20">TRC20 (Tron Network - Low Fee)</option>
                    <option value="ERC20">ERC20 (Ethereum Network)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-neutral-400">USDT Wallet Address</span>
                  <input 
                    type="text" 
                    value={usdtAddress} 
                    disabled={!canEditSettings}
                    onChange={(e) => setUsdtAddress(e.target.value)} 
                    placeholder="Enter wallet destination"
                    className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" 
                  />
                </label>
              </div>
            </div>
          </section>

          {/* Financial Settings */}
          <section className={`${adminPanel} p-5`}>
            <h2 className="text-lg font-semibold text-white mb-4">💰 Financial Configuration</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-neutral-400">Platform Profit Cut %</span>
                <input 
                  type="number" 
                  value={platformFee} 
                  disabled={!canEditSettings}
                  onChange={(e) => setPlatformFee(e.target.value)} 
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" 
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-neutral-400">Referral Multiplier %</span>
                <input 
                  type="number" 
                  value={referralFee} 
                  disabled={!canEditSettings}
                  onChange={(e) => setReferralFee(e.target.value)} 
                  className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" 
                />
              </label>
            </div>
          </section>

          {/* System Control */}
          <section className={`${adminPanel} p-5`}>
            <h2 className="text-lg font-semibold text-white mb-4">🔐 System Settings</h2>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.015] p-4">
              <div>
                <p className="text-sm font-semibold text-white">Maintenance Mode</p>
                <p className="text-xs text-neutral-500 mt-1">Directly locks all trading nodes and outputs warning flags to clients.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" disabled={!canEditSettings} checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-neutral-700 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-green-500 peer-checked:after:translate-x-5"></span>
              </label>
            </div>
          </section>
        </section>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const sectionKey = searchParams.get("section");
  const filterKey = searchParams.get("filter");
  const section = sectionContent[sectionKey];
  
  const hasPermission = useAdminStore((s) => s.hasPermission);



  // Load Zustand State actions
  const users = useAdminStore((s) => s.users);
  const trades = useAdminStore((s) => s.trades || []);
  const settings = useAdminStore((s) => s.settings);
  const admins = useAdminStore((s) => s.admins);
  const plans = useAdminStore((s) => s.plans || []);
  const addUser = useAdminStore((s) => s.addUser);
  const editUser = useAdminStore((s) => s.editUser);
  const deleteUser = useAdminStore((s) => s.deleteUser);
  const blockUser = useAdminStore((s) => s.blockUser);
  const verifyPayment = useAdminStore((s) => s.verifyPayment);
  const approvePayment = useAdminStore((s) => s.approvePayment);
  const rejectPayment = useAdminStore((s) => s.rejectPayment);
  const addTrade = useAdminStore((s) => s.addTrade);
  const closeTrade = useAdminStore((s) => s.closeTrade);
  const deleteTrade = useAdminStore((s) => s.deleteTrade);
  const editTrade = useAdminStore((s) => s.editTrade);
  const publishTrade = useAdminStore((s) => s.publishTrade);
  const unpublishTrade = useAdminStore((s) => s.unpublishTrade);
  const updateSettings = useAdminStore((s) => s.updateSettings);

  // Load Admins state actions
  const addAdmin = useAdminStore((s) => s.addAdmin);
  const editAdmin = useAdminStore((s) => s.editAdmin);
  const deleteAdmin = useAdminStore((s) => s.deleteAdmin);

  // Load Notifications, Campaigns, Referrals state actions
  const notifications = useAdminStore((s) => s.notifications || []);
  const campaigns = useAdminStore((s) => s.campaigns || []);
  const referrals = useAdminStore((s) => s.referrals || []);
  const addNotification = useAdminStore((s) => s.addNotification);
  const editNotification = useAdminStore((s) => s.editNotification);
  const deleteNotification = useAdminStore((s) => s.deleteNotification);
  const addCampaign = useAdminStore((s) => s.addCampaign);
  const editCampaign = useAdminStore((s) => s.editCampaign);
  const deleteCampaign = useAdminStore((s) => s.deleteCampaign);
  const addReferral = useAdminStore((s) => s.addReferral);
  const editReferral = useAdminStore((s) => s.editReferral);
  const deleteReferral = useAdminStore((s) => s.deleteReferral);

  // Load Pricing Plans state actions
  const addPlan = useAdminStore((s) => s.addPlan);
  const editPlan = useAdminStore((s) => s.editPlan);
  const deletePlan = useAdminStore((s) => s.deletePlan);

  // Load OTP Override state actions
  const rejectOtpRequest = useAdminStore((s) => s.rejectOtpRequest);
  const generateOverrideOtp = useAdminStore((s) => s.generateOverrideOtp);
  const otpRequestsAll = useAdminStore((s) => s.otpRequests || []);
  const transactions = useAdminStore((s) => s.transactions || []);
  const withdrawals = useAdminStore((s) => s.withdrawals || []);

  // Load Transaction History state actions
  const approveWithdrawal = useAdminStore((s) => s.approveWithdrawal);
  const rejectWithdrawal = useAdminStore((s) => s.rejectWithdrawal);

  // local toast alerts
  const [toast, setToast] = useState(null);
  const [referralListModal, setReferralListModal] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // OTP Override modal state variables
  const [activeOtpRequestId, setActiveOtpRequestId] = useState("");
  const [isOtpOverrideModalOpen, setIsOtpOverrideModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [revealedOtp, setRevealedOtp] = useState(null);
  const [otpError, setOtpError] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);

  // Derive the active OTP request reactively
  const activeOtpReq = otpRequestsAll.find(r => r.id === activeOtpRequestId) || null;

  useEffect(() => {
    if (!isOtpOverrideModalOpen) {
      setAdminPasswordInput("");
      setRevealedOtp(null);
      setOtpError("");
      return;
    }
  }, [isOtpOverrideModalOpen]);

  useEffect(() => {
    let timer;
    if (revealedOtp && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setRevealedOtp(null);
    }
    return () => clearInterval(timer);
  }, [revealedOtp, timeLeft]);

  const handleGenerateOverrideOtp = (e) => {
    e?.preventDefault();
    const res = generateOverrideOtp(activeOtpRequestId);
    if (res.success) {
      const updatedReq = useAdminStore.getState().otpRequests.find(r => r.id === activeOtpRequestId);
      if (updatedReq) {
        setRevealedOtp(updatedReq.rawOtpForAdmin);
        setTimeLeft(Math.max(0, Math.floor((updatedReq.expiresAt - Date.now()) / 1000)));
      }
      setOtpError("");
      showToast("OTP Override generated successfully");
    } else {
      setOtpError(res.error);
    }
  };

  // local Modal controls
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPlan, setNewUserPlan] = useState("Basic");
  const [newUserDeposit, setNewUserDeposit] = useState("0");

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserId, setEditUserId] = useState("");
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPlan, setEditUserPlan] = useState("Basic");
  const [editUserDeposit, setEditUserDeposit] = useState("");
  const [editUserStatus, setEditUserStatus] = useState("Active");

  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [tradePair, setTradePair] = useState("BTC/USDT");
  const [tradeSide, setTradeSide] = useState("BUY");
  const [tradeEntry, setTradeEntry] = useState("");
  const [tradeExit, setTradeExit] = useState("");
  const [tradeDate, setTradeDate] = useState("");
  const [tradeResult, setTradeResult] = useState("WIN");
  const [tradeProfitLoss, setTradeProfitLoss] = useState("");
  const [tradeNotes, setTradeNotes] = useState("");
  const [tradeStatus, setTradeStatus] = useState("published");

  const [isEditTradeOpen, setIsEditTradeOpen] = useState(false);
  const [editTradeId, setEditTradeId] = useState("");
  const [editTradePair, setEditTradePair] = useState("");
  const [editTradeSide, setEditTradeSide] = useState("BUY");
  const [editTradeEntry, setEditTradeEntry] = useState("");
  const [editTradeExit, setEditTradeExit] = useState("");
  const [editTradeDate, setEditTradeDate] = useState("");
  const [editTradeResult, setEditTradeResult] = useState("WIN");
  const [editTradeProfitLoss, setEditTradeProfitLoss] = useState("");
  const [editTradeNotes, setEditTradeNotes] = useState("");
  const [editTradeStatus, setEditTradeStatus] = useState("published");

  const [isCloseTradeOpen, setIsCloseTradeOpen] = useState(false);
  const [activeCloseId, setActiveCloseId] = useState("");
  const [exitPrice, setExitPrice] = useState("");

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [activeRejectId, setActiveRejectId] = useState("");
  const [rejectRemarkText, setRejectRemarkText] = useState("");

  // ADMINS CRUD MODAL STATE
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRole, setAdminRole] = useState("Admin");
  const [adminPermPartners, setAdminPermPartners] = useState(true);
  const [adminPermAdmins, setAdminPermAdmins] = useState(false);
  const [adminPermReports, setAdminPermReports] = useState(true);

  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);
  const [activeAdminId, setActiveAdminId] = useState("");
  const [editAdminName, setEditAdminName] = useState("");
  const [editAdminEmail, setEditAdminEmail] = useState("");
  const [editAdminRole, setEditAdminRole] = useState("Admin");
  const [editAdminStatus, setEditAdminStatus] = useState("Active");
  const [editAdminPermPartners, setEditAdminPermPartners] = useState(true);
  const [editAdminPermAdmins, setEditAdminPermAdmins] = useState(false);
  const [editAdminPermReports, setEditAdminPermReports] = useState(true);

  // PRICING PLANS CRUD MODAL STATE
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planSubtitle, setPlanSubtitle] = useState("");
  const [planCapitalLabel, setPlanCapitalLabel] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planBtnText, setPlanBtnText] = useState("Get Started");
  const [planStatus, setPlanStatus] = useState("Active");
  const [planIsPopular, setPlanIsPopular] = useState(false);

  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [activePlanId, setActivePlanId] = useState("");
  const [editPlanName, setEditPlanName] = useState("");
  const [editPlanSubtitle, setEditPlanSubtitle] = useState("");
  const [editPlanCapitalLabel, setEditPlanCapitalLabel] = useState("");
  const [editPlanDesc, setEditPlanDesc] = useState("");
  const [editPlanFeatures, setEditPlanFeatures] = useState("");
  const [editPlanBtnText, setEditPlanBtnText] = useState("");
  const [editPlanStatus, setEditPlanStatus] = useState("Active");
  const [editPlanIsPopular, setEditPlanIsPopular] = useState(false);

  // NOTIFICATIONS / CAMPAIGNS / REFERRALS MODAL STATE
  const [recordModal, setRecordModal] = useState({ type: null, mode: "add", id: "" });
  const [notificationForm, setNotificationForm] = useState({ audience: "", message: "", channel: "In-app", status: "Draft" });
  const [campaignForm, setCampaignForm] = useState({ name: "", trackingLink: "", users: "0", revenue: "$0", status: "Active" });
  const [referralForm, setReferralForm] = useState({ referrer: "", user: "", deposit: "$0", reward: "$0", status: "Pending" });

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    addUser({
      name: newUserName,
      email: newUserEmail,
      plan: newUserPlan,
      deposit: `$${Number(newUserDeposit).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    });
    setNewUserName("");
    setNewUserEmail("");
    setNewUserDeposit("0");
    setIsAddUserOpen(false);
    showToast("User added successfully");
  };

  const handleEditUserSubmit = (e) => {
    e.preventDefault();
    editUser(editUserId, {
      name: editUserName,
      email: editUserEmail,
      plan: editUserPlan,
      status: editUserStatus,
      deposit: editUserDeposit.startsWith("$") ? editUserDeposit : `$${Number(editUserDeposit).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    });
    setIsEditUserOpen(false);
    showToast("User updated successfully");
  };

  const handleAddTradeSubmit = (e) => {
    e.preventDefault();
    if (!tradePair || !tradeEntry || !tradeExit || !tradeDate || !tradeProfitLoss) return;
    addTrade({
      pair: tradePair,
      side: tradeSide,
      entryPrice: Number(tradeEntry),
      exitPrice: Number(tradeExit),
      tradeDate: tradeDate,
      profitLoss: Number(tradeProfitLoss),
      result: tradeResult,
      notes: tradeNotes,
      status: tradeStatus
    });
    setTradePair("BTC/USDT");
    setTradeSide("BUY");
    setTradeEntry("");
    setTradeExit("");
    setTradeDate("");
    setTradeResult("WIN");
    setTradeProfitLoss("");
    setTradeNotes("");
    setTradeStatus("published");
    setIsAddTradeOpen(false);
    showToast("Trade record added successfully");
  };

  const handleEditTradeSubmit = (e) => {
    e.preventDefault();
    if (!editTradePair || !editTradeEntry || !editTradeExit || !editTradeDate || !editTradeProfitLoss) return;
    editTrade(editTradeId, {
      pair: editTradePair,
      side: editTradeSide,
      entryPrice: Number(editTradeEntry),
      exitPrice: Number(editTradeExit),
      tradeDate: editTradeDate,
      profitLoss: Number(editTradeProfitLoss),
      result: editTradeResult,
      notes: editTradeNotes,
      status: editTradeStatus
    });
    setIsEditTradeOpen(false);
    showToast("Trade record updated successfully");
  };

  const handleCloseTradeSubmit = (e) => {
    e.preventDefault();
    if (!exitPrice) return;
    closeTrade(activeCloseId, exitPrice);
    setExitPrice("");
    setIsCloseTradeOpen(false);
    showToast("Trade signal closed successfully");
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    rejectPayment(activeRejectId, rejectRemarkText);
    setRejectRemarkText("");
    setIsRejectOpen(false);
    showToast("Payment rejected");
  };

  // ADMINS CRUD EVENT HANDLERS
  const handleAddAdminSubmit = (e) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminPassword) return;
    addAdmin({
      name: adminName,
      email: adminEmail,
      role: adminRole,
      permissions: {
        partners: adminPermPartners ? ["view", "create", "edit"] : [],
        admins: adminPermAdmins ? ["view", "create", "edit", "delete"] : [],
        reports: adminPermReports ? ["view"] : []
      }
    });
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setAdminRole("Admin");
    setIsAddAdminOpen(false);
    showToast("Admin account registered!");
  };

  const handleEditAdminSubmit = (e) => {
    e.preventDefault();
    editAdmin(activeAdminId, {
      name: editAdminName,
      email: editAdminEmail,
      role: editAdminRole,
      status: editAdminStatus,
      permissions: {
        partners: editAdminPermPartners ? ["view", "create", "edit"] : [],
        admins: editAdminPermAdmins ? ["view", "create", "edit", "delete"] : [],
        reports: editAdminPermReports ? ["view"] : []
      }
    });
    setIsEditAdminOpen(false);
    showToast("Operator account updated!");
  };

  const handleEditAdminClick = (id) => {
    const adminObj = admins.find(a => a.id === id);
    if (adminObj) {
      setActiveAdminId(id);
      setEditAdminName(adminObj.name);
      setEditAdminEmail(adminObj.email);
      setEditAdminRole(adminObj.role);
      setEditAdminStatus(adminObj.status);
      setEditAdminPermPartners(adminObj.permissions.partners?.length > 0);
      setEditAdminPermAdmins(adminObj.permissions.admins?.length > 0);
      setEditAdminPermReports(adminObj.permissions.reports?.length > 0);
      setIsEditAdminOpen(true);
    }
  };

  const parsePlanFeatures = (value) =>
    value
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

  const resetAddPlanForm = () => {
    setPlanName("");
    setPlanSubtitle("");
    setPlanCapitalLabel("");
    setPlanDesc("");
    setPlanFeatures("");
    setPlanBtnText("Get Started");
    setPlanStatus("Active");
    setPlanIsPopular(false);
  };

  const handleAddPlanSubmit = (e) => {
    e.preventDefault();
    if (!planName || !planSubtitle || !planCapitalLabel || !planDesc) return;
    addPlan({
      name: planName,
      subtitle: planSubtitle,
      capitalLabel: planCapitalLabel,
      desc: planDesc,
      features: parsePlanFeatures(planFeatures),
      btnText: planBtnText,
      status: planStatus,
      isPopular: planIsPopular
    });
    resetAddPlanForm();
    setIsAddPlanOpen(false);
    showToast("Pricing plan added successfully");
  };

  const handleEditPlanClick = (id) => {
    const planObj = plans.find((p) => p.id === id);
    if (!planObj) return;
    setActivePlanId(id);
    setEditPlanName(planObj.name);
    setEditPlanSubtitle(planObj.subtitle);
    setEditPlanCapitalLabel(planObj.capitalLabel);
    setEditPlanDesc(planObj.desc);
    setEditPlanFeatures((planObj.features || []).join("\n"));
    setEditPlanBtnText(planObj.btnText || "Get Started");
    setEditPlanStatus(planObj.status || "Active");
    setEditPlanIsPopular(Boolean(planObj.isPopular));
    setIsEditPlanOpen(true);
  };

  const handleEditPlanSubmit = (e) => {
    e.preventDefault();
    editPlan(activePlanId, {
      name: editPlanName,
      subtitle: editPlanSubtitle,
      capitalLabel: editPlanCapitalLabel,
      desc: editPlanDesc,
      features: parsePlanFeatures(editPlanFeatures),
      btnText: editPlanBtnText,
      status: editPlanStatus,
      isPopular: editPlanIsPopular
    });
    setIsEditPlanOpen(false);
    showToast("Pricing plan updated successfully");
  };

  const resetRecordForms = () => {
    setNotificationForm({ audience: "", message: "", channel: "In-app", status: "Draft" });
    setCampaignForm({ name: "", trackingLink: "", users: "0", revenue: "$0", status: "Active" });
    setReferralForm({ referrer: "", user: "", deposit: "$0", reward: "$0", status: "Pending" });
  };

  const openRecordModal = (type, mode, id = "") => {
    setRecordModal({ type, mode, id });
    if (type === "notifications") {
      const item = notifications.find((n) => n.id === id);
      setNotificationForm(item ? { ...item } : { audience: "", message: "", channel: "In-app", status: "Draft" });
    }
    if (type === "campaigns") {
      const item = campaigns.find((c) => c.id === id);
      setCampaignForm(item ? { ...item, users: String(item.users) } : { name: "", trackingLink: "", users: "0", revenue: "$0", status: "Active" });
    }
    if (type === "referrals") {
      const item = referrals.find((r) => r.id === id);
      setReferralForm(item ? { ...item } : { referrer: "", user: "", deposit: "$0", reward: "$0", status: "Pending" });
    }
  };

  const closeRecordModal = () => {
    setRecordModal({ type: null, mode: "add", id: "" });
    resetRecordForms();
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    const { type, mode, id } = recordModal;
    if (type === "notifications") {
      if (!notificationForm.audience || !notificationForm.message) return;
      if (mode === "edit") editNotification(id, notificationForm);
      else addNotification(notificationForm);
      showToast(mode === "edit" ? "Notification updated" : "Notification added");
    }
    if (type === "campaigns") {
      if (!campaignForm.name || !campaignForm.trackingLink) return;
      const payload = { ...campaignForm, users: Number(campaignForm.users || 0) };
      if (mode === "edit") editCampaign(id, payload);
      else addCampaign(payload);
      showToast(mode === "edit" ? "Campaign updated" : "Campaign added");
    }
    if (type === "referrals") {
      if (!referralForm.referrer || !referralForm.user) return;
      if (mode === "edit") editReferral(id, referralForm);
      else addReferral(referralForm);
      showToast(mode === "edit" ? "Referral updated" : "Referral added");
    }
    closeRecordModal();
  };

  const handleRecordDelete = (sectionType, id) => {
    if (sectionType === "notifications") {
      deleteNotification(id);
      showToast("Notification deleted");
    } else if (sectionType === "campaigns") {
      deleteCampaign(id);
      showToast("Campaign deleted");
    } else if (sectionType === "referrals") {
      deleteReferral(id);
      showToast("Referral deleted");
    }
  };

  if (sectionKey && !hasPermission(section?.permissionKey || sectionKey, "view")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-red-500/20 bg-red-500/5 text-center p-6">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-white">Access Denied</h3>
        <p className="mt-2 text-sm text-neutral-400 max-w-md">
          You do not have the required permissions to view the <strong>{section?.title || sectionKey}</strong> section. 
          Please contact a Super Admin if you believe this is an error.
        </p>
        <Link href="/admin/dashboard" className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-white/[0.08] px-4 text-xs font-bold text-white hover:bg-white/[0.15] transition">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Toast Alert */}
      {toast && (
        <div className="fixed right-5 top-24 z-50 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300 shadow-2xl backdrop-blur-xl animate-fade-in">
          {toast.message}
        </div>
      )}

      {/* Dynamic Content Routing */}
      {section ? (
        <AdminSectionPage 
          section={section} 
          activeFilter={filterKey || "All"} 
          referralListModal={referralListModal}
          setReferralListModal={setReferralListModal}
          onPublish={(id) => { publishTrade(id); showToast("Trade record published"); }}
          onUnpublish={(id) => { unpublishTrade(id); showToast("Trade record unpublished"); }}
          onView={(id) => {
            if (["notifications", "campaigns", "referrals"].includes(section.permissionKey)) {
              openRecordModal(section.permissionKey, "view", id);
            } else if (section.permissionKey === "users") {
              window.location.href = `/admin/users/${id}`;
            } else if (section.title === "Transaction History" || section.title === "Withdrawal Requests") {
              openRecordModal("withdrawals", "view", id);
            }
          }}
          onVerify={(id) => { verifyPayment(id); showToast("Payment verified details"); }}
          onApprove={(id) => {
            if (section.title === "Transaction History" || section.title === "Withdrawal Requests") {
              approveWithdrawal(id);
              showToast("Withdrawal approved successfully");
            } else {
              approvePayment(id);
              showToast("Payment approved & plan activated");
            }
          }}
          onReject={(id) => {
            if (section.title === "Transaction History" || section.title === "Withdrawal Requests") {
              rejectWithdrawal(id);
              showToast("Withdrawal request rejected");
            } else {
              setActiveRejectId(id);
              setIsRejectOpen(true);
            }
          }}
          onBlock={(id) => { blockUser(id); showToast("User status updated"); }}
          onDelete={(id) => {
            if (section.permissionKey === "trades") {
              deleteTrade(id);
              showToast("Trade record deleted");
            } else if (section.permissionKey === "admins") {
              deleteAdmin(id);
              showToast("Admin account deactivated");
            } else if (section.permissionKey === "otp") {
              rejectOtpRequest(id);
              showToast("OTP Override request rejected");
            } else if (section.permissionKey === "plans") {
              deletePlan(id);
              showToast("Pricing plan deleted");
            } else if (["notifications", "campaigns", "referrals"].includes(section.permissionKey)) {
              handleRecordDelete(section.permissionKey, id);
            } else {
              deleteUser(id);
              showToast("User marked inactive");
            }
          }}
          onEdit={(id) => {
            if (section.permissionKey === "trades") {
              const trade = trades.find((t) => t.id === id);
              if (trade) {
                setEditTradeId(id);
                setEditTradePair(trade.pair);
                setEditTradeSide(trade.side);
                setEditTradeEntry(String(trade.entryPrice));
                setEditTradeExit(String(trade.exitPrice));
                setEditTradeDate(trade.tradeDate ? new Date(trade.tradeDate).toISOString().slice(0, 10) : "");
                setEditTradeResult(trade.result);
                setEditTradeProfitLoss(String(trade.profitLoss));
                setEditTradeNotes(trade.notes || "");
                setEditTradeStatus(trade.status || "published");
                setIsEditTradeOpen(true);
              }
            } else if (section.permissionKey === "admins") {
              handleEditAdminClick(id);
            } else if (section.permissionKey === "otp") {
              setActiveOtpRequestId(id);
              setIsOtpOverrideModalOpen(true);
            } else if (section.permissionKey === "plans") {
              handleEditPlanClick(id);
            } else if (["notifications", "campaigns", "referrals"].includes(section.permissionKey)) {
              openRecordModal(section.permissionKey, "edit", id);
            } else {
              const user = users.find((u) => u.id === id);
              if (user) {
                setEditUserId(id);
                setEditUserName(user.name);
                setEditUserEmail(user.email);
                setEditUserPlan(user.plan);
                setEditUserDeposit(user.deposit);
                setEditUserStatus(user.status);
                setIsEditUserOpen(true);
              }
            }
          }}
          onCloseTrade={(id) => {
            setActiveCloseId(id);
            setIsCloseTradeOpen(true);
          }}
          onAddClick={() => {
            if (section.permissionKey === "users") setIsAddUserOpen(true);
            if (section.permissionKey === "trades") setIsAddTradeOpen(true);
            if (section.permissionKey === "admins") setIsAddAdminOpen(true);
            if (section.permissionKey === "plans") setIsAddPlanOpen(true);
            if (["notifications", "campaigns", "referrals"].includes(section.permissionKey)) openRecordModal(section.permissionKey, "add");
          }}
          activeSettings={settings}
          onSaveSettings={(data) => {
            updateSettings(data);
            showToast("Settings saved successfully");
          }}
        />
      ) : (
        <PlatformOverview 
          onVerify={(id) => { verifyPayment(id); showToast("Payment verified details"); }}
          onApprove={(id) => { approvePayment(id); showToast("Payment approved & plan activated"); }}
          onReject={(id) => { setActiveRejectId(id); setIsRejectOpen(true); }}
        />
      )}

      {/* ADD USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddUserSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Create New User</h3>
              <button type="button" onClick={() => setIsAddUserOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Name</span>
              <input type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Full name" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Email</span>
              <input type="email" required value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="User email" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Initial Deposit ($)</span>
                <input type="number" value={newUserDeposit} onChange={(e) => setNewUserDeposit(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Plan</span>
                <select value={newUserPlan} onChange={(e) => setNewUserPlan(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="None">None</option>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Pro">Pro</option>
                  <option value="VIP">VIP</option>
                </select>
              </label>
            </div>
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Add User
            </button>
          </form>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditUserSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Edit User Profile</h3>
              <button type="button" onClick={() => setIsEditUserOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Name</span>
              <input type="text" required value={editUserName} onChange={(e) => setEditUserName(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Email</span>
              <input type="email" required value={editUserEmail} onChange={(e) => setEditUserEmail(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Deposit Balance ($)</span>
                <input type="text" value={editUserDeposit} onChange={(e) => setEditUserDeposit(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Plan</span>
                <select value={editUserPlan} onChange={(e) => setEditUserPlan(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="None">None</option>
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Pro">Pro</option>
                  <option value="VIP">VIP</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
              <select value={editUserStatus} onChange={(e) => setEditUserStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                <option value="New">New</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
                <option value="Expired">Expired</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Save Updates
            </button>
          </form>
        </div>
      )}

      {/* ADD TRADE RECORD MODAL */}
      {isAddTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddTradeSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Create Historical Trade Record</h3>
              <button type="button" onClick={() => setIsAddTradeOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Pair</span>
                <input type="text" required value={tradePair} onChange={(e) => setTradePair(e.target.value)} placeholder="EUR/USD" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Side</span>
                <select value={tradeSide} onChange={(e) => setTradeSide(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Entry Price</span>
                <input type="number" step="any" required value={tradeEntry} onChange={(e) => setTradeEntry(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Exit Price</span>
                <input type="number" step="any" required value={tradeExit} onChange={(e) => setTradeExit(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Result</span>
                <select value={tradeResult} onChange={(e) => setTradeResult(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="REFUND">REFUND</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Profit/Loss (P/L)</span>
                <input type="number" step="any" required value={tradeProfitLoss} onChange={(e) => setTradeProfitLoss(e.target.value)} placeholder="e.g. 780 or -250" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Trade Date</span>
                <input type="date" required value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                <select value={tradeStatus} onChange={(e) => setTradeStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Notes</span>
              <textarea value={tradeNotes} onChange={(e) => setTradeNotes(e.target.value)} placeholder="Add transaction notes..." className="h-20 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Add Trade Record
            </button>
          </form>
        </div>
      )}

      {/* EDIT TRADE RECORD MODAL */}
      {isEditTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditTradeSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Edit Historical Trade Record</h3>
              <button type="button" onClick={() => setIsEditTradeOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Pair</span>
                <input type="text" required value={editTradePair} onChange={(e) => setEditTradePair(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Side</span>
                <select value={editTradeSide} onChange={(e) => setEditTradeSide(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Entry Price</span>
                <input type="number" step="any" required value={editTradeEntry} onChange={(e) => setEditTradeEntry(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Exit Price</span>
                <input type="number" step="any" required value={editTradeExit} onChange={(e) => setEditTradeExit(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Result</span>
                <select value={editTradeResult} onChange={(e) => setEditTradeResult(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="REFUND">REFUND</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Profit/Loss (P/L)</span>
                <input type="number" step="any" required value={editTradeProfitLoss} onChange={(e) => setEditTradeProfitLoss(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Trade Date</span>
                <input type="date" required value={editTradeDate} onChange={(e) => setEditTradeDate(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                <select value={editTradeStatus} onChange={(e) => setEditTradeStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Notes</span>
              <textarea value={editTradeNotes} onChange={(e) => setEditTradeNotes(e.target.value)} placeholder="Add transaction notes..." className="h-20 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsEditTradeOpen(false)} className="flex-1 h-11 rounded-lg border border-white/[0.08] bg-white/[0.025] text-neutral-300 font-bold text-sm hover:bg-white/[0.08] transition">
                Cancel
              </button>
              <button type="submit" className="flex-1 h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REJECT PAYMENT MODAL */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleRejectSubmit} className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Reject Payment</h3>
              <button type="button" onClick={() => setIsRejectOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Rejection Remark</span>
              <textarea required value={rejectRemarkText} onChange={(e) => setRejectRemarkText(e.target.value)} placeholder="e.g. UTR mismatched..." className="h-24 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <button type="submit" className="w-full h-11 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-400 transition mt-2">
              Confirm Rejection
            </button>
          </form>
        </div>
      )}

      {/* ADD ADMIN OPERATOR MODAL */}
      {isAddAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddAdminSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Register Admin Account</h3>
              <button type="button" onClick={() => setIsAddAdminOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Name</span>
              <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Operator name" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Email</span>
              <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="name@nexus.com" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Password</span>
              <input type="password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Temporary password" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">System Role</span>
              <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                <option value="Admin">Admin Operator</option>
                <option value="Manager">Manager</option>
                <option value="Support">Support Staff</option>
              </select>
            </label>
            
            {/* Permission checklist */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-green-300">Section Permissions</span>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.01] p-2 text-xs text-neutral-300 hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={adminPermPartners} onChange={(e) => setAdminPermPartners(e.target.checked)} className="accent-green-500" />
                  Partners
                </label>
                <label className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.01] p-2 text-xs text-neutral-300 hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={adminPermAdmins} onChange={(e) => setAdminPermAdmins(e.target.checked)} className="accent-green-500" />
                  Admins
                </label>
                <label className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.01] p-2 text-xs text-neutral-300 hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={adminPermReports} onChange={(e) => setAdminPermReports(e.target.checked)} className="accent-green-500" />
                  Reports
                </label>
              </div>
            </div>
            
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Onboard Admin
            </button>
          </form>
        </div>
      )}

      {/* EDIT ADMIN OPERATOR MODAL */}
      {isEditAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditAdminSubmit} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Edit Admin Operator</h3>
              <button type="button" onClick={() => setIsEditAdminOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Name</span>
              <input type="text" required value={editAdminName} onChange={(e) => setEditAdminName(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Email</span>
              <input type="email" required value={editAdminEmail} onChange={(e) => setEditAdminEmail(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">System Role</span>
                <select value={editAdminRole} onChange={(e) => setEditAdminRole(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin Operator</option>
                  <option value="Manager">Manager</option>
                  <option value="Support">Support Staff</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                <select value={editAdminStatus} onChange={(e) => setEditAdminStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
            </div>
            
            {/* Permission checklist */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-green-300">Section Permissions</span>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.01] p-2 text-xs text-neutral-300 hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={editAdminPermPartners} onChange={(e) => setEditAdminPermPartners(e.target.checked)} className="accent-green-500" />
                  Partners
                </label>
                <label className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.01] p-2 text-xs text-neutral-300 hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={editAdminPermAdmins} onChange={(e) => setEditAdminPermAdmins(e.target.checked)} className="accent-green-500" />
                  Admins
                </label>
                <label className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.01] p-2 text-xs text-neutral-300 hover:bg-white/[0.03] cursor-pointer">
                  <input type="checkbox" checked={editAdminPermReports} onChange={(e) => setEditAdminPermReports(e.target.checked)} className="accent-green-500" />
                  Reports
                </label>
              </div>
            </div>
            
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Save Operator configs
            </button>
          </form>
        </div>
      )}

      {/* NOTIFICATIONS / CAMPAIGNS / REFERRALS MODAL */}
      {recordModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleRecordSubmit} className="w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">
                {recordModal.mode === "view" ? "View" : recordModal.mode === "edit" ? "Edit" : "Add"}{" "}
                {recordModal.type === "notifications" ? "Notification" : recordModal.type === "campaigns" ? "Campaign" : "Referral"}
              </h3>
              <button type="button" onClick={closeRecordModal} className="text-neutral-400 hover:text-white">X</button>
            </div>

            {recordModal.type === "notifications" && (
              <>
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Audience</span>
                  <input type="text" required disabled={recordModal.mode === "view"} value={notificationForm.audience} onChange={(e) => setNotificationForm({ ...notificationForm, audience: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Message</span>
                  <textarea required disabled={recordModal.mode === "view"} value={notificationForm.message} onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })} className="h-28 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none disabled:text-neutral-500" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Channel</span>
                    <select disabled={recordModal.mode === "view"} value={notificationForm.channel} onChange={(e) => setNotificationForm({ ...notificationForm, channel: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500">
                      <option value="In-app">In-app</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="Push">Push</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                    <select disabled={recordModal.mode === "view"} value={notificationForm.status} onChange={(e) => setNotificationForm({ ...notificationForm, status: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500">
                      <option value="Draft">Draft</option>
                      <option value="Queued">Queued</option>
                      <option value="Sent">Sent</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {recordModal.type === "campaigns" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Campaign</span>
                    <input type="text" required disabled={recordModal.mode === "view"} value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                    <select disabled={recordModal.mode === "view"} value={campaignForm.status} onChange={(e) => setCampaignForm({ ...campaignForm, status: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500">
                      <option value="Active">Active</option>
                      <option value="Paused">Paused</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-400 mb-2">Tracking Link</span>
                  <input type="text" required disabled={recordModal.mode === "view"} value={campaignForm.trackingLink} onChange={(e) => setCampaignForm({ ...campaignForm, trackingLink: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Users</span>
                    <input type="number" disabled={recordModal.mode === "view"} value={campaignForm.users} onChange={(e) => setCampaignForm({ ...campaignForm, users: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Revenue</span>
                    <input type="text" disabled={recordModal.mode === "view"} value={campaignForm.revenue} onChange={(e) => setCampaignForm({ ...campaignForm, revenue: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                </div>
              </>
            )}

            {recordModal.type === "referrals" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Referrer</span>
                    <input type="text" required disabled={recordModal.mode === "view"} value={referralForm.referrer} onChange={(e) => setReferralForm({ ...referralForm, referrer: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">User</span>
                    <input type="text" required disabled={recordModal.mode === "view"} value={referralForm.user} onChange={(e) => setReferralForm({ ...referralForm, user: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Deposit</span>
                    <input type="text" disabled={recordModal.mode === "view"} value={referralForm.deposit} onChange={(e) => setReferralForm({ ...referralForm, deposit: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Reward</span>
                    <input type="text" disabled={recordModal.mode === "view"} value={referralForm.reward} onChange={(e) => setReferralForm({ ...referralForm, reward: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                    <select disabled={recordModal.mode === "view"} value={referralForm.status} onChange={(e) => setReferralForm({ ...referralForm, status: e.target.value })} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50 disabled:text-neutral-500">
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {recordModal.type === "withdrawals" && (() => {
              const withdrawal = withdrawals.find(w => w.id === recordModal.id) || transactions.find(t => t.id === recordModal.id);
              if (!withdrawal) return <p className="text-neutral-400">Withdrawal details not found.</p>;
              
              let detailsStr = "";
              if (withdrawal.accountDetails) {
                if (typeof withdrawal.accountDetails === "object") {
                  detailsStr = Object.entries(withdrawal.accountDetails)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n");
                } else {
                  try {
                    const parsed = JSON.parse(withdrawal.accountDetails);
                    detailsStr = Object.entries(parsed)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join("\n");
                  } catch {
                    detailsStr = String(withdrawal.accountDetails);
                  }
                }
              }

              return (
                <div className="space-y-5 text-sm text-neutral-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Withdrawal ID</p>
                      <p className="font-mono text-base font-bold text-white mt-1">{withdrawal.withdrawalId || withdrawal.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Status</p>
                      <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold mt-1.5 ${
                        withdrawal.status === "Approved" || withdrawal.status === "Completed" ? "bg-green-500/10 text-green-300 border border-green-500/20" :
                        withdrawal.status === "Pending" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                        withdrawal.status === "Processing" ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" :
                        "bg-red-500/10 text-red-300 border border-red-500/20"
                      }`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-3">
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">User Name</p>
                      <p className="font-semibold text-white mt-1">{withdrawal.userName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">User Email</p>
                      <p className="font-semibold text-white mt-1">{withdrawal.userEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Current Equity</p>
                      <p className="font-mono text-white mt-1">₹{Number(withdrawal.currentEquity || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Available Balance</p>
                      <p className="font-mono text-white mt-1">₹{Number(withdrawal.availableBalance || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Pending Reserved</p>
                      <p className="font-mono text-white mt-1">₹{Number(withdrawal.pendingWithdrawals || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-3">
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Requested Amount</p>
                      <p className="font-mono text-lg font-bold text-red-300 mt-1">₹{Number(withdrawal.rawAmount || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Method</p>
                      <p className="text-white font-medium mt-1">{withdrawal.method}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3 space-y-3">
                    <div>
                      <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Account Details</p>
                      <p className="bg-black/20 p-3 rounded-lg font-mono text-white text-xs mt-1.5 border border-white/[0.06] break-all leading-relaxed whitespace-pre-wrap">{detailsStr || "N/A"}</p>
                    </div>
                    {withdrawal.notes && (
                      <div>
                        <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Notes</p>
                        <p className="bg-black/20 p-3 rounded-lg text-white text-xs mt-1.5 border border-white/[0.06]">{withdrawal.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-3 text-xs text-neutral-500">
                    <div>
                      <p className="font-semibold uppercase tracking-wider">Requested At</p>
                      <p className="mt-1">{withdrawal.requestedAt ? new Date(withdrawal.requestedAt).toLocaleString() : withdrawal.date}</p>
                    </div>
                    <div>
                      <p className="font-semibold uppercase tracking-wider">Processed At</p>
                      <p className="mt-1">{withdrawal.processedAt ? new Date(withdrawal.processedAt).toLocaleString() : "Pending review"}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t border-white/[0.08] pt-4 mt-6">
                    <button
                      type="button"
                      onClick={closeRecordModal}
                      className="flex-1 h-11 rounded-lg border border-white/[0.08] bg-white/[0.025] text-neutral-300 font-bold text-sm hover:bg-white/[0.08] transition"
                    >
                      Close Details
                    </button>
                    {withdrawal.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await approveWithdrawal(withdrawal.id);
                            closeRecordModal();
                          }}
                          className="flex-1 h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition"
                        >
                          Approve Withdrawal
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await rejectWithdrawal(withdrawal.id);
                            closeRecordModal();
                          }}
                          className="flex-1 h-11 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-400 transition"
                        >
                          Reject Withdrawal
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {recordModal.type !== "withdrawals" && (
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeRecordModal} className="flex-1 h-11 rounded-lg border border-white/[0.08] bg-white/[0.025] text-neutral-300 font-bold text-sm hover:bg-white/[0.08] transition">
                  {recordModal.mode === "view" ? "Close" : "Cancel"}
                </button>
                {recordModal.mode !== "view" && (
                  <button type="submit" className="flex-1 h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition">
                    {recordModal.mode === "edit" ? "Save" : "Add"}
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Referral list modal (show all users referred by a referrer) */}
      {referralListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0b141b] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Referrals by {referralListModal}</h3>
              <button type="button" onClick={() => setReferralListModal(null)} className="text-neutral-400 hover:text-white">✕</button>
            </div>
            <div className="mt-4">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-neutral-500 uppercase">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Referred User</th>
                    <th className="px-3 py-2 font-semibold">Deposit</th>
                    <th className="px-3 py-2 font-semibold">Reward</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referrals.filter(r => r.referrer === referralListModal).map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-3 text-white font-semibold">{r.user}</td>
                      <td className="px-3 py-3 text-neutral-300">{r.deposit}</td>
                      <td className="px-3 py-3 text-neutral-300">{r.reward}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${r.status === 'Paid' ? 'bg-green-500/10 text-green-300' : r.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-300' : 'bg-red-500/10 text-red-300'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                  {referrals.filter(r => r.referrer === referralListModal).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-neutral-500">No referrals found for this user.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <button type="button" onClick={() => setReferralListModal(null)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 text-sm font-bold text-white">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRICING PLAN MODAL */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleAddPlanSubmit} className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Create Pricing Plan</h3>
              <button type="button" onClick={() => setIsAddPlanOpen(false)} className="text-neutral-400 hover:text-white">X</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Plan Name</span>
                <input type="text" required value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Club Plan" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Subtitle</span>
                <input type="text" required value={planSubtitle} onChange={(e) => setPlanSubtitle(e.target.value)} placeholder="Micro Capital" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-1">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Capital Limit</span>
                <input type="text" required value={planCapitalLabel} onChange={(e) => setPlanCapitalLabel(e.target.value)} placeholder="$10 - $100" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block sm:col-span-1">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Button Text</span>
                <input type="text" value={planBtnText} onChange={(e) => setPlanBtnText(e.target.value)} placeholder="Get Started" className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block sm:col-span-1">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                <select value={planStatus} onChange={(e) => setPlanStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Hidden">Hidden</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Description</span>
              <textarea required value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Describe who this plan is for." className="h-24 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Features</span>
              <textarea value={planFeatures} onChange={(e) => setPlanFeatures(e.target.value)} placeholder={"5% fee on profits\nBeginner-friendly setup\n24/7 automated execution"} className="h-32 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.015] p-3 text-sm font-semibold text-neutral-300">
              Mark as popular
              <input type="checkbox" checked={planIsPopular} onChange={(e) => setPlanIsPopular(e.target.checked)} className="accent-green-500" />
            </label>
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Add Plan
            </button>
          </form>
        </div>
      )}

      {/* EDIT PRICING PLAN MODAL */}
      {isEditPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleEditPlanSubmit} className="w-full max-w-2xl rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white">Edit Pricing Plan</h3>
              <button type="button" onClick={() => setIsEditPlanOpen(false)} className="text-neutral-400 hover:text-white">X</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Plan Name</span>
                <input type="text" required value={editPlanName} onChange={(e) => setEditPlanName(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Subtitle</span>
                <input type="text" required value={editPlanSubtitle} onChange={(e) => setEditPlanSubtitle(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Capital Limit</span>
                <input type="text" required value={editPlanCapitalLabel} onChange={(e) => setEditPlanCapitalLabel(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Button Text</span>
                <input type="text" value={editPlanBtnText} onChange={(e) => setEditPlanBtnText(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-black/10 px-3 text-sm text-white outline-none focus:border-green-500/50" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-400 mb-2">Status</span>
                <select value={editPlanStatus} onChange={(e) => setEditPlanStatus(e.target.value)} className="h-11 w-full rounded-lg border border-white/[0.08] bg-[#0b141b] px-3 text-sm text-white outline-none focus:border-green-500/50">
                  <option value="Active">Active</option>
                  <option value="Hidden">Hidden</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Description</span>
              <textarea required value={editPlanDesc} onChange={(e) => setEditPlanDesc(e.target.value)} className="h-24 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-neutral-400 mb-2">Features</span>
              <textarea value={editPlanFeatures} onChange={(e) => setEditPlanFeatures(e.target.value)} className="h-32 w-full rounded-lg border border-white/[0.08] bg-black/10 p-3 text-sm text-white outline-none focus:border-green-500/50 resize-none" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.015] p-3 text-sm font-semibold text-neutral-300">
              Mark as popular
              <input type="checkbox" checked={editPlanIsPopular} onChange={(e) => setEditPlanIsPopular(e.target.checked)} className="accent-green-500" />
            </label>
            <button type="submit" className="w-full h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition mt-2">
              Save Plan
            </button>
          </form>
        </div>
      )}

      {/* OTP OVERRIDE MODAL */}
      {isOtpOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0b141b] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                Secure OTP Override
              </h3>
              <button type="button" onClick={() => setIsOtpOverrideModalOpen(false)} className="text-neutral-400 hover:text-white">✕</button>
            </div>

            {!activeOtpReq ? (
              <p className="text-sm text-neutral-400 py-4 text-center">Request details not found.</p>
            ) : (
              <div className="space-y-4">
                {/* User Profile Info */}
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-semibold">User Name:</span>
                    <span className="text-white font-bold">{activeOtpReq.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-semibold">Email:</span>
                    <span className="text-white font-bold select-all">{activeOtpReq.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-semibold">Type:</span>
                    <span className="text-white font-bold uppercase">{activeOtpReq.type}</span>
                  </div>
                  {activeOtpReq.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-semibold">Amount:</span>
                      <span className="text-red-400 font-bold font-mono">₹{activeOtpReq.amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500 font-semibold">Risk Flag:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      activeOtpReq.riskFlag === "HIGH" ? "bg-red-500/10 text-red-300 border border-red-500/20" :
                      activeOtpReq.riskFlag === "MEDIUM" ? "bg-yellow-500/10 text-yellow-300 border border-yellow-500/20" :
                      "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    }`}>{activeOtpReq.riskFlag}</span>
                  </div>
                  <div className="border-t border-white/[0.04] pt-2 mt-2 space-y-1 text-neutral-500 font-semibold">
                    <p>💻 Device: {activeOtpReq.device}</p>
                    <p>🕒 Last Login: {activeOtpReq.lastLogin}</p>
                    <p>💳 Last Transaction: {activeOtpReq.lastTx}</p>
                  </div>
                </div>

                {revealedOtp ? (
                  <div className="text-center space-y-4 py-2">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Generated Security Code</p>
                    <div className="flex justify-center gap-2">
                      {String(revealedOtp).split("").map((digit, i) => (
                        <span key={i} className="flex h-12 w-10 items-center justify-center rounded-lg border border-green-500/35 bg-green-500/5 text-xl font-bold text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.15)] font-mono">
                          {digit}
                        </span>
                      ))}
                    </div>
                    <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3 text-left">
                      <p className="text-xs text-yellow-300 leading-relaxed font-semibold">
                        ⚠️ <strong>Security Notice:</strong> Convey this 6-digit code to the user. It is valid for <span className="font-mono text-white">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>. After expiration, a new request is required.
                      </p>
                    </div>
                    <button type="button" onClick={() => setIsOtpOverrideModalOpen(false)} className="w-full h-11 rounded-lg bg-white/[0.08] text-white font-bold text-sm hover:bg-white/[0.15] transition">
                      Done / Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleGenerateOverrideOtp} className="space-y-4">
                    <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                      <p className="text-xs text-yellow-300 leading-relaxed font-semibold">
                        🛡️ <strong>Manual OTP Override:</strong> Generating an override will create a secure, temporary one-time passcode for this request. Bypasses standard SMS/Email delivery systems.
                      </p>
                    </div>
                    <p className="text-sm text-neutral-300">
                      Confirm you wish to generate an override passcode for <strong>{activeOtpReq?.userName}</strong>.
                    </p>
                    {otpError && (
                      <p className="text-xs text-red-400 font-bold bg-red-500/5 border border-red-500/20 rounded-lg p-2">{otpError}</p>
                    )}
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setIsOtpOverrideModalOpen(false)} className="flex-1 h-11 rounded-lg border border-white/[0.08] bg-white/[0.025] text-neutral-400 font-bold text-sm hover:bg-white/[0.08] transition">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 h-11 rounded-lg bg-green-500 text-black font-bold text-sm hover:bg-green-400 transition">
                        Generate OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
