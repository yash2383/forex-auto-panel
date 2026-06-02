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
exports.TradesController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_util_1 = require("../common/crypto.util");
let TradesController = class TradesController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicTrades(req, res) {
        try {
            const authHeader = req.headers['authorization'];
            let isSubscribed = false;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const payload = (0, crypto_util_1.verifyJwt)(token);
                if (payload) {
                    const user = await this.prisma.user.findUnique({
                        where: { id: payload.id },
                    });
                    if (user && (user.status === 'ACTIVE' || user.status === 'VIP')) {
                        isSubscribed = true;
                    }
                }
            }
            const totalCount = await this.prisma.tradeRecord.count({
                where: { status: 'published' },
            });
            const visibleCount = isSubscribed ? 1000 : 10;
            const trades = await this.prisma.tradeRecord.findMany({
                where: { status: 'published' },
                orderBy: { tradeDate: 'desc' },
                take: visibleCount,
            });
            return res.json({
                trades,
                totalCount,
                visibleCount: Math.min(totalCount, visibleCount),
                isSubscribed,
            });
        }
        catch (error) {
            console.error('Fetch public trades error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Internal server error',
            });
        }
    }
};
exports.TradesController = TradesController;
__decorate([
    (0, common_1.Get)('public'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TradesController.prototype, "getPublicTrades", null);
exports.TradesController = TradesController = __decorate([
    (0, common_1.Controller)('trades'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TradesController);
//# sourceMappingURL=trades.controller.js.map