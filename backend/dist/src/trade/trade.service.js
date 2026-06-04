"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let TradeService = class TradeService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async listTrades(userId) {
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
            activeTrades: activeTrades.map((t) => ({
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
            pastTrades: pastTrades.map((t) => ({
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
    async createTrade(userId, body) {
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
        const risk = user.riskSetting || 'MEDIUM';
        let amount = 500;
        if (risk === 'LOW')
            amount = 100;
        else if (risk === 'HIGH')
            amount = 1000;
        const balance = user.wallet.realizedBalance;
        if (balance.lessThan(amount)) {
            return {
                error: `Insufficient wallet balance. Required: ₹${amount}`,
                status: 400,
            };
        }
        const pair = body?.pair ||
            ['BTC/USDT', 'ETH/USDT', 'XAU/USDT', 'EUR/USD'][Math.floor(Math.random() * 4)];
        const type = body?.type || (Math.random() > 0.5 ? 'BUY' : 'SELL');
        let entryPriceVal = 1.085;
        if (pair === 'BTC/USDT')
            entryPriceVal = 68000 + (Math.random() - 0.5) * 500;
        else if (pair === 'ETH/USDT')
            entryPriceVal = 3700 + (Math.random() - 0.5) * 50;
        else if (pair === 'XAU/USDT')
            entryPriceVal = 2370 + (Math.random() - 0.5) * 20;
        const entryPrice = new client_1.Prisma.Decimal(entryPriceVal);
        const tradeAmount = new client_1.Prisma.Decimal(amount);
        const quantity = tradeAmount.div(entryPrice);
        const newTrade = await this.prisma.$transaction(async (tx) => {
            const trade = await tx.trade.create({
                data: {
                    userId: user.id,
                    partnerId: user.partnerId,
                    pair,
                    type: type,
                    entryPrice,
                    currentPrice: entryPrice,
                    quantity,
                    stopLoss: entryPrice.mul(type === 'BUY' ? 0.95 : 1.05),
                    target: entryPrice.mul(type === 'BUY' ? 1.05 : 0.95),
                    status: 'ACTIVE',
                },
            });
            await tx.wallet.update({
                where: { id: user.wallet.id },
                data: {
                    realizedBalance: balance.minus(tradeAmount),
                    currentEquity: new client_1.Prisma.Decimal(Number(user.wallet.currentEquity) - amount),
                    availableBalance: new client_1.Prisma.Decimal(Number(user.wallet.availableBalance) - amount),
                },
            });
            return trade;
        });
        if (newTrade) {
            this.notificationsService
                .sendToUser(userId, client_1.NotificationEvent.TRADE_OPENED, {
                type: newTrade.type,
                pair: newTrade.pair,
                entryPrice: Number(newTrade.entryPrice),
            })
                .catch((err) => console.error(`Failed to send TRADE_OPENED notification for user ${userId}`, err));
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
    async closeTrade(userId, tradeId) {
        if (!tradeId) {
            return { error: 'Trade ID is required', status: 400 };
        }
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
        const isBuy = trade.type === 'BUY';
        let pnl = currentPrice.minus(entryPrice).mul(quantity);
        if (!isBuy) {
            pnl = entryPrice.minus(currentPrice).mul(quantity);
        }
        await this.prisma.$transaction(async (tx) => {
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
                const nextEquity = Number(trade.user.wallet.currentEquity) + Number(returnAmount);
                const nextAvailable = Number(trade.user.wallet.availableBalance) + Number(returnAmount);
                await tx.wallet.update({
                    where: { id: trade.user.wallet.id },
                    data: {
                        realizedBalance: nextBalance,
                        currentEquity: new client_1.Prisma.Decimal(nextEquity),
                        availableBalance: new client_1.Prisma.Decimal(nextAvailable),
                    },
                });
                const group = await tx.transactionGroup.create({
                    data: {
                        type: pnl.isPositive() ? 'TRADE_PROFIT' : 'TRADE_LOSS',
                        description: `Manual Settle trade ${trade.id} | PnL: ₹${pnl.toFixed(2)}`,
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
                        currency: 'INR',
                    },
                });
            }
        });
        if (trade) {
            this.notificationsService
                .sendToUser(userId, client_1.NotificationEvent.TRADE_CLOSED, {
                pair: trade.pair,
                pnl: Number(pnl).toFixed(2),
            })
                .catch((err) => console.error(`Failed to send TRADE_CLOSED notification for user ${userId}`, err));
        }
        return { success: true };
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], TradeService);
//# sourceMappingURL=trade.service.js.map