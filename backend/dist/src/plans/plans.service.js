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
exports.PlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlansService = class PlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    slugify(value) {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+plan$/i, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    serializePlan(plan) {
        return {
            ...plan,
            amount: plan.amount !== null ? Number(plan.amount) : null,
            weeklyProfit: Number(plan.weeklyProfit),
            durationDays: Number(plan.durationDays),
        };
    }
    async getActivePlans() {
        const plans = await this.prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        return { plans: plans.map((plan) => this.serializePlan(plan)) };
    }
    async getPlanById(id) {
        const plan = await this.prisma.plan.findUnique({ where: { id } });
        if (!plan || !plan.isActive)
            return null;
        return { plan: this.serializePlan(plan) };
    }
    async getPlanBySlug(slug) {
        if (!slug || slug === 'undefined')
            return null;
        const normalizedSlug = this.slugify(slug);
        const plan = await this.prisma.plan.findFirst({
            where: {
                isActive: true,
                OR: [{ slug: normalizedSlug }, { slug }],
            },
        });
        if (!plan)
            return null;
        return { plan: this.serializePlan(plan) };
    }
    async getPaymentMethods() {
        const settings = await this.prisma.systemSettings.findFirst();
        return {
            success: true,
            methods: [
                {
                    key: 'USDT',
                    enabled: settings?.usdtEnabled ?? true,
                    walletAddress: settings?.usdtAddress || 'TXYZ123ABC456DEF789GHI',
                    network: settings?.usdtNetwork || 'TRC20',
                    usdtQrCode: settings?.usdtQrCode || '',
                },
                {
                    key: 'UPI',
                    enabled: settings?.upiEnabled ?? !!settings?.upiId,
                    upiId: settings?.upiId || '',
                    upiName: settings?.upiName || '',
                    upiQrCode: settings?.upiQrCode || '',
                },
            ],
        };
    }
    async getAllPlans() {
        const plans = await this.prisma.plan.findMany({
            orderBy: { sortOrder: 'asc' },
        });
        return { plans };
    }
    async createPlan(data) {
        const pricingType = data.pricingType || 'FIXED';
        const amountVal = data.amount !== undefined && data.amount !== null && data.amount !== ''
            ? Number(data.amount)
            : null;
        if (amountVal === null && pricingType === 'FIXED') {
            throw new Error('Plan must have a fixed amount if pricingType is FIXED.');
        }
        const plan = await this.prisma.plan.create({
            data: {
                slug: data.slug ? this.slugify(data.slug) : this.slugify(data.name),
                name: data.name,
                subtitle: data.subtitle || '',
                capitalLabel: data.capitalLabel || '',
                desc: data.desc || '',
                features: data.features || [],
                btnText: data.btnText || 'Get Started',
                status: data.status || 'Active',
                isPopular: data.isPopular || false,
                amount: pricingType === 'FLEXIBLE' ? null : amountVal,
                pricingType: pricingType,
                weeklyProfit: data.weeklyProfit || 5,
                durationDays: data.durationDays || 30,
                sortOrder: data.sortOrder || 0,
                isActive: data.isActive !== undefined ? data.isActive : true,
            },
        });
        return { plan };
    }
    async updatePlan(id, data) {
        const current = await this.prisma.plan.findUnique({ where: { id } });
        if (!current)
            throw new Error('Plan not found');
        const pricingType = data.pricingType || current.pricingType;
        const amountVal = data.amount !== undefined
            ? data.amount !== null && data.amount !== ''
                ? Number(data.amount)
                : null
            : current.amount
                ? Number(current.amount)
                : null;
        if (pricingType === 'FLEXIBLE') {
            data.amount = null;
        }
        else if (pricingType === 'FIXED' && amountVal === null) {
            throw new Error('Plan must have a fixed amount if pricingType is FIXED.');
        }
        const plan = await this.prisma.plan.update({
            where: { id },
            data: {
                ...data,
                slug: data.slug !== undefined
                    ? this.slugify(data.slug)
                    : data.name !== undefined
                        ? this.slugify(data.name)
                        : current.slug,
            },
        });
        return { plan };
    }
    async deletePlan(id) {
        const plan = await this.prisma.plan.update({
            where: { id },
            data: { isActive: false },
        });
        return { plan };
    }
};
exports.PlansService = PlansService;
exports.PlansService = PlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlansService);
//# sourceMappingURL=plans.service.js.map