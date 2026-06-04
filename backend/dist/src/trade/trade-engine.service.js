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
exports.TradeEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let TradeEngineService = class TradeEngineService {
    prisma;
    notificationsService;
    logger = new common_1.Logger('TradeEngine');
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    onModuleInit() {
        this.logger.log('Starting Trade Engine Background Worker...');
        setInterval(() => this.tickAndSettle(), 3000);
        setInterval(() => this.autoTradeSpawn(), 10000);
    }
    async tickAndSettle() {
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
                const currentPrice = trade.currentPrice.isZero() ? entryPrice : trade.currentPrice;
                const quantity = trade.quantity;
                const volatility = Math.random() * 0.01;
                const direction = Math.random() > 0.5 ? 1 : -1;
                const multiplier = new client_1.Prisma.Decimal(1 + volatility * direction);
                const nextPrice = currentPrice.mul(multiplier);
                const isBuy = trade.type === 'BUY';
                let pnl = nextPrice.minus(entryPrice).mul(quantity);
                if (!isBuy) {
                    pnl = entryPrice.minus(nextPrice).mul(quantity);
                }
                const ageSecs = (Date.now() - new Date(trade.createdAt).getTime()) / 1000;
                const shouldClose = ageSecs >= 30;
                if (shouldClose) {
                    await this.prisma.$transaction(async (tx) => {
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
                                    description: `Settle trade ${trade.id} | PnL: ₹${pnl.toFixed(2)}`,
                                    idempotencyKey: `TRADE_SETTLE_${trade.id}`,
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
                    this.logger.log(`Closed trade ${trade.id} for ${trade.user.email} with PnL: ₹${pnl.toFixed(4)}`);
                    this.notificationsService.sendToUser(trade.userId, client_1.NotificationEvent.TRADE_CLOSED, {
                        pair: trade.pair,
                        pnl: pnl.toFixed(2),
                    }).catch(err => this.logger.error(`Failed to send auto-trade close notification for user ${trade.userId}`, err.stack));
                }
                else {
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
        }
        catch (error) {
            this.logger.error('Error in active trade loop:', error);
        }
    }
    async autoTradeSpawn() {
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
                if (!user.wallet)
                    continue;
                if (user.trades.length >= 3)
                    continue;
                const risk = user.riskSetting || 'MEDIUM';
                let amount = 500;
                if (risk === 'LOW')
                    amount = 100;
                else if (risk === 'HIGH')
                    amount = 1000;
                const balance = user.wallet.realizedBalance;
                if (balance.lessThan(amount)) {
                    await this.prisma.user.update({
                        where: { id: user.id },
                        data: { autoTrading: false },
                    });
                    continue;
                }
                const pairs = ['BTC/USDT', 'ETH/USDT', 'XAU/USDT', 'EUR/USD'];
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
                let entryPriceVal = 1.0850;
                if (pair === 'BTC/USDT')
                    entryPriceVal = 68000 + (Math.random() - 0.5) * 500;
                else if (pair === 'ETH/USDT')
                    entryPriceVal = 3700 + (Math.random() - 0.5) * 50;
                else if (pair === 'XAU/USDT')
                    entryPriceVal = 2370 + (Math.random() - 0.5) * 20;
                const entryPrice = new client_1.Prisma.Decimal(entryPriceVal);
                const tradeAmount = new client_1.Prisma.Decimal(amount);
                const quantity = tradeAmount.div(entryPrice);
                const spawnedTrade = await this.prisma.$transaction(async (tx) => {
                    const t = await tx.trade.create({
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
                    return t;
                });
                this.notificationsService.sendToUser(user.id, client_1.NotificationEvent.TRADE_OPENED, {
                    type: spawnedTrade.type,
                    pair: spawnedTrade.pair,
                    entryPrice: Number(spawnedTrade.entryPrice),
                }).catch(err => this.logger.error(`Failed to send auto-trade open notification for user ${user.id}`, err.stack));
                this.logger.log(`Auto-spawned active trade for ${user.email}: ${pair} ${type} at ₹${entryPrice.toFixed(4)}`);
            }
        }
        catch (error) {
            this.logger.error('Error in auto trading loop:', error);
        }
    }
};
exports.TradeEngineService = TradeEngineService;
exports.TradeEngineService = TradeEngineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], TradeEngineService);
//# sourceMappingURL=trade-engine.service.js.map