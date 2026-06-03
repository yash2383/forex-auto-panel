"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const notifications_service_1 = require("./notifications.service");
const notifications_gateway_1 = require("./notifications.gateway");
const notifications_processor_1 = require("./notifications.processor");
const notifications_cron_1 = require("./notifications.cron");
const prisma_module_1 = require("../prisma/prisma.module");
const notifications_controller_1 = require("./notifications.controller");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bull_1.BullModule.registerQueue({ name: 'notifications-push' }, { name: 'notifications-email' }, { name: 'notifications-socket' }, { name: 'notifications-sms' }, { name: 'notifications-dlq' }),
        ],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [
            notifications_service_1.NotificationsService,
            notifications_gateway_1.NotificationsGateway,
            notifications_processor_1.PushProcessor,
            notifications_processor_1.EmailProcessor,
            notifications_processor_1.SocketProcessor,
            notifications_processor_1.SmsProcessor,
            notifications_processor_1.DlqProcessor,
            notifications_cron_1.NotificationsCron,
        ],
        exports: [notifications_service_1.NotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map