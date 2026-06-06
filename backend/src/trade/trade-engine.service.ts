import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, NotificationEvent } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TradeEngineService implements OnModuleInit {
  private readonly logger = new Logger('TradeEngine');

  constructor(
    private prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting Trade Engine Background Worker...');

    // 1. Ticking and Settle Loop (every 3 seconds)
    setInterval(() => this.tickAndSettle(), 3000);

    // 2. Auto Trading Spawn Loop (every 10 seconds)
    setInterval(() => this.autoTradeSpawn(), 10000);
  }

  private async tickAndSettle() {
    try {
      const activeTrades = await this.prisma.trade.findMany({
        where: { status: 'ACTIVE' },
        include: {
          user: {
            include: { wallet: true },
          },
        },
      });

      for (const trade of activeTrades) {
        const entryPrice = trade.entryPrice;
        const currentPrice = trade.currentPrice.isZero()
          ? entryPrice
          : trade.currentPrice;
        const quantity = trade.quantity;

        // Volatility: up to 1% movement in random direction
        const volatility = Math.random() * 0.01;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const multiplier = new (Prisma as any).Decimal(
          1 + volatility * direction,
        );
        const nextPrice = currentPrice.mul(multiplier);

        // PnL Calculation
        const isBuy = trade.type === 'BUY';
        let pnl = nextPrice.minus(entryPrice).mul(quantity);
        if (!isBuy) {
          pnl = entryPrice.minus(nextPrice).mul(quantity);
        }

        // Age Check: Close after 30 seconds
        const ageSecs =
          (Date.now() - new Date(trade.createdAt).getTime()) / 1000;
        const shouldClose = ageSecs >= 30;

        if (shouldClose) {
          await this.prisma.$transaction(async (tx: any) => {
            // Close Trade
            await tx.trade.update({
              where: { id: trade.id },
              data: {
                status: 'CLOSED',
                exitPrice: nextPrice,
                currentPrice: nextPrice,
                pnl: pnl,
                profit: pnl,
                closedAt: new Date(),
              },
            });

            // Credit user wallet: return margin + PnL
            if (trade.user?.wallet) {
              const originalMargin = entryPrice.mul(quantity);
              const returnAmount = originalMargin.add(pnl);
              const nextBalance =
                trade.user.wallet.realizedBalance.add(returnAmount);

              const nextEquity =
                Number(trade.user.wallet.currentEquity) + Number(returnAmount);
              const nextAvailable =
                Number(trade.user.wallet.availableBalance) +
                Number(returnAmount);

              await tx.wallet.update({
                where: { id: trade.user.wallet.id },
                data: {
                  realizedBalance: nextBalance,
                  currentEquity: new Prisma.Decimal(nextEquity),
                  availableBalance: new Prisma.Decimal(nextAvailable),
                },
              });

              // Write Ledger Entries
              const entryType = pnl.isPositive() ? 'CREDIT' : 'DEBIT';
              const systemEntryType = pnl.isPositive() ? 'DEBIT' : 'CREDIT';

              const group = await tx.transactionGroup.create({
                data: {
                  type: pnl.isPositive() ? 'TRADE_PROFIT' : 'TRADE_LOSS',
                  description: `Settle trade ${trade.id} | PnL: $${pnl.toFixed(2)}`,
                  idempotencyKey: `TRADE_SETTLE_${trade.id}`,
                },
              });

              await tx.ledgerEntry.createMany({
                data: [
                  {
                    transactionGroupId: group.id,
                    userId: trade.userId,
                    partnerId: trade.partnerId,
                    accountType: 'USER',
                    entryType: entryType,
                    amount: pnl.abs(),
                    currency: 'USD',
                  },
                  {
                    transactionGroupId: group.id,
                    accountType: 'SYSTEM',
                    entryType: systemEntryType,
                    amount: pnl.abs(),
                    currency: 'USD',
                  },
                ],
              });
            }
          });

          this.logger.log(
            `Closed trade ${trade.id} for ${trade.user.email} with PnL: $${pnl.toFixed(4)}`,
          );

          this.notificationsService
            .sendToUser(trade.userId, NotificationEvent.TRADE_CLOSED, {
              pair: trade.pair,
              pnl: pnl.toFixed(2),
            })
            .catch((err) =>
              this.logger.error(
                `Failed to send auto-trade close notification for user ${trade.userId}`,
                err.stack,
              ),
            );
        } else {
          // Just update current price and PnL
          await this.prisma.trade.update({
            where: { id: trade.id },
            data: {
              currentPrice: nextPrice,
              pnl: pnl,
              profit: pnl,
            },
          });
        }
      }
    } catch (error: any) {
      this.logger.error('Error in active trade loop:', error);
    }
  }

  private async autoTradeSpawn() {
    try {
      const activeUsers = await this.prisma.user.findMany({
        where: { autoTrading: true, isDeleted: false },
        include: {
          wallet: true,
          trades: {
            where: { status: 'ACTIVE' },
          },
        },
      });

      for (const user of activeUsers) {
        if (!user.wallet) continue;
        if (user.trades.length >= 3) continue; // max 3 active trades

        const risk = user.riskSetting || 'MEDIUM';
        let amount = 500; // MEDIUM
        if (risk === 'LOW') amount = 100;
        else if (risk === 'HIGH') amount = 1000;

        const balance = user.wallet.realizedBalance;
        if (balance.lessThan(amount)) {
          // Insufficient funds: disable auto trading
          await this.prisma.user.update({
            where: { id: user.id },
            data: { autoTrading: false },
          });
          continue;
        }

        // Random asset configuration
        const pairs = ['BTC/USDT', 'ETH/USDT', 'XAU/USDT', 'EUR/USD'];
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const type = Math.random() > 0.5 ? 'BUY' : 'SELL';

        // entryPrice generator
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

        // Deduct balance and create trade in transaction
        const spawnedTrade = await this.prisma.$transaction(async (tx: any) => {
          const t = await tx.trade.create({
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

          return t;
        });

        this.notificationsService
          .sendToUser(user.id, NotificationEvent.TRADE_OPENED, {
            type: spawnedTrade.type,
            pair: spawnedTrade.pair,
            entryPrice: Number(spawnedTrade.entryPrice),
          })
          .catch((err) =>
            this.logger.error(
              `Failed to send auto-trade open notification for user ${user.id}`,
              err.stack,
            ),
          );

        this.logger.log(
          `Auto-spawned active trade for ${user.email}: ${pair} ${type} at $${entryPrice.toFixed(4)}`,
        );
      }
    } catch (error: any) {
      this.logger.error('Error in auto trading loop:', error);
    }
  }
}
