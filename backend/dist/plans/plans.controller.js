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
exports.PlansController = void 0;
const common_1 = require("@nestjs/common");
const plans_service_1 = require("./plans.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let PlansController = class PlansController {
    plansService;
    constructor(plansService) {
        this.plansService = plansService;
    }
    async getPlans(res) {
        try {
            const result = await this.plansService.getActivePlans();
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch active plans error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getAllPlans(res) {
        try {
            const result = await this.plansService.getAllPlans();
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch all plans error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createPlan(body, res) {
        try {
            const result = await this.plansService.createPlan(body);
            return res.json(result);
        }
        catch (error) {
            console.error('Create plan error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updatePlan(id, body, res) {
        try {
            const result = await this.plansService.updatePlan(id, body);
            return res.json(result);
        }
        catch (error) {
            console.error('Update plan error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async deletePlan(id, res) {
        try {
            const result = await this.plansService.deletePlan(id);
            return res.json(result);
        }
        catch (error) {
            console.error('Delete plan error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
};
exports.PlansController = PlansController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "getAllPlans", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PlansController.prototype, "deletePlan", null);
exports.PlansController = PlansController = __decorate([
    (0, common_1.Controller)('plans'),
    __metadata("design:paramtypes", [plans_service_1.PlansService])
], PlansController);
//# sourceMappingURL=plans.controller.js.map