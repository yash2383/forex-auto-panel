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
exports.TradeController = void 0;
const common_1 = require("@nestjs/common");
const trade_service_1 = require("./trade.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
let TradeController = class TradeController {
    tradeService;
    constructor(tradeService) {
        this.tradeService = tradeService;
    }
    async listTrades(req, res) {
        try {
            const user = req.user;
            const result = await this.tradeService.listTrades(user.id);
            return res.json(result);
        }
        catch (error) {
            console.error('Fetch trades API error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createTrade(req, body, res) {
        try {
            const user = req.user;
            const result = await this.tradeService.createTrade(user.id, body);
            if ('error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            return res.json(result);
        }
        catch (error) {
            console.error('Manual trade create API error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async closeTrade(req, body, res) {
        try {
            const user = req.user;
            const result = await this.tradeService.closeTrade(user.id, body.tradeId);
            if ('error' in result) {
                return res.status(result.status || 400).json({ message: result.error });
            }
            return res.json(result);
        }
        catch (error) {
            console.error('Manual trade close API error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
};
exports.TradeController = TradeController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradeController.prototype, "listTrades", null);
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], TradeController.prototype, "createTrade", null);
__decorate([
    (0, common_1.Post)('close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], TradeController.prototype, "closeTrade", null);
exports.TradeController = TradeController = __decorate([
    (0, common_1.Controller)('trade'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('USER', 'SUPER_ADMIN', 'MANAGER', 'VIEWER', 'PARTNER'),
    __metadata("design:paramtypes", [trade_service_1.TradeService])
], TradeController);
//# sourceMappingURL=trade.controller.js.map