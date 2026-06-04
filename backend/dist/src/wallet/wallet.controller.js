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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getWallet(req) {
        try {
            const user = req.user;
            return await this.walletService.getWalletData(user.id);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Internal server error', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWithdrawals(req) {
        try {
            const user = req.user;
            const withdrawals = await this.walletService.getWithdrawals(user.id);
            return withdrawals.map((w) => {
                let parsedDetails = w.accountDetails;
                try {
                    if (w.accountDetails) {
                        parsedDetails = JSON.parse(w.accountDetails);
                    }
                }
                catch {
                }
                return {
                    id: w.id,
                    withdrawalId: w.withdrawalId,
                    amount: Number(w.amount),
                    status: w.status,
                    method: w.method,
                    accountDetails: parsedDetails,
                    notes: w.notes,
                    createdAt: w.createdAt,
                    processedAt: w.processedAt,
                };
            });
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Internal server error', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async createWithdrawal(req, body) {
        try {
            const user = req.user;
            const withdrawal = await this.walletService.createWithdrawal(user.id, user.partnerId, body.amount, body.method, body.accountDetails, body.notes);
            return { success: true, withdrawal };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'Internal server error', error.status || common_1.HttpStatus.BAD_REQUEST);
        }
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Get)('withdrawals'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWithdrawals", null);
__decorate([
    (0, common_1.Post)('withdrawals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "createWithdrawal", null);
exports.WalletController = WalletController = __decorate([
    (0, common_1.Controller)('wallet'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('USER'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map