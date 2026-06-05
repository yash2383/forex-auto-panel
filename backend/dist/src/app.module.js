"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const schedule_1 = require("@nestjs/schedule");
const bull_1 = require("@nestjs/bull");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const trade_module_1 = require("./trade/trade.module");
const plans_module_1 = require("./plans/plans.module");
const admin_module_1 = require("./admin/admin.module");
const reports_module_1 = require("./reports/reports.module");
const user_module_1 = require("./user/user.module");
const wallet_module_1 = require("./wallet/wallet.module");
const investment_module_1 = require("./investment/investment.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const notifications_module_1 = require("./notifications/notifications.module");
const observability_module_1 = require("./observability/observability.module");
const dev_module_1 = require("./dev/dev.module");
const maintenance_guard_1 = require("./common/guards/maintenance.guard");
const optionalModules = [];
if (process.env.NODE_ENV !== 'production') {
    optionalModules.push(dev_module_1.DevModule);
}
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    password: process.env.REDIS_PASSWORD || undefined,
                    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
                },
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            dashboard_module_1.DashboardModule,
            trade_module_1.TradeModule,
            plans_module_1.PlansModule,
            admin_module_1.AdminModule,
            reports_module_1.ReportsModule,
            user_module_1.UserModule,
            wallet_module_1.WalletModule,
            investment_module_1.InvestmentModule,
            notifications_module_1.NotificationsModule,
            observability_module_1.ObservabilityModule,
            ...optionalModules,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: maintenance_guard_1.MaintenanceGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map