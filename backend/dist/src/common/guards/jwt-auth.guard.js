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
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto_util_1 = require("../crypto.util");
const prisma_service_1 = require("../../prisma/prisma.service");
let JwtAuthGuard = class JwtAuthGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Not authenticated');
        }
        const token = authHeader.split(' ')[1];
        const payload = (0, crypto_util_1.verifyJwt)(token);
        if (!payload) {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        let exists = false;
        if (payload.role === 'SUPER_ADMIN' ||
            payload.role === 'MANAGER' ||
            payload.role === 'VIEWER') {
            const admin = await this.prisma.admin.findUnique({
                where: { id: payload.id },
            });
            exists = !!admin;
        }
        else if (payload.role === 'PARTNER') {
            const partner = await this.prisma.partner.findUnique({
                where: { id: payload.id },
            });
            exists = !!partner;
        }
        else {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.id },
            });
            exists = !!user;
        }
        if (!exists) {
            throw new common_1.UnauthorizedException('User no longer exists. Please log in again.');
        }
        request.user = payload;
        return true;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map