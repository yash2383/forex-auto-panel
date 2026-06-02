import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getData(userId: string) {
    // Fetch user details along with wallet
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Fetch trades
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch payments (deposits)
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch withdrawals
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const closedTrades = trades.filter((t: any) => t.status === 'CLOSED');
    const activeTrades = trades.filter((t: any) => t.status === 'ACTIVE');

    const totalProfit = closedTrades.reduce((sum: number, t: any) => sum + Number(t.profit), 0);
    const realizedPnL = totalProfit;
    const unrealizedPnL = activeTrades.reduce((sum: number, t: any) => sum + Number(t.profit), 0);

    const winningTrades = closedTrades.filter((t: any) => Number(t.profit) > 0).length;
    const winRate = closedTrades.length > 0
      ? Number(((winningTrades / closedTrades.length) * 100).toFixed(2))
      : 72.91;

    return {
      stats: {
        totalProfit,
        realizedPnL,
        unrealizedPnL,
        winRate,
        activeTradesCount: activeTrades.length,
      },
      wallet: user.wallet,
      trades: trades.map((t: any) => ({
        id: t.id,
        symbol: t.pair,
        side: t.type,
        entry: Number(t.entryPrice),
        exit: Number(t.exitPrice),
        target: Number(t.target),
        stopLoss: Number(t.stopLoss),
        breakeven: Number(t.stopLoss),
        pnl: Number(t.pnl) >= 0 ? `+$${Number(t.pnl).toFixed(2)}` : `-$${Math.abs(Number(t.pnl)).toFixed(2)}`,
        rawPnl: Number(t.pnl),
        points: `${Number(t.pnl) >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}`,
        qty: '1.00',
        date: t.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        result: Number(t.pnl) > 0 ? 'WIN' : Number(t.pnl) < 0 ? 'LOSS' : 'BE',
        status: t.status === 'ACTIVE' ? 'Active' : 'Closed',
      })),
      payments: payments.map((p: any) => ({
        id: p.id,
        plan: p.planName,
        amount: `₹${Number(p.amount).toLocaleString('en-IN')}`,
        txnHash: p.txnHash || 'N/A',
        utr: p.utr || 'N/A',
        network: p.network || 'N/A',
        date: p.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: p.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: p.status === 'PENDING' ? 'Pending' : p.status === 'APPROVED' ? 'Approved' : p.status === 'REJECTED' ? 'Rejected' : 'Verified',
      })),
      withdrawals: withdrawals.map((w: any) => ({
        id: w.id,
        amount: `₹${Number(w.amount).toLocaleString('en-IN')}`,
        date: w.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: w.status === 'PENDING' ? 'Pending' : w.status === 'APPROVED' ? 'Approved' : 'Rejected',
      })),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        autoTrading: user.autoTrading,
        riskSetting: user.riskSetting,
      },
    };
  }

  async deposit(userId: string, partnerId: string, body: any) {
    const { planName, amount, txnHash, utr, paymentType, network } = body;

    if (!planName || !amount) {
      return { error: 'Plan name and amount are required', status: 400 };
    }

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        partnerId,
        planName,
        amount: Number(amount),
        currency: 'INR',
        paymentType: paymentType || 'USDT',
        network: network || null,
        txnHash: txnHash || null,
        utr: utr || null,
        status: 'PENDING',
      },
    });

    return { success: true, payment };
  }

  async withdraw(userId: string, partnerId: string, amount: number) {
    const requestAmount = Number(amount);
    if (!requestAmount || requestAmount <= 0) {
      return { error: 'A valid positive withdrawal amount is required', status: 400 };
    }

    // 1. Get Wallet balance and verify
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return { error: 'Wallet not found', status: 404 };
    }

    // 2. Sum pending withdrawals to prevent double-spending
    const pendingWithdrawals = await this.prisma.withdrawal.findMany({
      where: { userId, status: 'PENDING' },
    });

    const totalPending = pendingWithdrawals.reduce((sum: number, w: any) => sum + Number(w.amount), 0);
    const availableBalance = Number(wallet.realizedBalance) - totalPending;

    if (availableBalance < requestAmount) {
      return {
        error: `Insufficient funds. Available: ₹${availableBalance.toLocaleString('en-IN')} (Realized: ₹${Number(wallet.realizedBalance).toLocaleString('en-IN')}, Pending: ₹${totalPending.toLocaleString('en-IN')})`,
        status: 400,
      };
    }

    // 3. Create pending withdrawal record
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        partnerId,
        amount: requestAmount,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    return { success: true, withdrawal };
  }

  async updateSettings(userId: string, body: { autoTrading?: boolean; riskSetting?: string }) {
    const dataToUpdate: any = {};
    if (typeof body.autoTrading === 'boolean') {
      dataToUpdate.autoTrading = body.autoTrading;
    }
    if (body.riskSetting && ['LOW', 'MEDIUM', 'HIGH'].includes(body.riskSetting)) {
      dataToUpdate.riskSetting = body.riskSetting;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return { error: 'No valid settings to update', status: 400 };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    return {
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        autoTrading: updatedUser.autoTrading,
        riskSetting: updatedUser.riskSetting,
      },
    };
  }
}
