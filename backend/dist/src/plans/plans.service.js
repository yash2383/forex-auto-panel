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
    async getActivePlans() {
        const plans = await this.prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
        return { plans };
    }
    async getPlanById(idOrSlug) {
        let plan = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        if (isUuid) {
            plan = await this.prisma.plan.findUnique({ where: { id: idOrSlug } });
        }
        if (!plan) {
            const activePlans = await this.prisma.plan.findMany({ where: { isActive: true } });
            plan = activePlans.find(p => p.name.split(" ")[0].toLowerCase() === idOrSlug.toLowerCase());
        }
        if (!plan || !plan.isActive)
            return null;
        return {
            plan: {
                ...plan,
                amount: plan.amount !== null ? Number(plan.amount) : null,
                weeklyProfit: Number(plan.weeklyProfit),
                durationDays: Number(plan.durationDays),
            },
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
        const amountVal = data.amount !== undefined && data.amount !== null && data.amount !== '' ? Number(data.amount) : null;
        if (amountVal === null && pricingType === 'FIXED') {
            throw new Error('Plan must have a fixed amount if pricingType is FIXED.');
        }
        const plan = await this.prisma.plan.create({
            data: {
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
        let amountVal = data.amount !== undefined ? (data.amount !== null && data.amount !== '' ? Number(data.amount) : null) : (current.amount ? Number(current.amount) : null);
        if (pricingType === 'FLEXIBLE') {
            data.amount = null;
        }
        else if (pricingType === 'FIXED' && amountVal === null) {
            throw new Error('Plan must have a fixed amount if pricingType is FIXED.');
        }
        const plan = await this.prisma.plan.update({
            where: { id },
            data,
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