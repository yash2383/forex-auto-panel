import {
  Activity,
  Bell,
  Bot,
  ChartNoAxesCombined,
  ClipboardList,
  CreditCard,
  Crown,
  DollarSign,
  Home,
  LineChart,
  Megaphone,
  PieChart,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  History,
  Wallet as WalletIcon,
  KeyRound,
} from "lucide-react";

export const adminNavGroups = [
  {
    title: "Management",
    items: [
      { icon: Home, label: "Dashboard", href: "/admin/dashboard" },
      { icon: Users, label: "Users", href: "/admin/dashboard?section=users" },
      { icon: CreditCard, label: "Payments", href: "/admin/dashboard?section=payments" },
      { icon: CreditCard, label: "Initiated Payments", href: "/admin/initiated-payments" },
      { icon: WalletIcon, label: "Withdraw Requests", href: "/admin/withdrawals" },
      { icon: History, label: "All Transactions", href: "/admin/dashboard?section=transactions&filter=All" },
      { icon: Bot, label: "Trades", href: "/admin/dashboard?section=trades" },
      { icon: LineChart, label: "PnL Reports", href: "/admin/dashboard?section=pnl-reports" },
      { icon: DollarSign, label: "Profit Distribution", href: "/admin/profit-distribution" },
    ],
  },
  {
    title: "Communication",
    items: [
      { icon: Bell, label: "Notification Management", href: "/admin/notifications" },
      { icon: Megaphone, label: "Campaigns", href: "/admin/dashboard?section=campaigns" },
      { icon: PieChart, label: "Referrals", href: "/admin/dashboard?section=referrals" },
      { icon: ClipboardList, label: "Inquiries", href: "/admin/inquiries" },
    ],
  },
  {
    title: "White Label",
    items: [
      { icon: ClipboardList, label: "All Partners", href: "/admin/white-label" },
      { icon: Users, label: "Create Partner", href: "/admin/white-label/create" },
      { icon: DollarSign, label: "Earnings", href: "/admin/white-label/earnings" },
    ],
  },
  {
    title: "Administration",
    items: [
      { icon: UserCog, label: "Admins", href: "/admin/dashboard?section=admins" },
      { icon: ChartNoAxesCombined, label: "Reports", href: "/admin/dashboard?section=reports" },
      { icon: Settings, label: "Settings", href: "/admin/dashboard?section=settings" },
      { icon: Crown, label: "Pricing Plans", href: "/admin/dashboard?section=plans" },
    ],
  },
];

export const adminPermissionMatrix = {
  dashboard: {
    module: "Dashboard",
    scope: "Only analytics and read-only platform health.",
    permissions: { view: "Yes", add: "No", edit: "No", delete: "No" },
    actions: ["View analytics", "Monitor platform metrics", "Review pending activity"],
    safety: "No mutation actions on dashboard data.",
  },
  users: {
    module: "Users",
    scope: "Manual user creation, plan assignment, and access control.",
    permissions: { view: "Yes", add: "Yes", edit: "Yes", delete: "Soft delete" },
    actions: ["Add user", "Edit name", "Edit email", "Assign plan", "Block or unblock", "Mark inactive"],
    safety: "Delete is always soft delete to preserve audit history.",
  },
  payments: {
    module: "Payments",
    scope: "Users create payments; admins review status and remarks.",
    permissions: { view: "Yes", add: "No", edit: "Status only", delete: "No" },
    actions: ["Approve payment", "Reject payment", "Add remark", "Review UTR and screenshots"],
    safety: "Payment records cannot be deleted.",
  },
  trades: {
    module: "Trades",
    scope: "Master trade performance records (published/draft).",
    permissions: { view: "Yes", add: "Yes", edit: "Yes", delete: "Yes" },
    actions: ["Add trade record", "Edit trade record", "Delete trade record", "Publish/Unpublish trade record"],
    safety: "Draft trades are only visible to admins; published trades are visible to users.",
  },
  "pnl-reports": {
    module: "PnL Reports",
    scope: "Auto-generated performance reporting.",
    permissions: { view: "Yes", add: "No", edit: "No", delete: "No" },
    actions: ["View PnL", "Analyze user reports", "Export reports"],
    safety: "Reports are generated from trading data and are not manually edited.",
  },
  notifications: {
    module: "Notifications",
    scope: "Broadcast, scheduled, and draft communication.",
    permissions: { view: "Yes", add: "Yes", edit: "Draft only", delete: "Optional" },
    actions: ["Send notification", "Edit draft", "Delete scheduled notification"],
    safety: "Sent notifications are immutable.",
  },
  campaigns: {
    module: "Campaigns",
    scope: "Marketing campaign creation and tracking.",
    permissions: { view: "Yes", add: "Yes", edit: "Yes", delete: "Optional" },
    actions: ["Create campaign", "Edit campaign", "Delete campaign", "Track conversions"],
    safety: "Campaign deletion should preserve historical analytics.",
  },
  referrals: {
    module: "Referrals",
    scope: "Referral settings and referral log review.",
    permissions: { view: "Yes", add: "Auto", edit: "Settings only", delete: "No" },
    actions: ["Change referral percentage", "View referral logs", "Audit payouts"],
    safety: "Referral records are generated automatically.",
  },
  inquiries: {
    module: "Inquiries",
    scope: "Manage user inquiries, contact form entries and update status.",
    permissions: { view: "Yes", add: "No", edit: "Yes (Status)", delete: "No" },
    actions: ["View user inquiries", "Update status (PENDING / RESPONDED / CLOSED)"],
    safety: "Inquiries are stored persistently and cannot be deleted.",
  },
  "all-partners": {
    module: "All Partners",
    scope: "White-label partner directory and status management.",
    permissions: { view: "Yes", add: "Via create", edit: "Yes", delete: "Optional" },
    actions: ["View partners", "Edit partner", "Disable partner", "Open partner profile"],
    safety: "Prefer disable over hard delete for partner accounts.",
  },
  "create-partner": {
    module: "Create Partner",
    scope: "Partner onboarding with branding, domain, and fee setup.",
    permissions: { view: "No", add: "Yes", edit: "No", delete: "No" },
    actions: ["Add new partner", "Configure branding", "Configure domain", "Configure fees"],
    safety: "This route only creates new partners.",
  },
  earnings: {
    module: "Earnings",
    scope: "Auto-calculated revenue and partner commission reporting.",
    permissions: { view: "Yes", add: "No", edit: "No", delete: "No" },
    actions: ["View revenue split", "Review admin earnings", "Export earnings"],
    safety: "Earnings are calculated from transaction data.",
  },
  admins: {
    module: "Admins",
    scope: "Administrator access, roles, and removal.",
    permissions: { view: "Yes", add: "Yes", edit: "Yes", delete: "Yes" },
    actions: ["Add admin", "Edit roles", "Remove admin", "Set permissions"],
    safety: "Admin changes must be activity-logged.",
  },
  reports: {
    module: "Reports",
    scope: "Read-only business reporting and exports.",
    permissions: { view: "Yes", add: "No", edit: "No", delete: "No" },
    actions: ["View reports", "Export Excel", "Export PDF"],
    safety: "Reports are export-only.",
  },
  settings: {
    module: "Settings",
    scope: "Controlled edits to core platform settings.",
    permissions: { view: "Yes", add: "No", edit: "Yes", delete: "No" },
    actions: ["Update referral percentage", "Update UPI ID", "Update QR code", "Update platform fees"],
    safety: "Only listed platform settings are editable.",
  },
  "payment-settings": {
    module: "Payment Settings",
    scope: "UPI, QR code, and payment mode configuration.",
    permissions: { view: "Yes", add: "Yes", edit: "Yes", delete: "Replace only" },
    actions: ["Add UPI ID", "Update QR code", "Change payment method", "Replace old method"],
    safety: "Delete means replace the active payment method, not remove history.",
  },
};

export const adminMetrics = [
  { icon: Users, label: "Total Users", value: "12,648", sub: "18.6% this week", tone: "green" },
  { icon: ShieldCheck, label: "Active Subscriptions", value: "5,892", sub: "14.3% this week", tone: "violet" },
  { icon: CreditCard, label: "Total Revenue", value: "$248,250.75", sub: "23.8% this week", tone: "blue" },
  { icon: ClipboardList, label: "Pending Payments", value: "32", sub: "View payments", tone: "amber" },
  { icon: Bot, label: "Total Trades", value: "18,562", sub: "11.7% this week", tone: "purple" },
  { icon: LineChart, label: "Total PnL", value: "$356,780.45", sub: "31.2% this week", tone: "green" },
];

export const pendingPayments = [
  { id: "#PAY1001", user: "Harsh", email: "harsh@mail.com", initials: "H", plan: "Premium Monthly", amount: "$49.00", utr: "UTR123456", date: "May 25, 2025", time: "10:45 AM", dot: "bg-green-400", status: "Pending" },
  { id: "#PAY1002", user: "Rahul", email: "rahul@mail.com", initials: "R", plan: "Basic Monthly", amount: "$29.00", utr: "UTR987654", date: "May 25, 2025", time: "09:30 AM", dot: "bg-blue-400", status: "Pending" },
  { id: "#PAY1003", user: "Amit", email: "amit@mail.com", initials: "A", plan: "Premium Yearly", amount: "$499.00", utr: "UTR564738", date: "May 24, 2025", time: "08:15 AM", dot: "bg-violet-400", status: "Pending" },
  { id: "#PAY1004", user: "Neha", email: "neha@mail.com", initials: "N", plan: "Basic Monthly", amount: "$29.00", utr: "UTR112233", date: "May 24, 2025", time: "11:20 PM", dot: "bg-blue-400", status: "Pending" },
  { id: "#PAY1005", user: "Priya", email: "priya@mail.com", initials: "P", plan: "Premium Monthly", amount: "$49.00", utr: "UTR778899", date: "May 23, 2025", time: "10:05 PM", dot: "bg-green-400", status: "Pending" },
];

export const recentActivity = [
  { icon: Users, title: "New user registered", text: "john.doe@email.com", time: "2 min ago", tone: "blue" },
  { icon: ShieldCheck, title: "Payment approved", text: "Plan: Premium Monthly", time: "5 min ago", tone: "green" },
  { icon: LineChart, title: "Trade added", text: "EUR/USD", time: "12 min ago", tone: "violet" },
  { icon: Crown, title: "New subscription", text: "Plan: Premium Yearly", time: "15 min ago", tone: "amber" },
  { icon: CreditCard, title: "Payment rejected", text: "Plan: Basic Monthly", time: "20 min ago", tone: "red" },
];

export const quickActions = [
  { icon: Users, title: "Users", text: "Manage all users", action: "View all", tone: "green" },
  { icon: Bell, title: "Notification Center", text: "Broadcasts, analytics & delivery logs", action: "Open", tone: "violet" },
  { icon: Megaphone, title: "Create Campaign", text: "Track users & performance", action: "Create now", tone: "amber" },
  { icon: PieChart, title: "Referral Settings", text: "Manage referral system", action: "Configure", tone: "blue" },
  { icon: ClipboardList, title: "White Label", text: "Manage clients & branding", action: "Manage", tone: "pink" },
  { icon: ChartNoAxesCombined, title: "Reports", text: "View all reports", action: "View now", tone: "cyan" },
];
