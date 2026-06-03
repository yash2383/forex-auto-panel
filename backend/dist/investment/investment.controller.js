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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentController = void 0;
const common_1 = require("@nestjs/common");
const investment_service_1 = require("./investment.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let InvestmentController = class InvestmentController {
    investmentService;
    constructor(investmentService) {
        this.investmentService = investmentService;
    }
    async getPlansAdmin(partnerId, res) {
        try {
            if (!partnerId) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'partnerId is required.' });
            }
            const result = await this.investmentService.getPlansAdmin(partnerId);
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch admin investment plans error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getPlanInvestors(planId, res) {
        try {
            const result = await this.investmentService.getPlanInvestors(planId);
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch plan investors error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createPlan(body, res) {
        try {
            const { partnerId, name, description, image, minAmount, maxAmount, weeklyProfit, lockPeriod, referralBonus, status } = body;
            if (!partnerId || !name || minAmount === undefined || maxAmount === undefined || weeklyProfit === undefined || lockPeriod === undefined || referralBonus === undefined) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields.' });
            }
            const result = await this.investmentService.createPlan(partnerId, {
                name,
                description,
                image,
                minAmount: Number(minAmount),
                maxAmount: Number(maxAmount),
                weeklyProfit: Number(weeklyProfit),
                lockPeriod: Number(lockPeriod),
                referralBonus: Number(referralBonus),
                status,
            });
            return res.json({ success: true, plan: result });
        }
        catch (error) {
            console.error('Create investment plan error:', error);
            const status = error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({ message: error.message || 'Internal server error' });
        }
    }
    async updatePlan(planId, body, res) {
        try {
            const result = await this.investmentService.updatePlan(planId, body);
            return res.json({ success: true, plan: result });
        }
        catch (error) {
            console.error('Update investment plan error:', error);
            const status = error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({ message: error.message || 'Internal server error' });
        }
    }
    async deletePlan(planId, res) {
        try {
            const result = await this.investmentService.deletePlan(planId);
            return res.json(result);
        }
        catch (error) {
            console.error('Delete investment plan error:', error);
            const status = error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({ message: error.message || 'Internal server error' });
        }
    }
    async getActivePlansUser(req, res) {
        try {
            const user = req.user;
            const result = await this.investmentService.getActivePlansUser(user.partnerId);
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch active plans error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getUserInvestments(req, res) {
        try {
            const user = req.user;
            const result = await this.investmentService.getUserInvestments(user.id);
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch user investments error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createInvestment(req, body, res) {
        try {
            const user = req.user;
            const { planId, amount } = body;
            if (!planId || amount === undefined) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'planId and amount are required.' });
            }
            const result = await this.investmentService.createInvestment(user.id, user.partnerId, planId, Number(amount));
            return res.json(result);
        }
        catch (error) {
            console.error('Create user investment error:', error);
            const status = error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            return res.status(status).json({ message: error.message || 'Internal server error' });
        }
    }
};
exports.InvestmentController = InvestmentController;
__decorate([
    (0, common_1.Get)('admin/investment-plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Query)('partnerId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "getPlansAdmin", null);
__decorate([
    (0, common_1.Get)('admin/investment-plans/:id/investors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "getPlanInvestors", null);
__decorate([
    (0, common_1.Post)('admin/investment-plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('admin/investment-plans/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('admin/investment-plans/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('investments/plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "getActivePlansUser", null);
__decorate([
    (0, common_1.Get)('investments/active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "getUserInvestments", null);
__decorate([
    (0, common_1.Post)('investments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], InvestmentController.prototype, "createInvestment", null);
exports.InvestmentController = InvestmentController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [investment_service_1.InvestmentService])
], InvestmentController);
//# sourceMappingURL=investment.controller.js.map