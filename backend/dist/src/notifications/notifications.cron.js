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
var NotificationsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("./notifications.service");
const observability_service_1 = require("../observability/observability.service");
let NotificationsCron = NotificationsCron_1 = class NotificationsCron {
    prisma;
    notificationsService;
    observabilityService;
    logger = new common_1.Logger(NotificationsCron_1.name);
    constructor(prisma, notificationsService, observabilityService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.observabilityService = observabilityService;
    }
    async handleDailyMaintenance() {
        this.logger.log('Starting Notification System Daily Maintenance...');
        await this.cleanupExpiredTokens();
        await this.archiveOldNotifications();
        await this.aggregateDailyAnalytics();
        await this.cleanupExpiredAudits();
        this.logger.log('Notification System Daily Maintenance complete.');
    }
    async cleanupExpiredTokens() {
        try {
            this.logger.log('Cleaning up inactive device tokens...');
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const deletedCount = await this.prisma.deviceToken.deleteMany({
                where: {
                    OR: [
                        { failureCount: { gte: 3 } },
                        { isActive: false, createdAt: { lt: thirtyDaysAgo } },
                    ],
                },
            });
            this.logger.log(`Pruned ${deletedCount.count} expired device tokens.`);
        }
        catch (err) {
            this.logger.error('Failed to cleanup expired device tokens', err.stack);
        }
    }
    async archiveOldNotifications() {
        try {
            this.logger.log('Archiving notifications older than 180 days...');
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() - 180);
            const oldNotifications = await this.prisma.notification.findMany({
                where: {
                    createdAt: { lt: limitDate },
                },
                take: 1000,
            });
            if (oldNotifications.length === 0) {
                this.logger.log('No notifications found to archive.');
                return;
            }
            this.logger.log(`Found ${oldNotifications.length} notifications to archive. Copying...`);
            await this.prisma.$transaction(async (tx) => {
                const archives = oldNotifications.map((notif) => ({
                    id: notif.id,
                    userId: notif.userId,
                    adminId: notif.adminId,
                    partnerId: notif.partnerId,
                    title: notif.title,
                    body: notif.body,
                    type: notif.type,
                    priority: notif.priority,
                    severity: notif.severity,
                    category: notif.category,
                    status: notif.status,
                    link: notif.link,
                    idempotencyKey: notif.idempotencyKey,
                    metadata: notif.metadata || undefined,
                    createdAt: notif.createdAt,
                }));
                await tx.notificationArchive.createMany({
                    data: archives,
                    skipDuplicates: true,
                });
                const deleteResult = await tx.notification.deleteMany({
                    where: {
                        id: {
                            in: oldNotifications.map((n) => n.id),
                        },
                    },
                });
                this.logger.log(`Successfully archived and deleted ${deleteResult.count} notifications.`);
            });
        }
        catch (err) {
            this.logger.error('Failed to archive old notifications', err.stack);
        }
    }
    async aggregateDailyAnalytics() {
        try {
            this.logger.log("Building yesterday's daily analytics...");
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
            const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));
            const partners = await this.prisma.partner.findMany({
                select: { id: true },
            });
            const partnerIds = [null, ...partners.map((p) => p.id)];
            for (const partnerId of partnerIds) {
                const metrics = await this.prisma.notificationDelivery.groupBy({
                    by: ['channel', 'status'],
                    where: {
                        createdAt: {
                            gte: startOfYesterday,
                            lte: endOfYesterday,
                        },
                        notification: {
                            partnerId: partnerId,
                        },
                    },
                    _count: {
                        _all: true,
                    },
                });
                let pushSent = 0;
                let emailSent = 0;
                let bellSent = 0;
                let socketSent = 0;
                let smsSent = 0;
                let failed = 0;
                for (const metric of metrics) {
                    const count = metric._count._all;
                    if (metric.status === client_1.NotificationDeliveryStatus.FAILED) {
                        failed += count;
                    }
                    else if (metric.status === client_1.NotificationDeliveryStatus.DELIVERED ||
                        metric.status === client_1.NotificationDeliveryStatus.SENT) {
                        if (metric.channel === client_1.NotificationChannel.PUSH)
                            pushSent += count;
                        if (metric.channel === client_1.NotificationChannel.EMAIL)
                            emailSent += count;
                        if (metric.channel === client_1.NotificationChannel.BELL)
                            bellSent += count;
                        if (metric.channel === client_1.NotificationChannel.SOCKET)
                            socketSent += count;
                        if (metric.channel === client_1.NotificationChannel.SMS)
                            smsSent += count;
                    }
                }
                const readCount = await this.prisma.notificationRead.count({
                    where: {
                        readAt: {
                            gte: startOfYesterday,
                            lte: endOfYesterday,
                        },
                        notification: {
                            partnerId: partnerId,
                        },
                    },
                });
                const actionMetrics = await this.prisma.notificationAction.groupBy({
                    by: ['actionType'],
                    where: {
                        clickedAt: {
                            gte: startOfYesterday,
                            lte: endOfYesterday,
                        },
                        notification: {
                            partnerId: partnerId,
                        },
                    },
                    _count: {
                        _all: true,
                    },
                });
                let opened = 0;
                let clicked = 0;
                let dismissed = 0;
                for (const action of actionMetrics) {
                    const count = action._count._all;
                    if (action.actionType === 'OPENED')
                        opened += count;
                    if (action.actionType === 'CLICKED')
                        clicked += count;
                    if (action.actionType === 'DISMISSED')
                        dismissed += count;
                }
                await this.prisma.notificationAnalytics.upsert({
                    where: partnerId
                        ? { partnerId_date: { partnerId, date: startOfYesterday } }
                        : { date: startOfYesterday },
                    update: {
                        pushSent,
                        emailSent,
                        bellSent,
                        socketSent,
                        smsSent,
                        opened,
                        clicked,
                        read: readCount,
                        dismissed,
                        failed,
                    },
                    create: {
                        partnerId,
                        date: startOfYesterday,
                        pushSent,
                        emailSent,
                        bellSent,
                        socketSent,
                        smsSent,
                        opened,
                        clicked,
                        read: readCount,
                        dismissed,
                        failed,
                    },
                });
            }
            this.logger.log("Successfully compiled yesterday's analytics.");
        }
        catch (err) {
            this.logger.error("Failed to compile yesterday's analytics", err.stack);
        }
    }
    async cleanupExpiredAudits() {
        try {
            this.logger.log('Cleaning up expired admin action audits (older than 730 days)...');
            const twoYearsAgo = new Date();
            twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);
            const result = await this.prisma.notificationAdminAudit.deleteMany({
                where: {
                    createdAt: { lt: twoYearsAgo },
                },
            });
            this.logger.log(`Pruned ${result.count} expired admin audit logs.`);
        }
        catch (err) {
            this.logger.error('Failed to cleanup expired admin audit logs', err.stack);
        }
    }
    async handleStuckBroadcasts() {
        try {
            this.logger.log('Checking for stuck broadcasts...');
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            const stuckExecutions = await this.prisma.broadcastExecution.findMany({
                where: {
                    completedAt: null,
                    lastHeartbeatAt: { lt: oneHourAgo },
                    broadcast: { status: 'SENDING' },
                },
            });
            if (stuckExecutions.length === 0) {
                this.logger.log('No stuck executions found.');
                return;
            }
            this.logger.warn(`Found ${stuckExecutions.length} stuck executions. Restoring...`);
            for (const exec of stuckExecutions) {
                await this.prisma.broadcastExecution.update({
                    where: { id: exec.id },
                    data: { completedAt: new Date() },
                });
                await this.prisma.notificationBroadcast.update({
                    where: { id: exec.broadcastId },
                    data: { status: 'PARTIALLY_FAILED', completedAt: new Date() },
                });
                this.logger.warn(`Broadcast ${exec.broadcastId} marked as PARTIALLY_FAILED due to lack of heartbeat.`);
            }
        }
        catch (err) {
            this.logger.error('Failed to process stuck broadcasts recovery check', err.stack);
        }
    }
    async reconcilePendingDeliveries() {
        if (!this.notificationsService.isRedisReady()) {
            this.logger.warn('Redis client is not ready. Skipping pending deliveries reconciliation.');
            return;
        }
        const startTime = Date.now();
        this.observabilityService.increment('notification_reconciliation_runs_total');
        try {
            this.logger.log('Starting reconciliation of pending deliveries...');
            const twoMinutesAgo = new Date();
            twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
            const pendingDeliveries = await this.prisma.notificationDelivery.findMany({
                where: {
                    status: 'PENDING',
                    createdAt: { lt: twoMinutesAgo },
                    channel: { in: ['PUSH', 'EMAIL', 'SMS'] },
                },
                select: { id: true },
                take: 500,
            });
            if (pendingDeliveries.length === 0) {
                this.logger.log('No pending deliveries found to reconcile.');
                const durationSeconds = (Date.now() - startTime) / 1000;
                this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
                return;
            }
            this.logger.log(`Found ${pendingDeliveries.length} pending deliveries. Re-enqueuing...`);
            const deliveryIds = pendingDeliveries.map((d) => d.id);
            let result;
            try {
                result = await this.notificationsService.bulkRetryDeliveries(deliveryIds);
            }
            catch (err) {
                this.logger.error('Notification reconciliation failed', err.stack);
                this.observabilityService.increment('notification_reconciliation_failures_total');
                const durationSeconds = (Date.now() - startTime) / 1000;
                this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
                return;
            }
            this.logger.log(`Reconciled ${result.count}/${deliveryIds.length} pending deliveries successfully.`);
            const durationSeconds = (Date.now() - startTime) / 1000;
            this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
        }
        catch (err) {
            this.logger.error('Failed to reconcile pending deliveries', err.stack);
            this.observabilityService.increment('notification_reconciliation_failures_total');
            const durationSeconds = (Date.now() - startTime) / 1000;
            this.observabilityService.recordDuration('notification_reconciliation_duration_seconds', durationSeconds);
        }
    }
    async handleStuckPaymentInitiations() {
        try {
            this.logger.log('Checking for stuck payment initiations...');
            const tenMinutesAgo = new Date();
            tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);
            const stuckPIs = await this.prisma.paymentInitiation.findMany({
                where: {
                    status: 'processing',
                    updatedAt: { lt: tenMinutesAgo },
                    payment: null,
                },
            });
            if (stuckPIs.length === 0) {
                this.logger.log('No stuck payment initiations found.');
                return;
            }
            this.logger.warn(`Found ${stuckPIs.length} stuck payment initiations. Resetting...`);
            const result = await this.prisma.paymentInitiation.updateMany({
                where: {
                    id: { in: stuckPIs.map((pi) => pi.id) },
                    status: 'processing',
                    updatedAt: { lt: tenMinutesAgo },
                },
                data: {
                    status: 'initiated',
                    processingAt: null,
                },
            });
            this.logger.warn(`Successfully reset ${result.count} stuck payment initiations back to 'initiated'.`);
        }
        catch (err) {
            this.logger.error('Failed to process stuck payment initiations recovery check', err.stack);
        }
    }
};
exports.NotificationsCron = NotificationsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsCron.prototype, "handleDailyMaintenance", null);
__decorate([
    (0, schedule_1.Cron)('0 */15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsCron.prototype, "handleStuckBroadcasts", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsCron.prototype, "reconcilePendingDeliveries", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsCron.prototype, "handleStuckPaymentInitiations", null);
exports.NotificationsCron = NotificationsCron = NotificationsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        observability_service_1.ObservabilityService])
], NotificationsCron);
//# sourceMappingURL=notifications.cron.js.map