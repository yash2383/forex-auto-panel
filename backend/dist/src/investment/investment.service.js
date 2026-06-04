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
exports.InvestmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ledger_util_1 = require("../common/ledger.util");
let InvestmentService = class InvestmentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPlansAdmin(partnerId) {
        const plans = await this.prisma.investmentPlan.findMany({
            where: { partnerId },
            orderBy: { createdAt: 'desc' },
            include: {
                userInvestments: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                    },
                },
            },
        });
        return plans.map((p) => {
            const activeInvestments = p.userInvestments.filter((ui) => ui.status === 'ACTIVE');
            const totalInvested = activeInvestments.reduce((sum, ui) => sum + Number(ui.amount), 0);
            const weeklyLiability = activeInvestments.reduce((sum, ui) => sum + (Number(ui.amount) * Number(p.weeklyProfit)) / 100, 0);
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                image: p.image,
                minAmount: Number(p.minAmount),
                maxAmount: Number(p.maxAmount),
                weeklyProfit: Number(p.weeklyProfit),
                lockPeriod: p.lockPeriod,
                referralBonus: Number(p.referralBonus),
                status: p.status,
                investorsCount: activeInvestments.length,
                totalInvested,
                weeklyLiability,
                createdAt: p.createdAt,
            };
        });
    }
    async getPlanInvestors(planId) {
        const investments = await this.prisma.userInvestment.findMany({
            where: { planId },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return investments.map((ui) => ({
            id: ui.id,
            amount: Number(ui.amount),
            profitRate: Number(ui.profitRate),
            startDate: ui.startDate,
            nextProfitDate: ui.nextProfitDate,
            status: ui.status,
            userName: ui.user?.name || 'Unknown',
            userEmail: ui.user?.email || 'Unknown',
            createdAt: ui.createdAt,
        }));
    }
    async createPlan(partnerId, data) {
        if (data.minAmount <= 0 || data.maxAmount < data.minAmount) {
            throw new common_1.BadRequestException('Invalid min/max investment bounds.');
        }
        if (data.weeklyProfit < 0 || data.weeklyProfit > 100) {
            throw new common_1.BadRequestException('Weekly profit rate must be between 0% and 100%.');
        }
        return this.prisma.investmentPlan.create({
            data: {
                partnerId,
                name: data.name,
                description: data.description || null,
                image: data.image || null,
                minAmount: data.minAmount,
                maxAmount: data.maxAmount,
                weeklyProfit: data.weeklyProfit,
                lockPeriod: data.lockPeriod,
                referralBonus: data.referralBonus,
                status: data.status !== undefined ? data.status : true,
            },
        });
    }
    async updatePlan(planId, data) {
        const plan = await this.prisma.investmentPlan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Investment plan not found.');
        }
        const updateData = { ...data };
        if (data.minAmount !== undefined || data.maxAmount !== undefined) {
            const min = data.minAmount !== undefined ? data.minAmount : Number(plan.minAmount);
            const max = data.maxAmount !== undefined ? data.maxAmount : Number(plan.maxAmount);
            if (min <= 0 || max < min) {
                throw new common_1.BadRequestException('Invalid min/max investment bounds.');
            }
        }
        if (data.weeklyProfit !== undefined &&
            (data.weeklyProfit < 0 || data.weeklyProfit > 100)) {
            throw new common_1.BadRequestException('Weekly profit rate must be between 0% and 100%.');
        }
        return this.prisma.investmentPlan.update({
            where: { id: planId },
            data: updateData,
        });
    }
    async deletePlan(planId) {
        const plan = await this.prisma.investmentPlan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Investment plan not found.');
        }
        const activeInvestmentsCount = await this.prisma.userInvestment.count({
            where: { planId, status: 'ACTIVE' },
        });
        if (activeInvestmentsCount > 0) {
            throw new common_1.BadRequestException('Cannot delete plan with active user investments.');
        }
        await this.prisma.investmentPlan.delete({ where: { id: planId } });
        return { success: true };
    }
    async getActivePlansUser(partnerId) {
        const plans = await this.prisma.investmentPlan.findMany({
            where: { partnerId, status: true },
            orderBy: { createdAt: 'desc' },
        });
        return plans.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            image: p.image,
            minAmount: Number(p.minAmount),
            maxAmount: Number(p.maxAmount),
            weeklyProfit: Number(p.weeklyProfit),
            lockPeriod: p.lockPeriod,
            referralBonus: Number(p.referralBonus),
            status: p.status,
        }));
    }
    async getUserInvestments(userId) {
        const investments = await this.prisma.userInvestment.findMany({
            where: { userId },
            include: {
                plan: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return investments.map((ui) => ({
            id: ui.id,
            planName: ui.plan?.name || 'Unknown Plan',
            amount: Number(ui.amount),
            profitRate: Number(ui.profitRate),
            startDate: ui.startDate,
            nextProfitDate: ui.nextProfitDate,
            status: ui.status,
            createdAt: ui.createdAt,
        }));
    }
    async createInvestment(userId, partnerId, planId, amount) {
        if (amount <= 0) {
            throw new common_1.BadRequestException('Investment amount must be greater than zero.');
        }
        return this.prisma.$transaction(async (tx) => {
            const plan = await tx.investmentPlan.findFirst({
                where: { id: planId, partnerId, status: true },
            });
            if (!plan) {
                throw new common_1.NotFoundException('Active investment plan not found.');
            }
            if (amount < Number(plan.minAmount) || amount > Number(plan.maxAmount)) {
                throw new common_1.BadRequestException(`Investment amount must be between ₹${Number(plan.minAmount).toLocaleString()} and ₹${Number(plan.maxAmount).toLocaleString()}.`);
            }
            const wallet = await tx.wallet.findUnique({
                where: { userId },
            });
            if (!wallet) {
                throw new common_1.BadRequestException('User wallet not found.');
            }
            if (Number(wallet.availableBalance) < amount) {
                throw new common_1.BadRequestException('Insufficient wallet balance to proceed with this investment.');
            }
            const idempotencyKey = `INVEST_${userId}_${planId}_${Date.now()}`;
            await (0, ledger_util_1.createTransactionGroup)(tx, {
                type: 'SYSTEM_ADJUSTMENT',
                description: `Invested in ${plan.name}`,
                idempotencyKey,
                entries: [
                    {
                        userId,
                        partnerId,
                        accountType: 'USER',
                        entryType: 'DEBIT',
                        amount,
                        currency: wallet.currency || 'INR',
                    },
                    {
                        accountType: 'SYSTEM',
                        entryType: 'CREDIT',
                        amount,
                        currency: wallet.currency || 'INR',
                    },
                ],
            });
            const startDate = new Date();
            const nextProfitDate = new Date(startDate);
            nextProfitDate.setDate(nextProfitDate.getDate() + 7);
            const userInvestment = await tx.userInvestment.create({
                data: {
                    partnerId,
                    userId,
                    planId,
                    amount,
                    profitRate: plan.weeklyProfit,
                    startDate,
                    nextProfitDate,
                    status: 'ACTIVE',
                },
            });
            return {
                success: true,
                investment: {
                    id: userInvestment.id,
                    amount: Number(userInvestment.amount),
                    profitRate: Number(userInvestment.profitRate),
                    startDate: userInvestment.startDate,
                    nextProfitDate: userInvestment.nextProfitDate,
                    status: userInvestment.status,
                },
            };
        });
    }
};
exports.InvestmentService = InvestmentService;
exports.InvestmentService = InvestmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InvestmentService);
//# sourceMappingURL=investment.service.js.map