import {
  Bot,
  Crown,
  Gauge,
  Home,
  Settings,
  ShieldCheck,
  TrendingUp,
  History,
  FileText,
  List,
  Wallet as WalletIcon,
  HelpCircle,
  DollarSign,
  Landmark,
  Coins,
  Bell,
} from "lucide-react";
import { pastTrades } from "../../data/pastTrades";

export const userNavItems = [
  { icon: Home, label: "Dashboard", href: "/dashboard" },
  { icon: DollarSign, label: "Profit History", href: "/dashboard/profit-history" },
  // { icon: Bot, label: "Live Trades", href: "/dashboard/live-trades" },
  { icon: History, label: "Past Trades", href: "/dashboard/past-trades" },
  // { icon: LineChart, label: "Performance", href: "/dashboard/performance" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: List, label: "Subscription", href: "/dashboard/subscription" },
  { icon: WalletIcon, label: "Wallet", href: "/dashboard/wallet" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: HelpCircle, label: "Support", href: "/dashboard/support" },
];

export const navItems = userNavItems;

export const stats = [
  { icon: TrendingUp, label: "Total PnL", value: "+$4,250.75", sub: "Overall profit/loss - +12.45% this week", tone: "text-green-300" },
  { icon: Bot, label: "Total Trades", value: "48", sub: "Executed trades - active & completed", tone: "text-blue-300" },
  { icon: ShieldCheck, label: "Win Rate", value: "72.91%", sub: "Trading success ratio based on closed trades", tone: "text-green-300" },
  { icon: Crown, label: "Profit Factor", value: "2.35", sub: "Risk vs reward performance", tone: "text-yellow-300" },
  { icon: Gauge, label: "Expectancy", value: "$88.56", sub: "Average return per trade", tone: "text-cyan-300" },
];

export const liveTrades = [
  { pair: "BTC/USD", type: "BUY", entry: "68,240.00", current: "68,920.00", target: "70,000.00", stop: "67,800.00", pnl: "+$214.00", status: "Active" },
  { pair: "ETH/USD", type: "BUY", entry: "3,730.50", current: "3,710.20", target: "3,840.00", stop: "3,650.00", pnl: "-$42.00", status: "Active" },
  { pair: "XAU/USD", type: "SELL", entry: "2,376.80", current: "2,370.10", target: "2,360.00", stop: "2,386.00", pnl: "+$335.00", status: "Active" },
];

const parsePrice = (value) => Number(String(value).replace(/,/g, ""));

const formatPrice = (value, fallback) => {
  if (!Number.isFinite(value)) return fallback;
  return value >= 100 ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value.toFixed(5);
};

export const enrichedTrades = pastTrades.map((trade, index) => {
  const entry = parsePrice(trade.entry);
  const exit = parsePrice(trade.exit);
  const isBuy = trade.side === "BUY";
  const movement = Math.abs(exit - entry);
  const target = isBuy ? entry + movement * 1.4 : entry - movement * 1.4;
  const stopLoss = isBuy ? entry - movement * 0.8 : entry + movement * 0.8;
  const breakeven = isBuy ? entry + movement * 0.25 : entry - movement * 0.25;
  const points = Math.abs(exit - entry) * (entry > 1000 ? 10 : entry > 100 ? 100 : 10000);

  return {
    ...trade,
    target: formatPrice(target, trade.exit),
    stopLoss: formatPrice(stopLoss, trade.entry),
    breakeven: formatPrice(breakeven, trade.entry),
    points: `${trade.result === "WIN" ? "" : "-"}${points.toLocaleString("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}`,
    qty: index === 3 ? "0.10" : "1.00",
  };
});
