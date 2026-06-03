import { NotificationEvent } from '@prisma/client';

export const EVENT_ROUTES: Record<NotificationEvent, string> = {
  // Payments
  [NotificationEvent.PAYMENT_SUBMITTED]: '/dashboard/wallet',
  [NotificationEvent.PAYMENT_APPROVED]: '/dashboard/wallet',
  [NotificationEvent.PAYMENT_REJECTED]: '/dashboard/wallet',

  // Deposits
  [NotificationEvent.DEPOSIT_APPROVED]: '/dashboard/wallet',
  [NotificationEvent.DEPOSIT_REJECTED]: '/dashboard/wallet',

  // Withdrawals
  [NotificationEvent.WITHDRAWAL_REQUESTED]: '/dashboard/wallet',
  [NotificationEvent.WITHDRAWAL_APPROVED]: '/dashboard/wallet',
  [NotificationEvent.WITHDRAWAL_REJECTED]: '/dashboard/wallet',

  // Trades
  [NotificationEvent.TRADE_PUBLISHED]: '/dashboard/live-trades',
  [NotificationEvent.TRADE_OPENED]: '/dashboard/live-trades',
  [NotificationEvent.TRADE_CLOSED]: '/dashboard/past-trades',
  [NotificationEvent.TRADE_CANCELLED]: '/dashboard/past-trades',
  [NotificationEvent.TAKE_PROFIT_HIT]: '/dashboard/past-trades',
  [NotificationEvent.STOP_LOSS_HIT]: '/dashboard/past-trades',
  [NotificationEvent.SIGNAL_UPDATED]: '/dashboard/live-trades',

  // Profit
  [NotificationEvent.PROFIT_DISTRIBUTED]: '/dashboard/profit-history',

  // Plans
  [NotificationEvent.PLAN_ACTIVATED]: '/dashboard/subscription',
  [NotificationEvent.PLAN_EXPIRING]: '/dashboard/subscription',
  [NotificationEvent.PLAN_EXPIRED]: '/dashboard/subscription',
  [NotificationEvent.PLAN_UPGRADED]: '/dashboard/subscription',
  [NotificationEvent.PLAN_DOWNGRADED]: '/dashboard/subscription',

  // Reports
  [NotificationEvent.REPORT_READY]: '/dashboard/reports',

  // Security
  [NotificationEvent.NEW_LOGIN]: '/dashboard',
  [NotificationEvent.PASSWORD_CHANGED]: '/dashboard',
  [NotificationEvent.EMAIL_CHANGED]: '/dashboard',
  [NotificationEvent.ACCOUNT_BLOCKED]: '/dashboard',
  [NotificationEvent.TWO_FACTOR_ENABLED]: '/dashboard',
  [NotificationEvent.TWO_FACTOR_DISABLED]: '/dashboard',

  // Support
  [NotificationEvent.TICKET_CREATED]: '/dashboard/support',
  [NotificationEvent.TICKET_REPLIED]: '/dashboard/support',
  [NotificationEvent.TICKET_CLOSED]: '/dashboard/support',

  // Admin/system
  [NotificationEvent.ADMIN_LOGIN]: '/admin/dashboard',
  [NotificationEvent.ADMIN_CREATED]: '/admin/dashboard',
  [NotificationEvent.ADMIN_REMOVED]: '/admin/dashboard',
  [NotificationEvent.SYSTEM]: '/dashboard',
};
