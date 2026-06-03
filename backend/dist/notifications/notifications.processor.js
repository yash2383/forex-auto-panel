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
var PushProcessor_1, EmailProcessor_1, SocketProcessor_1, SmsProcessor_1, DlqProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DlqProcessor = exports.SmsProcessor = exports.SocketProcessor = exports.EmailProcessor = exports.PushProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const bull_2 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_gateway_1 = require("./notifications.gateway");
async function handleDeliveryFailure(prisma, dlqQueue, logger, job, deliveryId, queueName, error) {
    const maxAttempts = job.opts.attempts || 5;
    const isFinalAttempt = job.attemptsMade >= maxAttempts;
    logger.error(`Delivery failure for job ${job.id} (Attempt ${job.attemptsMade}/${maxAttempts}) in queue ${queueName}: ${error.message}`);
    await prisma.notificationDelivery.update({
        where: { id: deliveryId },
        data: {
            status: isFinalAttempt
                ? client_1.NotificationDeliveryStatus.FAILED
                : client_1.NotificationDeliveryStatus.PENDING,
            error: error.message,
        },
    });
    if (isFinalAttempt) {
        logger.warn(`Job ${job.id} exceeded max attempts. Routing to notifications-dlq.`);
        try {
            await dlqQueue.add('failed-job', {
                notificationId: job.data.notificationId,
                originalQueue: queueName,
                attempts: job.attemptsMade,
                error: error.message,
                payload: job.data,
                failedAt: new Date(),
            });
        }
        catch (dlqErr) {
            logger.error(`Failed to route job ${job.id} to DLQ queue: ${dlqErr.message}`);
        }
    }
}
let PushProcessor = PushProcessor_1 = class PushProcessor {
    prisma;
    dlqQueue;
    logger = new common_1.Logger(PushProcessor_1.name);
    constructor(prisma, dlqQueue) {
        this.prisma = prisma;
        this.dlqQueue = dlqQueue;
    }
    async handleDelivery(job) {
        const { deliveryId, notificationId, userId, title, body, link, payload } = job.data;
        this.logger.log(`Processing push job ${job.id} for delivery: ${deliveryId}`);
        const delivery = await this.prisma.notificationDelivery.findUnique({
            where: { id: deliveryId },
        });
        if (!delivery || delivery.status === client_1.NotificationDeliveryStatus.DELIVERED) {
            return;
        }
        try {
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    retryCount: delivery.retryCount + 1,
                    lastRetryAt: new Date(),
                },
            });
            await this.sendPushNotification(userId, title, body, link, payload);
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.NotificationDeliveryStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            });
        }
        catch (err) {
            await handleDeliveryFailure(this.prisma, this.dlqQueue, this.logger, job, deliveryId, 'notifications-push', err);
            throw err;
        }
    }
    async sendPushNotification(userId, title, body, link, payload) {
        if (!userId)
            return;
        const tokens = await this.prisma.deviceToken.findMany({
            where: { userId, isActive: true },
        });
        if (tokens.length === 0) {
            this.logger.log(`No active device tokens found for user ${userId}. Push skipped.`);
            return;
        }
        for (const device of tokens) {
            try {
                this.logger.log(`Sending FCM push to token ${device.token.substring(0, 10)}... for user ${userId}`);
                await this.prisma.deviceToken.update({
                    where: { id: device.id },
                    data: { lastUsedAt: new Date() },
                });
            }
            catch (err) {
                this.logger.error(`FCM send failed for token ${device.id}: ${err.message}`);
                const isBadToken = err.code === 'messaging/invalid-registration-token' ||
                    err.code === 'messaging/registration-token-not-registered' ||
                    err.message.includes('not registered') ||
                    err.message.includes('invalid');
                if (isBadToken) {
                    this.logger.warn(`Deactivating invalid FCM token: ${device.id}`);
                    await this.prisma.deviceToken.update({
                        where: { id: device.id },
                        data: {
                            isActive: false,
                            failureCount: { increment: 1 },
                        },
                    });
                }
            }
        }
    }
};
exports.PushProcessor = PushProcessor;
__decorate([
    (0, bull_1.Process)('deliver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PushProcessor.prototype, "handleDelivery", null);
exports.PushProcessor = PushProcessor = PushProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications-push'),
    __param(1, (0, bull_2.InjectQueue)('notifications-dlq')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], PushProcessor);
let EmailProcessor = EmailProcessor_1 = class EmailProcessor {
    prisma;
    dlqQueue;
    logger = new common_1.Logger(EmailProcessor_1.name);
    constructor(prisma, dlqQueue) {
        this.prisma = prisma;
        this.dlqQueue = dlqQueue;
    }
    async handleDelivery(job) {
        const { deliveryId, notificationId, userId, title, body, link, payload } = job.data;
        this.logger.log(`Processing email job ${job.id} for delivery: ${deliveryId}`);
        const delivery = await this.prisma.notificationDelivery.findUnique({
            where: { id: deliveryId },
        });
        if (!delivery || delivery.status === client_1.NotificationDeliveryStatus.DELIVERED) {
            return;
        }
        try {
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    retryCount: delivery.retryCount + 1,
                    lastRetryAt: new Date(),
                },
            });
            await this.sendEmailNotification(userId, title, body, link, payload);
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.NotificationDeliveryStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            });
        }
        catch (err) {
            await handleDeliveryFailure(this.prisma, this.dlqQueue, this.logger, job, deliveryId, 'notifications-email', err);
            throw err;
        }
    }
    async sendEmailNotification(userId, title, body, link, payload) {
        if (!userId)
            return;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });
        if (!user || !user.email) {
            throw new Error(`Email address not found for user ${userId}`);
        }
        this.logger.log(`Sending email to ${user.email} (Subject: ${title})`);
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)('deliver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleDelivery", null);
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications-email'),
    __param(1, (0, bull_2.InjectQueue)('notifications-dlq')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], EmailProcessor);
let SocketProcessor = SocketProcessor_1 = class SocketProcessor {
    prisma;
    gateway;
    dlqQueue;
    logger = new common_1.Logger(SocketProcessor_1.name);
    constructor(prisma, gateway, dlqQueue) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.dlqQueue = dlqQueue;
    }
    async handleDelivery(job) {
        const { deliveryId, notificationId, channel, userId, title, body, link, payload } = job.data;
        this.logger.log(`Processing socket job ${job.id} for delivery: ${deliveryId}`);
        const delivery = await this.prisma.notificationDelivery.findUnique({
            where: { id: deliveryId },
            include: { notification: true },
        });
        if (!delivery || delivery.status === client_1.NotificationDeliveryStatus.DELIVERED) {
            return;
        }
        try {
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    retryCount: delivery.retryCount + 1,
                    lastRetryAt: new Date(),
                },
            });
            const targetRoomId = userId
                ? `user-${userId}`
                : delivery.notification.adminId
                    ? `user-${delivery.notification.adminId}`
                    : null;
            if (targetRoomId && this.gateway.server) {
                this.gateway.server.to(targetRoomId).emit('notification', {
                    id: notificationId,
                    title,
                    body,
                    type: delivery.notification.type,
                    severity: delivery.notification.severity,
                    category: delivery.notification.category,
                    link,
                    createdAt: delivery.notification.createdAt,
                    showToast: channel === client_1.NotificationChannel.TOAST,
                });
            }
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.NotificationDeliveryStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            });
        }
        catch (err) {
            await handleDeliveryFailure(this.prisma, this.dlqQueue, this.logger, job, deliveryId, 'notifications-socket', err);
            throw err;
        }
    }
};
exports.SocketProcessor = SocketProcessor;
__decorate([
    (0, bull_1.Process)('deliver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SocketProcessor.prototype, "handleDelivery", null);
exports.SocketProcessor = SocketProcessor = SocketProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications-socket'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __param(2, (0, bull_2.InjectQueue)('notifications-dlq')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_gateway_1.NotificationsGateway, Object])
], SocketProcessor);
let SmsProcessor = SmsProcessor_1 = class SmsProcessor {
    prisma;
    dlqQueue;
    logger = new common_1.Logger(SmsProcessor_1.name);
    constructor(prisma, dlqQueue) {
        this.prisma = prisma;
        this.dlqQueue = dlqQueue;
    }
    async handleDelivery(job) {
        const { deliveryId, notificationId, userId, title, body, payload } = job.data;
        this.logger.log(`Processing SMS job ${job.id} for delivery: ${deliveryId}`);
        const delivery = await this.prisma.notificationDelivery.findUnique({
            where: { id: deliveryId },
        });
        if (!delivery || delivery.status === client_1.NotificationDeliveryStatus.DELIVERED) {
            return;
        }
        try {
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    retryCount: delivery.retryCount + 1,
                    lastRetryAt: new Date(),
                },
            });
            await this.sendSmsNotification(userId, title, body, payload);
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.NotificationDeliveryStatus.DELIVERED,
                    deliveredAt: new Date(),
                },
            });
        }
        catch (err) {
            await handleDeliveryFailure(this.prisma, this.dlqQueue, this.logger, job, deliveryId, 'notifications-sms', err);
            throw err;
        }
    }
    async sendSmsNotification(userId, title, body, payload) {
        if (!userId)
            return;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { phone: true },
        });
        if (!user || !user.phone) {
            this.logger.log(`No phone number registered for user ${userId}. SMS skipped.`);
            return;
        }
        this.logger.log(`Sending SMS to ${user.phone}: ${body.substring(0, 30)}...`);
    }
};
exports.SmsProcessor = SmsProcessor;
__decorate([
    (0, bull_1.Process)('deliver'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SmsProcessor.prototype, "handleDelivery", null);
exports.SmsProcessor = SmsProcessor = SmsProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications-sms'),
    __param(1, (0, bull_2.InjectQueue)('notifications-dlq')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], SmsProcessor);
let DlqProcessor = DlqProcessor_1 = class DlqProcessor {
    prisma;
    logger = new common_1.Logger(DlqProcessor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleFailedJob(job) {
        const { notificationId, originalQueue, error, failedAt } = job.data;
        this.logger.warn(`DLQ Job logged: Notification ${notificationId} failed completely in queue ${originalQueue}. Reason: ${error} at ${failedAt}`);
    }
};
exports.DlqProcessor = DlqProcessor;
__decorate([
    (0, bull_1.Process)('failed-job'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DlqProcessor.prototype, "handleFailedJob", null);
exports.DlqProcessor = DlqProcessor = DlqProcessor_1 = __decorate([
    (0, bull_1.Processor)('notifications-dlq'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DlqProcessor);
//# sourceMappingURL=notifications.processor.js.map