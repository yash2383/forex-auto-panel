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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getClientIp(req) {
        return req.headers['x-forwarded-for'] || '127.0.0.1';
    }
    async getData(res) {
        try {
            const result = await this.adminService.getData();
            return res.json(result);
        }
        catch (error) {
            console.error('Admin data load error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getPnlReports(res) {
        try {
            const result = await this.adminService.getPnlReports();
            return res.json(result);
        }
        catch (error) {
            console.error('Admin pnl reports error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createUser(req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.createUser(user.id, body, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Create user error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateUser(id, req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.updateUser(user.id, id, body, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Update user error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async deleteUser(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.deleteUser(user.id, id, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Delete user error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getUserDetail(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.getUserDetail(user.id, id);
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Get user detail error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createPartner(req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.createPartner(user.id, body, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Create partner error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createPlan(req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.createPlan(user.id, body, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Create plan error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updatePlan(id, req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.updatePlan(user.id, id, body, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Update plan error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async deletePlan(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.deletePlan(user.id, id, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Delete plan error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getSettings(res) {
        try {
            const result = await this.adminService.getSettings();
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch settings error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateSettings(req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.updateSettings(user.id, body, this.getClientIp(req));
            return res.json(result);
        }
        catch (error) {
            console.error('Save settings error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getReferralSettings(res) {
        try {
            const result = await this.adminService.getReferralSettings();
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch referral settings error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateReferralSettings(req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.updateReferralSettings(user.id, body, this.getClientIp(req));
            return res.json(result);
        }
        catch (error) {
            console.error('Save referral settings error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getReferrals(res) {
        try {
            const result = await this.adminService.getReferrals();
            return res.json(result);
        }
        catch (error) {
            console.error('Get referrals error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateReferralStatus(id, status, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.updateReferralStatus(user.id, id, status, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Update referral status error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getTrades(res) {
        try {
            const result = await this.adminService.listTradeRecords();
            return res.json(result);
        }
        catch (error) {
            console.error('Get trades error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createTradeRecord(body, res) {
        try {
            const result = await this.adminService.createTradeRecord(body);
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Create trade record error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateTradeRecord(id, body, res) {
        try {
            const result = await this.adminService.updateTradeRecord(id, body);
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Update trade record error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async deleteTradeRecord(id, res) {
        try {
            const result = await this.adminService.deleteTradeRecord(id);
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Delete trade record error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async publishTradeRecord(id, res) {
        try {
            const result = await this.adminService.setTradeRecordStatus(id, 'published');
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Publish trade record error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async unpublishTradeRecord(id, res) {
        try {
            const result = await this.adminService.setTradeRecordStatus(id, 'draft');
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Unpublish trade record error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async approvePayment(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.approvePayment(user.id, id, this.getClientIp(req));
            return res.json(result);
        }
        catch (error) {
            console.error('Approve payment error:', error.message);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
        }
    }
    async rejectPayment(id, req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.rejectPayment(user.id, id, body.remark || '', this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Reject payment error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async verifyPayment(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.verifyPayment(user.id, id, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Verify payment error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async listWithdrawals(res) {
        try {
            const result = await this.adminService.listWithdrawals();
            return res.json(result);
        }
        catch (error) {
            console.error('List withdrawals error:', error.message);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
        }
    }
    async getWithdrawalDetail(id, res) {
        try {
            const result = await this.adminService.getWithdrawalDetail(id);
            return res.json(result);
        }
        catch (error) {
            console.error('Get withdrawal details error:', error.message);
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: error.message || 'Withdrawal not found' });
        }
    }
    async approveWithdrawal(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.approveWithdrawal(user.id, id, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Approve withdrawal error:', error.message);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
        }
    }
    async rejectWithdrawal(id, req, res) {
        try {
            const user = req.user;
            const result = await this.adminService.rejectWithdrawal(user.id, id, this.getClientIp(req));
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Reject withdrawal error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async reverseTransaction(id, req, body, res) {
        try {
            const user = req.user;
            const result = await this.adminService.reverseTransaction(user.id, id, body.reason, this.getClientIp(req));
            return res.json(result);
        }
        catch (error) {
            console.error('Reverse transaction error:', error.message);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message || 'Internal server error' });
        }
    }
    async createProfitDistribution(body, res) {
        try {
            const result = await this.adminService.createProfitDistribution(body);
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Create profit distribution error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateProfitDistribution(id, body, res) {
        try {
            const result = await this.adminService.updateProfitDistribution(id, body);
            if ('error' in result)
                return res.status(result.status || 400).json({ message: result.error });
            return res.json(result);
        }
        catch (error) {
            console.error('Update profit distribution error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async deleteProfitDistribution(id, res) {
        try {
            const result = await this.adminService.deleteProfitDistribution(id);
            return res.json(result);
        }
        catch (error) {
            console.error('Delete profit distribution error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('data'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getData", null);
__decorate([
    (0, common_1.Get)('pnl-reports'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPnlReports", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Post)('partners'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPartner", null);
__decorate([
    (0, common_1.Post)('plans'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('referral-settings'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReferralSettings", null);
__decorate([
    (0, common_1.Post)('referral-settings'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateReferralSettings", null);
__decorate([
    (0, common_1.Get)('referrals'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReferrals", null);
__decorate([
    (0, common_1.Post)('referrals/:id/status'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateReferralStatus", null);
__decorate([
    (0, common_1.Get)('trades'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTrades", null);
__decorate([
    (0, common_1.Post)('trades'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTradeRecord", null);
__decorate([
    (0, common_1.Put)('trades/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTradeRecord", null);
__decorate([
    (0, common_1.Delete)('trades/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteTradeRecord", null);
__decorate([
    (0, common_1.Patch)('trades/:id/publish'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "publishTradeRecord", null);
__decorate([
    (0, common_1.Patch)('trades/:id/unpublish'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unpublishTradeRecord", null);
__decorate([
    (0, common_1.Post)('payments/:id/approve'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approvePayment", null);
__decorate([
    (0, common_1.Post)('payments/:id/reject'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectPayment", null);
__decorate([
    (0, common_1.Post)('payments/:id/verify'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "listWithdrawals", null);
__decorate([
    (0, common_1.Get)('withdrawals/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getWithdrawalDetail", null);
__decorate([
    (0, common_1.Post)('withdrawals/:id/approve'),
    (0, common_1.Patch)('withdrawals/:id/approve'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveWithdrawal", null);
__decorate([
    (0, common_1.Post)('withdrawals/:id/reject'),
    (0, common_1.Patch)('withdrawals/:id/reject'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectWithdrawal", null);
__decorate([
    (0, common_1.Post)('transactions/:id/reverse'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "reverseTransaction", null);
__decorate([
    (0, common_1.Post)('profit-distributions'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createProfitDistribution", null);
__decorate([
    (0, common_1.Put)('profit-distributions/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateProfitDistribution", null);
__decorate([
    (0, common_1.Delete)('profit-distributions/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteProfitDistribution", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map