import {
  NotificationEvent,
  NotificationCategory,
  NotificationPriority,
  NotificationSeverity,
  NotificationChannel,
} from '@prisma/client';

export interface EventDefinition {
  category: NotificationCategory;
  priority: NotificationPriority;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
  title: string; // Handlebars-style template
  body: string;
}

export const EVENT_REGISTRY: Record<NotificationEvent, EventDefinition> = {
  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  [NotificationEvent.PAYMENT_SUBMITTED]: {
    category: NotificationCategory.PAYMENT,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.INFO,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.SOCKET,
      NotificationChannel.TOAST,
    ],
    title: 'Payment Submitted',
    body: 'Your payment of ${{amount}} has been submitted and is under review.',
  },
  [NotificationEvent.PAYMENT_APPROVED]: {
    category: NotificationCategory.PAYMENT,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Payment Approved ✅',
    body: 'Your payment of ${{amount}} has been approved. Your account is now active.',
  },
  [NotificationEvent.PAYMENT_REJECTED]: {
    category: NotificationCategory.PAYMENT,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.ERROR,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Payment Rejected ❌',
    body: 'Your payment of ${{amount}} was rejected. Please contact support for details.',
  },

  // ── DEPOSITS ──────────────────────────────────────────────────────────────
  [NotificationEvent.DEPOSIT_APPROVED]: {
    category: NotificationCategory.PAYMENT,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Deposit Confirmed ✅',
    body: '${{amount}} has been credited to your account.',
  },
  [NotificationEvent.DEPOSIT_REJECTED]: {
    category: NotificationCategory.PAYMENT,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.ERROR,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Deposit Rejected ❌',
    body: 'Your deposit of ${{amount}} was rejected. Reason: {{reason}}.',
  },

  // ── WITHDRAWALS ───────────────────────────────────────────────────────────
  [NotificationEvent.WITHDRAWAL_REQUESTED]: {
    category: NotificationCategory.WITHDRAWAL,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.INFO,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.SOCKET,
      NotificationChannel.TOAST,
    ],
    title: 'Withdrawal Requested',
    body: 'Your withdrawal request of ${{amount}} is being processed.',
  },
  [NotificationEvent.WITHDRAWAL_APPROVED]: {
    category: NotificationCategory.WITHDRAWAL,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Withdrawal Approved ✅',
    body: 'Your withdrawal of ${{amount}} has been approved and will be transferred shortly.',
  },
  [NotificationEvent.WITHDRAWAL_REJECTED]: {
    category: NotificationCategory.WITHDRAWAL,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.ERROR,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Withdrawal Rejected ❌',
    body: 'Your withdrawal of ${{amount}} was rejected. Reason: {{reason}}.',
  },

  // ── TRADES ────────────────────────────────────────────────────────────────
  [NotificationEvent.TRADE_PUBLISHED]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.INFO,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.SOCKET,
      NotificationChannel.TOAST,
    ],
    title: 'New Trade Signal Published',
    body: 'A new {{type}} signal on {{pair}} has been published.',
  },
  [NotificationEvent.TRADE_OPENED]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.INFO,
    channels: [NotificationChannel.BELL, NotificationChannel.SOCKET],
    title: 'Trade Opened',
    body: 'Your {{type}} trade on {{pair}} has been opened at ${{entryPrice}}.',
  },
  [NotificationEvent.TRADE_CLOSED]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.TOAST,
    ],
    title: 'Trade Closed',
    body: 'Your trade on {{pair}} has been closed. P&L: ${{pnl}}.',
  },
  [NotificationEvent.TRADE_CANCELLED]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.LOW,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.TOAST],
    title: 'Trade Cancelled',
    body: 'Your trade on {{pair}} has been cancelled.',
  },
  [NotificationEvent.TAKE_PROFIT_HIT]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.TOAST,
    ],
    title: '🎯 Take Profit Hit!',
    body: 'Take profit reached on {{pair}}. Profit: ${{profit}}.',
  },
  [NotificationEvent.STOP_LOSS_HIT]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.ERROR,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.TOAST,
    ],
    title: '⚠️ Stop Loss Hit',
    body: 'Stop loss triggered on {{pair}}. Loss: ${{loss}}.',
  },
  [NotificationEvent.SIGNAL_UPDATED]: {
    category: NotificationCategory.TRADE,
    priority: NotificationPriority.LOW,
    severity: NotificationSeverity.INFO,
    channels: [NotificationChannel.BELL, NotificationChannel.SOCKET],
    title: 'Signal Updated',
    body: 'The {{pair}} signal has been updated by the admin.',
  },

  // ── PROFIT ────────────────────────────────────────────────────────────────
  [NotificationEvent.PROFIT_DISTRIBUTED]: {
    category: NotificationCategory.PROFIT,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: '💰 Profit Credited!',
    body: 'Weekly profit of ${{amount}} has been credited to your wallet.',
  },

  // ── PLANS ─────────────────────────────────────────────────────────────────
  [NotificationEvent.PLAN_ACTIVATED]: {
    category: NotificationCategory.SUBSCRIPTION,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Plan Activated 🚀',
    body: 'Your {{planName}} plan is now active. Enjoy trading!',
  },
  [NotificationEvent.PLAN_EXPIRING]: {
    category: NotificationCategory.SUBSCRIPTION,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.WARNING,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
    ],
    title: '⏳ Plan Expiring Soon',
    body: 'Your {{planName}} plan expires in {{days}} days. Renew now to avoid interruption.',
  },
  [NotificationEvent.PLAN_EXPIRED]: {
    category: NotificationCategory.SUBSCRIPTION,
    priority: NotificationPriority.CRITICAL,
    severity: NotificationSeverity.ERROR,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: 'Plan Expired',
    body: 'Your {{planName}} plan has expired. Renew to continue trading.',
  },
  [NotificationEvent.PLAN_UPGRADED]: {
    category: NotificationCategory.SUBSCRIPTION,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.SUCCESS,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
    ],
    title: 'Plan Upgraded ⬆️',
    body: 'Your plan has been upgraded to {{planName}}.',
  },
  [NotificationEvent.PLAN_DOWNGRADED]: {
    category: NotificationCategory.SUBSCRIPTION,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: 'Plan Downgraded',
    body: 'Your plan has been changed to {{planName}}.',
  },

  // ── REPORTS ───────────────────────────────────────────────────────────────
  [NotificationEvent.REPORT_READY]: {
    category: NotificationCategory.REPORT,
    priority: NotificationPriority.LOW,
    severity: NotificationSeverity.INFO,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: '📄 Report Ready',
    body: 'Your {{reportType}} report is ready to download.',
  },

  // ── SECURITY ──────────────────────────────────────────────────────────────
  [NotificationEvent.NEW_LOGIN]: {
    category: NotificationCategory.SECURITY,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.WARNING,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: '🔐 New Login Detected',
    body: 'A new login to your account was detected from {{ipAddress}}.',
  },
  [NotificationEvent.PASSWORD_CHANGED]: {
    category: NotificationCategory.SECURITY,
    priority: NotificationPriority.CRITICAL,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: '🔑 Password Changed',
    body: 'Your account password was changed. If this was not you, contact support immediately.',
  },
  [NotificationEvent.EMAIL_CHANGED]: {
    category: NotificationCategory.SECURITY,
    priority: NotificationPriority.CRITICAL,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: '✉️ Email Changed',
    body: 'Your account email has been updated.',
  },
  [NotificationEvent.ACCOUNT_BLOCKED]: {
    category: NotificationCategory.SECURITY,
    priority: NotificationPriority.CRITICAL,
    severity: NotificationSeverity.ERROR,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: '🚫 Account Blocked',
    body: 'Your account has been blocked. Please contact support for assistance.',
  },
  [NotificationEvent.TWO_FACTOR_ENABLED]: {
    category: NotificationCategory.SECURITY,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.SUCCESS,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: '2FA Enabled ✅',
    body: 'Two-factor authentication has been enabled on your account.',
  },
  [NotificationEvent.TWO_FACTOR_DISABLED]: {
    category: NotificationCategory.SECURITY,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: '2FA Disabled ⚠️',
    body: 'Two-factor authentication has been disabled on your account.',
  },

  // ── SUPPORT ───────────────────────────────────────────────────────────────
  [NotificationEvent.TICKET_CREATED]: {
    category: NotificationCategory.SUPPORT,
    priority: NotificationPriority.LOW,
    severity: NotificationSeverity.INFO,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: 'Ticket Created',
    body: 'Your support ticket #{{ticketId}} has been submitted.',
  },
  [NotificationEvent.TICKET_REPLIED]: {
    category: NotificationCategory.SUPPORT,
    priority: NotificationPriority.MEDIUM,
    severity: NotificationSeverity.INFO,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.PUSH,
      NotificationChannel.EMAIL,
      NotificationChannel.TOAST,
    ],
    title: '💬 Ticket Reply',
    body: 'Support has replied to your ticket #{{ticketId}}.',
  },
  [NotificationEvent.TICKET_CLOSED]: {
    category: NotificationCategory.SUPPORT,
    priority: NotificationPriority.LOW,
    severity: NotificationSeverity.INFO,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: 'Ticket Closed',
    body: 'Your support ticket #{{ticketId}} has been closed.',
  },

  // ── ADMIN SYSTEM ──────────────────────────────────────────────────────────
  [NotificationEvent.ADMIN_LOGIN]: {
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: '🔐 Admin Login',
    body: 'Admin {{name}} logged in from {{ipAddress}}.',
  },
  [NotificationEvent.ADMIN_CREATED]: {
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.INFO,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: 'New Admin Created',
    body: 'A new admin account for {{name}} ({{email}}) has been created.',
  },
  [NotificationEvent.ADMIN_REMOVED]: {
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.WARNING,
    channels: [NotificationChannel.BELL, NotificationChannel.EMAIL],
    title: 'Admin Removed',
    body: 'Admin {{name}} ({{email}}) has been removed from the system.',
  },
  [NotificationEvent.SYSTEM]: {
    category: NotificationCategory.SYSTEM,
    priority: NotificationPriority.HIGH,
    severity: NotificationSeverity.INFO,
    channels: [
      NotificationChannel.BELL,
      NotificationChannel.SOCKET,
      NotificationChannel.TOAST,
    ],
    title: 'System Alert',
    body: '{{message}}',
  },
};
