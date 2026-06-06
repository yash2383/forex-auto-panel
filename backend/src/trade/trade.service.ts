import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationEvent } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TradeService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listTrades(userId: string) {
    const [activeTrades, pastTrades] = await Promise.all([
      this.prisma.trade.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trade.findMany({
        where: { userId, status: 'CLOSED' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      activeTrades: activeTrades.map((t: any) => ({
        id: t.id,
        pair: t.pair,
        type: t.type,
        entryPrice: Number(t.entryPrice),
        currentPrice: Number(t.currentPrice),
        quantity: Number(t.quantity),
        pnl: Number(t.pnl),
        status: 'ACTIVE',
        createdAt: t.createdAt,
      })),
      pastTrades: pastTrades.map((t: any) => ({
        id: t.id,
        pair: t.pair,
        type: t.type,
        entryPrice: Number(t.entryPrice),
        currentPrice: Number(t.currentPrice),
        exitPrice: Number(t.exitPrice),
        quantity: Number(t.quantity),
        pnl: Number(t.pnl),
        status: 'CLOSED',
        createdAt: t.createdAt,
        closedAt: t.closedAt,
      })),
    };
  }

  async createTrade(userId: string, body?: { pair?: string; type?: string }) {
    // Fetch user and wallet
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, trades: { where: { status: 'ACTIVE' } } },
    });

    if (!user || !user.wallet) {
      return { error: 'User wallet not found', status: 404 };
    }

    if (user.trades.length >= 3) {
      return {
        error: 'Maximum 3 active trades allowed simultaneously',
        status: 400,
      };
    }

    // Determine amount based on risk settings
    const risk = user.riskSetting || 'MEDIUM';
    let amount = 500; // MEDIUM
    if (risk === 'LOW') amount = 100;
    else if (risk === 'HIGH') amount = 1000;

    const balance = user.wallet.realizedBalance;
    if (balance.lessThan(amount)) {
      return {
        error: `Insufficient wallet balance. Required: $${amount}`,
        status: 400,
      };
    }

    const pair =
      body?.pair ||
      ['BTC/USDT', 'ETH/USDT', 'XAU/USDT', 'EUR/USD'][
        Math.floor(Math.random() * 4)
      ];
    const type = body?.type || (Math.random() > 0.5 ? 'BUY' : 'SELL');

    // Generate entryPrice
    let entryPriceVal = 1.085;
    if (pair === 'BTC/USDT')
      entryPriceVal = 68000 + (Math.random() - 0.5) * 500;
    else if (pair === 'ETH/USDT')
      entryPriceVal = 3700 + (Math.random() - 0.5) * 50;
    else if (pair === 'XAU/USDT')
      entryPriceVal = 2370 + (Math.random() - 0.5) * 20;

    const entryPrice = new (Prisma as any).Decimal(entryPriceVal);
    const tradeAmount = new (Prisma as any).Decimal(amount);
    const quantity = tradeAmount.div(entryPrice);

    // Create trade and deduct wallet balance
    const newTrade = await this.prisma.$transaction(async (tx: any) => {
      const trade = await tx.trade.create({
        data: {
          userId: user.id,
          partnerId: user.partnerId,
          pair,
          type: type as any,
          entryPrice,
          currentPrice: entryPrice,
          quantity,
          stopLoss: entryPrice.mul(type === 'BUY' ? 0.95 : 1.05),
          target: entryPrice.mul(type === 'BUY' ? 1.05 : 0.95),
          status: 'ACTIVE',
        },
      });

      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: {
          realizedBalance: balance.minus(tradeAmount),
          currentEquity: new Prisma.Decimal(
            Number(user.wallet!.currentEquity) - amount,
          ),
          availableBalance: new Prisma.Decimal(
            Number(user.wallet!.availableBalance) - amount,
          ),
        },
      });

      return trade;
    });

    if (newTrade) {
      this.notificationsService
        .sendToUser(userId, NotificationEvent.TRADE_OPENED, {
          type: newTrade.type,
          pair: newTrade.pair,
          entryPrice: Number(newTrade.entryPrice),
        })
        .catch((err) =>
          console.error(
            `Failed to send TRADE_OPENED notification for user ${userId}`,
            err,
          ),
        );
    }

    return {
      success: true,
      trade: {
        id: newTrade.id,
        pair: newTrade.pair,
        type: newTrade.type,
        entryPrice: Number(newTrade.entryPrice),
        currentPrice: Number(newTrade.currentPrice),
        quantity: Number(newTrade.quantity),
        pnl: 0,
        status: 'ACTIVE',
      },
    };
  }

  async closeTrade(userId: string, tradeId: string) {
    if (!tradeId) {
      return { error: 'Trade ID is required', status: 400 };
    }

    // Fetch active trade
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId, status: 'ACTIVE' },
      include: { user: { include: { wallet: true } } },
    });

    if (!trade) {
      return { error: 'Active trade not found', status: 404 };
    }

    const entryPrice = trade.entryPrice;
    const currentPrice = trade.currentPrice.isZero()
      ? entryPrice
      : trade.currentPrice;
    const quantity = trade.quantity;

    // Calculate PnL
    const isBuy = trade.type === 'BUY';
    let pnl = currentPrice.minus(entryPrice).mul(quantity);
    if (!isBuy) {
      pnl = entryPrice.minus(currentPrice).mul(quantity);
    }

    // Settle trade and refund balance
    await this.prisma.$transaction(async (tx: any) => {
      await tx.trade.update({
        where: { id: trade.id },
        data: {
          status: 'CLOSED',
          exitPrice: currentPrice,
          pnl: pnl,
          profit: pnl,
          closedAt: new Date(),
        },
      });

      if (trade.user?.wallet) {
        const originalMargin = entryPrice.mul(quantity);
        const returnAmount = originalMargin.add(pnl);
        const nextBalance = trade.user.wallet.realizedBalance.add(returnAmount);

        const nextEquity =
          Number(trade.user.wallet.currentEquity) + Number(returnAmount);
        const nextAvailable =
          Number(trade.user.wallet.availableBalance) + Number(returnAmount);

        await tx.wallet.update({
          where: { id: trade.user.wallet.id },
          data: {
            realizedBalance: nextBalance,
            currentEquity: new Prisma.Decimal(nextEquity),
            availableBalance: new Prisma.Decimal(nextAvailable),
          },
        });

        // Write Ledger Entries
        const group = await tx.transactionGroup.create({
          data: {
            type: pnl.isPositive() ? 'TRADE_PROFIT' : 'TRADE_LOSS',
            description: `Manual Settle trade ${trade.id} | PnL: $${pnl.toFixed(2)}`,
            idempotencyKey: `TRADE_SETTLE_MANUAL_${trade.id}`,
          },
        });

        await tx.ledgerEntry.create({
          data: {
            transactionGroupId: group.id,
            userId: trade.userId,
            partnerId: trade.partnerId,
            accountType: 'USER',
            entryType: pnl.isPositive() ? 'CREDIT' : 'DEBIT',
            amount: pnl.abs(),
            currency: 'USD',
          },
        });
      }
    });

    if (trade) {
      this.notificationsService
        .sendToUser(userId, NotificationEvent.TRADE_CLOSED, {
          pair: trade.pair,
          pnl: Number(pnl).toFixed(2),
        })
        .catch((err) =>
          console.error(
            `Failed to send TRADE_CLOSED notification for user ${userId}`,
            err,
          ),
        );
    }

    return { success: true };
  }
}
