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
exports.MaintenanceGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
const allow_during_maintenance_decorator_1 = require("../decorators/allow-during-maintenance.decorator");
const public_decorator_1 = require("../decorators/public.decorator");
const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'MANAGER', 'VIEWER']);
const SETTINGS_TTL_MS = 30_000;
let MaintenanceGuard = class MaintenanceGuard {
    reflector;
    prisma;
    cachedMaintenance = null;
    lastFetchedAt = 0;
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const allowDuring = this.reflector.getAllAndOverride(allow_during_maintenance_decorator_1.ALLOW_DURING_MAINTENANCE_KEY, [context.getHandler(), context.getClass()]);
        if (allowDuring)
            return true;
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic)
            return true;
        const maintenanceMode = await this.getMaintenanceMode();
        if (!maintenanceMode)
            return true;
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user?.role && ADMIN_ROLES.has(user.role))
            return true;
        throw new common_1.ServiceUnavailableException('The platform is currently under maintenance. Please try again later.');
    }
    async getMaintenanceMode() {
        const now = Date.now();
        if (this.cachedMaintenance !== null &&
            now - this.lastFetchedAt < SETTINGS_TTL_MS) {
            return this.cachedMaintenance;
        }
        const settings = await this.prisma.systemSettings.findFirst({
            select: { maintenanceMode: true },
        });
        this.cachedMaintenance = settings?.maintenanceMode ?? false;
        this.lastFetchedAt = now;
        return this.cachedMaintenance;
    }
};
exports.MaintenanceGuard = MaintenanceGuard;
exports.MaintenanceGuard = MaintenanceGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], MaintenanceGuard);
//# sourceMappingURL=maintenance.guard.js.map