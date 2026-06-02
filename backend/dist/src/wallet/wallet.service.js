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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let WalletService = class WalletService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWalletData(userId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException('Wallet not found');
        }
        return {
            realizedBalance: Number(wallet.realizedBalance),
            currentEquity: Number(wallet.currentEquity),
            availableBalance: Number(wallet.availableBalance),
            pendingWithdrawals: Number(wallet.pendingWithdrawals),
            totalWithdrawn: Number(wallet.totalWithdrawn),
            currency: wallet.currency,
        };
    }
    async getWithdrawals(userId) {
        return this.prisma.withdrawal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createWithdrawal(userId, partnerId, amount, method, accountDetails, notes) {
        if (isNaN(amount) || amount <= 0) {
            throw new common_1.BadRequestException('Withdrawal amount must be a positive number');
        }
        if (!method) {
            throw new common_1.BadRequestException('Withdrawal method is required');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });
            if (!wallet) {
                throw new common_1.NotFoundException('Wallet not found');
            }
            const available = Number(wallet.availableBalance);
            if (available < amount) {
                throw new common_1.BadRequestException(`Insufficient available funds. Available: ₹${available.toLocaleString('en-IN')}`);
            }
            const sequence = await tx.withdrawal.count();
            const withdrawalId = `WD-${String(sequence + 1001).padStart(6, '0')}`;
            const detailsStr = typeof accountDetails === 'object' ? JSON.stringify(accountDetails) : String(accountDetails);
            const nextAvailable = available - amount;
            const nextPending = Number(wallet.pendingWithdrawals) + amount;
            await tx.wallet.update({
                where: { id: wallet.id },
                data: {
                    availableBalance: nextAvailable,
                    pendingWithdrawals: nextPending,
                },
            });
            const withdrawal = await tx.withdrawal.create({
                data: {
                    withdrawalId,
                    userId,
                    partnerId,
                    amount: new client_1.Prisma.Decimal(amount),
                    currency: wallet.currency || 'INR',
                    status: 'PENDING',
                    method,
                    accountDetails: detailsStr,
                    notes: notes || null,
                },
            });
            return withdrawal;
        });
        return result;
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map