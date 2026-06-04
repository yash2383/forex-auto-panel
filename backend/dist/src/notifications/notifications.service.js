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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bull_1 = require("@nestjs/bull");
const client_1 = require("@prisma/client");
const events_1 = require("./events");
const routes_1 = require("./routes");
const notifications_gateway_1 = require("./notifications.gateway");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    pushQueue;
    emailQueue;
    socketQueue;
    smsQueue;
    dlqQueue;
    gateway;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, pushQueue, emailQueue, socketQueue, smsQueue, dlqQueue, gateway) {
        this.prisma = prisma;
        this.pushQueue = pushQueue;
        this.emailQueue = emailQueue;
        this.socketQueue = socketQueue;
        this.smsQueue = smsQueue;
        this.dlqQueue = dlqQueue;
        this.gateway = gateway;
    }
    compileTemplate(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? String(data[key]) : match;
        });
    }
    async send(event, payload, userId, partnerId, idempotencyKey, adminId, customTitle, customBody, customChannels) {
        const eventDef = events_1.EVENT_REGISTRY[event];
        if (!eventDef) {
            throw new Error(`Event ${event} is not registered in EVENT_REGISTRY.`);
        }
        if (idempotencyKey) {
            const existing = await this.prisma.notification.findUnique({
                where: { idempotencyKey },
                include: { deliveries: true },
            });
            if (existing) {
                this.logger.log(`Duplicate notification ignored for idempotencyKey: ${idempotencyKey}`);
                return existing;
            }
        }
        const title = customTitle || this.compileTemplate(eventDef.title, payload);
        const body = customBody || this.compileTemplate(eventDef.body, payload);
        const link = routes_1.EVENT_ROUTES[event] || '/dashboard';
        const eventSettings = await this.prisma.notificationEventSetting.findUnique({
            where: { event },
        });
        let allowedChannels = customChannels || [...eventDef.channels];
        if (eventSettings) {
            allowedChannels = allowedChannels.filter(channel => {
                if (channel === client_1.NotificationChannel.PUSH)
                    return eventSettings.pushEnabled;
                if (channel === client_1.NotificationChannel.EMAIL)
                    return eventSettings.emailEnabled;
                if (channel === client_1.NotificationChannel.BELL)
                    return eventSettings.bellEnabled;
                if (channel === client_1.NotificationChannel.SOCKET)
                    return eventSettings.socketEnabled;
                if (channel === client_1.NotificationChannel.SMS)
                    return eventSettings.smsEnabled;
                return true;
            });
        }
        if (userId) {
            const userPrefs = await this.prisma.userNotificationPreference.findMany({
                where: { userId, category: eventDef.category },
            });
            const isPushEnabled = userPrefs.find(p => p.category === eventDef.category)?.pushEnabled ?? true;
            const isEmailEnabled = userPrefs.find(p => p.category === eventDef.category)?.emailEnabled ?? true;
            const isBellEnabled = userPrefs.find(p => p.category === eventDef.category)?.bellEnabled ?? true;
            const bypassOptOut = eventDef.priority === client_1.NotificationPriority.CRITICAL ||
                eventDef.priority === client_1.NotificationPriority.HIGH;
            if (!bypassOptOut) {
                allowedChannels = allowedChannels.filter(channel => {
                    if (channel === client_1.NotificationChannel.PUSH)
                        return isPushEnabled;
                    if (channel === client_1.NotificationChannel.EMAIL)
                        return isEmailEnabled;
                    if (channel === client_1.NotificationChannel.BELL)
                        return isBellEnabled;
                    return true;
                });
            }
        }
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                adminId,
                partnerId,
                title,
                body,
                type: event,
                priority: eventDef.priority,
                severity: eventDef.severity,
                category: eventDef.category,
                status: client_1.NotificationStatus.UNREAD,
                link,
                idempotencyKey,
                metadata: payload,
            },
        });
        const deliveryCreates = allowedChannels.map(channel => this.prisma.notificationDelivery.create({
            data: {
                notificationId: notification.id,
                channel,
                status: client_1.NotificationDeliveryStatus.PENDING,
            },
        }));
        const deliveries = await Promise.all(deliveryCreates);
        const socketDelivery = deliveries.find(d => d.channel === client_1.NotificationChannel.SOCKET);
        const toastDelivery = deliveries.find(d => d.channel === client_1.NotificationChannel.TOAST);
        const bellDelivery = deliveries.find(d => d.channel === client_1.NotificationChannel.BELL);
        const targetRoomId = userId ? `user-${userId}` : adminId ? `user-${adminId}` : null;
        if (targetRoomId) {
            if (socketDelivery || toastDelivery || bellDelivery) {
                try {
                    if (this.gateway.server) {
                        this.gateway.server.to(targetRoomId).emit('notification', {
                            id: notification.id,
                            title,
                            body,
                            type: event,
                            severity: eventDef.severity,
                            category: eventDef.category,
                            link,
                            createdAt: notification.createdAt,
                            showToast: !!toastDelivery,
                        });
                        await this.prisma.notificationDelivery.updateMany({
                            where: {
                                id: {
                                    in: [socketDelivery?.id, toastDelivery?.id, bellDelivery?.id].filter(Boolean),
                                },
                            },
                            data: {
                                status: client_1.NotificationDeliveryStatus.DELIVERED,
                                deliveredAt: new Date(),
                            },
                        });
                    }
                }
                catch (err) {
                    this.logger.error(`Realtime socket emission failed for room ${targetRoomId}`, err.stack);
                    await this.prisma.notificationDelivery.updateMany({
                        where: {
                            id: {
                                in: [socketDelivery?.id, toastDelivery?.id, bellDelivery?.id].filter(Boolean),
                            },
                        },
                        data: {
                            status: client_1.NotificationDeliveryStatus.FAILED,
                            error: err.message,
                        },
                    });
                }
            }
        }
        for (const delivery of deliveries) {
            if (delivery.channel === client_1.NotificationChannel.PUSH ||
                delivery.channel === client_1.NotificationChannel.EMAIL ||
                delivery.channel === client_1.NotificationChannel.SMS) {
                try {
                    let targetQueue;
                    if (delivery.channel === client_1.NotificationChannel.PUSH)
                        targetQueue = this.pushQueue;
                    else if (delivery.channel === client_1.NotificationChannel.EMAIL)
                        targetQueue = this.emailQueue;
                    else
                        targetQueue = this.smsQueue;
                    const addPromise = targetQueue.add('deliver', {
                        deliveryId: delivery.id,
                        notificationId: notification.id,
                        channel: delivery.channel,
                        userId,
                        title,
                        body,
                        link,
                        payload,
                    }, {
                        attempts: 5,
                        backoff: {
                            type: 'exponential',
                            delay: 5000,
                        },
                    });
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout (Redis offline)')), 2000));
                    await Promise.race([addPromise, timeoutPromise]);
                }
                catch (queueErr) {
                    this.logger.warn(`Failed to enqueue delivery job for ${delivery.channel} (${queueErr.message}). Attempting synchronous dispatch fallback.`);
                    await this.fallbackSyncDispatch(delivery.id, notification.id, delivery.channel, userId, title, body, link, payload);
                }
            }
        }
        return notification;
    }
    async fallbackSyncDispatch(deliveryId, notificationId, channel, userId, title, body, link, payload) {
        if (channel !== client_1.NotificationChannel.BELL &&
            channel !== client_1.NotificationChannel.SOCKET &&
            channel !== client_1.NotificationChannel.TOAST) {
            this.logger.log(`Redis offline: Leaving async delivery ${deliveryId} (${channel}) in PENDING status for reconciliation.`);
            return;
        }
        try {
            this.logger.log(`Executing sync fallback dispatch for delivery: ${deliveryId} (${channel})`);
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: { retryCount: { increment: 1 }, lastRetryAt: new Date() },
            });
            if (channel === client_1.NotificationChannel.SOCKET || channel === client_1.NotificationChannel.TOAST) {
                const targetRoomId = userId ? `user-${userId}` : null;
                if (targetRoomId && this.gateway.server) {
                    this.gateway.server.to(targetRoomId).emit('notification', {
                        id: notificationId,
                        title,
                        body,
                        link,
                        showToast: channel === client_1.NotificationChannel.TOAST,
                        createdAt: new Date(),
                    });
                }
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
            this.logger.error(`Sync fallback dispatch failed for delivery ${deliveryId}`, err.stack);
            await this.prisma.notificationDelivery.update({
                where: { id: deliveryId },
                data: {
                    status: client_1.NotificationDeliveryStatus.FAILED,
                    error: `Queue failure + Sync Fallback failure: ${err.message}`,
                },
            });
        }
    }
    async sendToUser(userId, event, payload, idempotencyKey) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { partnerId: true },
        });
        return this.send(event, payload, userId, user?.partnerId, idempotencyKey);
    }
    async sendToAdmin(adminId, event, payload, idempotencyKey) {
        return this.send(event, payload, undefined, undefined, idempotencyKey, adminId);
    }
    async logAdminAudit(adminId, action, entityType, entityId, metadata, ipAddress, userAgent) {
        try {
            await this.prisma.notificationAdminAudit.create({
                data: {
                    adminId,
                    action,
                    entityType,
                    entityId,
                    metadata: metadata ? metadata : undefined,
                    ipAddress,
                    userAgent,
                },
            });
        }
        catch (err) {
            this.logger.error(`Failed to log admin audit for action ${action}: ${err.message}`, err.stack);
        }
    }
    async getAdminAnalytics() {
        const analytics = await this.prisma.notificationAnalytics.findMany({
            orderBy: { date: 'asc' },
        });
        if (analytics.length === 0) {
            return {
                hasData: false,
                metrics: [],
                message: 'No analytics data available yet',
            };
        }
        const totalSent = await this.prisma.notificationDelivery.count();
        const totalFailed = await this.prisma.notificationDelivery.count({ where: { status: 'FAILED' } });
        const totalRead = await this.prisma.notification.count({ where: { status: 'READ' } });
        const totalNotifications = await this.prisma.notification.count();
        const openRate = totalNotifications > 0 ? (totalRead / totalNotifications) * 100 : 0;
        const channelSent = {
            push: await this.prisma.notificationDelivery.count({ where: { channel: 'PUSH' } }),
            email: await this.prisma.notificationDelivery.count({ where: { channel: 'EMAIL' } }),
            bell: await this.prisma.notificationDelivery.count({ where: { channel: 'BELL' } }),
            socket: await this.prisma.notificationDelivery.count({ where: { channel: 'SOCKET' } }),
            sms: await this.prisma.notificationDelivery.count({ where: { channel: 'SMS' } }),
        };
        return {
            hasData: true,
            metrics: analytics,
            summary: {
                totalSent,
                totalFailed,
                totalRead,
                openRate: parseFloat(openRate.toFixed(1)),
                channelSent,
            },
        };
    }
    async getArchiveStats() {
        const activeNotifications = await this.prisma.notification.count({
            where: { deletedAt: null },
        });
        const archivedNotifications = await this.prisma.notification.count({
            where: { deletedAt: { not: null } },
        });
        const total = activeNotifications + archivedNotifications;
        const archiveRatio = total > 0 ? (archivedNotifications / total) * 100 : 0;
        return {
            activeNotifications,
            archivedNotifications,
            archiveRatio: parseFloat(archiveRatio.toFixed(1)),
        };
    }
    async resolveAudienceUsers(audience) {
        if (audience === client_1.NotificationAudience.ALL_USERS) {
            return this.prisma.user.findMany({
                where: { isDeleted: false },
                select: { id: true, partnerId: true },
            });
        }
        if (audience === client_1.NotificationAudience.ACTIVE_USERS) {
            return this.prisma.user.findMany({
                where: { isDeleted: false, status: 'ACTIVE' },
                select: { id: true, partnerId: true },
            });
        }
        if (audience === client_1.NotificationAudience.EXPIRED_USERS) {
            return this.prisma.user.findMany({
                where: { isDeleted: false, status: 'EXPIRED' },
                select: { id: true, partnerId: true },
            });
        }
        if (audience === client_1.NotificationAudience.VIP_USERS) {
            return this.prisma.user.findMany({
                where: { isDeleted: false, status: 'VIP' },
                select: { id: true, partnerId: true },
            });
        }
        if (audience === client_1.NotificationAudience.CLUB_PLAN) {
            return this.prisma.user.findMany({
                where: {
                    isDeleted: false,
                    investments: {
                        some: {
                            status: 'ACTIVE',
                            plan: { name: { contains: 'Club', mode: 'insensitive' } },
                        },
                    },
                },
                select: { id: true, partnerId: true },
            });
        }
        if (audience === client_1.NotificationAudience.INDIVIDUAL_PLAN) {
            return this.prisma.user.findMany({
                where: {
                    isDeleted: false,
                    investments: {
                        some: {
                            status: 'ACTIVE',
                            plan: { name: { contains: 'Individual', mode: 'insensitive' } },
                        },
                    },
                },
                select: { id: true, partnerId: true },
            });
        }
        if (audience === client_1.NotificationAudience.ADMINS) {
            const admins = await this.prisma.admin.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true },
            });
            return admins.map(a => ({ id: a.id, partnerId: undefined }));
        }
        return [];
    }
    async previewBroadcast(audience) {
        const users = await this.resolveAudienceUsers(audience);
        return {
            resolvedAudience: users.length,
        };
    }
    async getAudiencePreviewDetails(audience) {
        if (audience === client_1.NotificationAudience.ADMINS) {
            const dbAdmins = await this.prisma.admin.findMany({
                where: { status: 'ACTIVE' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    lastLoginAt: true,
                }
            });
            const resolvedUsers = dbAdmins.map(a => {
                const isOnline = a.lastLoginAt
                    ? (Date.now() - new Date(a.lastLoginAt).getTime()) < 15 * 60 * 1000
                    : false;
                return {
                    id: a.id,
                    name: a.name,
                    email: a.email,
                    plan: a.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Manager',
                    status: 'ACTIVE',
                    isOnline,
                    isVerified: true,
                    hasActiveInvestment: false
                };
            });
            return {
                total: resolvedUsers.length,
                online: resolvedUsers.filter(u => u.isOnline).length,
                active: resolvedUsers.length,
                expired: 0,
                users: resolvedUsers
            };
        }
        const userSummary = await this.resolveAudienceUsers(audience);
        const userIds = userSummary.map(u => u.id);
        const dbUsers = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: {
                id: true,
                name: true,
                email: true,
                status: true,
                lastLoginAt: true,
                isVerified: true,
                investments: {
                    where: { status: 'ACTIVE' },
                    select: {
                        plan: {
                            select: { name: true }
                        }
                    }
                }
            }
        });
        const resolvedUsers = dbUsers.map(u => {
            const planName = u.investments[0]?.plan?.name || (u.status === 'VIP' ? 'VIP' : 'Individual');
            const isOnline = u.lastLoginAt
                ? (Date.now() - new Date(u.lastLoginAt).getTime()) < 15 * 60 * 1000
                : false;
            return {
                id: u.id,
                name: u.name,
                email: u.email,
                plan: planName,
                status: u.status,
                isOnline,
                isVerified: u.isVerified,
                hasActiveInvestment: u.investments.length > 0
            };
        });
        const total = resolvedUsers.length;
        const online = resolvedUsers.filter(u => u.isOnline).length;
        const active = resolvedUsers.filter(u => u.status === 'ACTIVE' || u.status === 'VIP').length;
        const expired = resolvedUsers.filter(u => u.status === 'EXPIRED').length;
        return {
            total,
            online,
            active,
            expired,
            users: resolvedUsers
        };
    }
    async createBroadcast(adminId, payload) {
        if (payload.scheduledAt) {
            const schedule = await this.prisma.notificationSchedule.create({
                data: {
                    title: payload.title,
                    body: payload.body,
                    audience: payload.audience,
                    scheduledAt: new Date(payload.scheduledAt),
                    status: client_1.NotificationScheduleStatus.PENDING,
                    channels: {
                        create: payload.channels.map(c => ({
                            channel: c,
                        })),
                    },
                },
                include: {
                    channels: true,
                },
            });
            return { type: 'SCHEDULED', record: schedule };
        }
        const broadcast = await this.prisma.notificationBroadcast.create({
            data: {
                title: payload.title,
                body: payload.body,
                audience: payload.audience,
                status: client_1.BroadcastStatus.DRAFT,
                createdByAdminId: adminId,
                channels: {
                    create: payload.channels.map(c => ({
                        channel: c,
                    })),
                },
            },
            include: {
                channels: true,
            },
        });
        return { type: 'BROADCAST', record: broadcast };
    }
    async approveAndSendBroadcast(broadcastId, adminId, approvalRequestId) {
        const broadcast = await this.prisma.notificationBroadcast.findUnique({
            where: { id: broadcastId },
            include: { channels: true },
        });
        if (!broadcast) {
            throw new common_1.BadRequestException('Broadcast not found.');
        }
        if (broadcast.status === client_1.BroadcastStatus.SENDING || broadcast.status === client_1.BroadcastStatus.SENT) {
            if (approvalRequestId && broadcast.approvalRequestId === approvalRequestId) {
                this.logger.log(`Idempotent approval request: Broadcast ${broadcastId} already approved with request ID: ${approvalRequestId}`);
                return { success: true, message: 'Broadcast execution initiated (idempotent).' };
            }
            throw new common_1.ConflictException('Broadcast has already been approved or sent.');
        }
        if (broadcast.status !== client_1.BroadcastStatus.DRAFT && broadcast.status !== client_1.BroadcastStatus.PENDING_APPROVAL) {
            throw new common_1.ConflictException('Broadcast is not in draft or pending status.');
        }
        const [updateResult, execution] = await this.prisma.$transaction([
            this.prisma.notificationBroadcast.updateMany({
                where: {
                    id: broadcastId,
                    status: { in: [client_1.BroadcastStatus.DRAFT, client_1.BroadcastStatus.PENDING_APPROVAL] },
                    version: broadcast.version,
                },
                data: {
                    status: client_1.BroadcastStatus.SENDING,
                    version: { increment: 1 },
                    approvedByAdminId: adminId,
                    approvedAt: new Date(),
                    approvalRequestId: approvalRequestId || null,
                },
            }),
            this.prisma.broadcastExecution.create({
                data: {
                    broadcastId,
                    startedAt: new Date(),
                    targetUsers: 0,
                    sentUsers: 0,
                    successCount: 0,
                    failedCount: 0,
                    skippedCount: 0,
                    chunkCount: 0,
                    lastHeartbeatAt: new Date(),
                },
            }),
        ]);
        if (updateResult.count === 0) {
            throw new common_1.ConflictException('Broadcast has already been approved or modified by another admin.');
        }
        this.executeBroadcastChunked(broadcastId, execution.id, broadcast);
        return { success: true, message: 'Broadcast execution initiated.' };
    }
    async executeBroadcastChunked(broadcastId, executionId, broadcast) {
        const startTime = Date.now();
        let sentUsers = 0;
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let chunkCount = 0;
        let totalUsers = 0;
        try {
            const users = await this.resolveAudienceUsers(broadcast.audience);
            totalUsers = users.length;
            await this.prisma.broadcastExecution.update({
                where: { id: executionId },
                data: { targetUsers: totalUsers, lastHeartbeatAt: new Date() },
            });
            await this.prisma.notificationBroadcast.update({
                where: { id: broadcastId },
                data: { totalUsers, startedAt: new Date() },
            });
            const chunkSize = 500;
            const channels = broadcast.channels.map((bc) => bc.channel);
            for (let i = 0; i < users.length; i += chunkSize) {
                chunkCount++;
                const chunk = users.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async (user) => {
                    try {
                        if (broadcast.audience === client_1.NotificationAudience.ADMINS) {
                            await this.send(client_1.NotificationEvent.SYSTEM, {}, undefined, undefined, `broadcast_${broadcastId}_${user.id}`, user.id, broadcast.title, broadcast.body, channels);
                        }
                        else {
                            await this.send(client_1.NotificationEvent.SYSTEM, {}, user.id, user.partnerId, `broadcast_${broadcastId}_${user.id}`, undefined, broadcast.title, broadcast.body, channels);
                        }
                        successCount++;
                    }
                    catch (err) {
                        this.logger.error(`Failed to send broadcast to user ${user.id}`, err);
                        failedCount++;
                    }
                    finally {
                        sentUsers++;
                    }
                }));
                await this.prisma.broadcastExecution.update({
                    where: { id: executionId },
                    data: {
                        sentUsers,
                        successCount,
                        failedCount,
                        skippedCount,
                        chunkCount,
                        lastHeartbeatAt: new Date(),
                    },
                });
                if (this.gateway.server) {
                    this.gateway.server.to('admins').emit('broadcast_progress', {
                        id: broadcastId,
                        sent: sentUsers,
                        total: totalUsers,
                        percent: Math.round((sentUsers / totalUsers) * 100),
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const durationMs = Date.now() - startTime;
            await this.prisma.broadcastExecution.update({
                where: { id: executionId },
                data: {
                    completedAt: new Date(),
                    durationMs,
                    lastHeartbeatAt: new Date(),
                },
            });
            await this.prisma.notificationBroadcast.update({
                where: { id: broadcastId },
                data: { status: client_1.BroadcastStatus.SENT, sentAt: new Date(), completedAt: new Date() },
            });
            this.logger.log(`Broadcast ${broadcastId} finished execution successfully.`);
        }
        catch (error) {
            this.logger.error(`Critical error executing broadcast ${broadcastId}:`, error);
            const durationMs = Date.now() - startTime;
            await this.prisma.broadcastExecution.update({
                where: { id: executionId },
                data: {
                    completedAt: new Date(),
                    sentUsers,
                    successCount,
                    failedCount,
                    skippedCount,
                    chunkCount,
                    durationMs,
                    lastHeartbeatAt: new Date(),
                },
            });
            await this.prisma.notificationBroadcast.update({
                where: { id: broadcastId },
                data: { status: client_1.BroadcastStatus.PARTIALLY_FAILED, completedAt: new Date() },
            });
        }
    }
    async getAdminDevices(filters, limit = 50, cursor) {
        const where = {};
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.platform)
            where.platform = filters.platform;
        if (filters.browser)
            where.browser = filters.browser;
        if (filters.isActive !== undefined)
            where.isActive = filters.isActive;
        if (filters.failureCount !== undefined)
            where.failureCount = { gte: Number(filters.failureCount) };
        if (filters.lastUsedBefore)
            where.lastUsedAt = { lte: new Date(filters.lastUsedBefore) };
        const query = {
            where,
            take: limit + 1,
            orderBy: { id: 'asc' },
        };
        if (cursor) {
            query.cursor = { id: cursor };
            query.skip = 1;
        }
        const devices = await this.prisma.deviceToken.findMany(query);
        let nextCursor = undefined;
        if (devices.length > limit) {
            const nextItem = devices.pop();
            nextCursor = nextItem?.id;
        }
        return {
            devices,
            nextCursor,
        };
    }
    async getAdminDeliveries(filters, limit = 50, cursor) {
        const where = {};
        if (filters.status)
            where.status = filters.status;
        if (filters.channel)
            where.channel = filters.channel;
        const query = {
            where,
            take: limit + 1,
            orderBy: { id: 'desc' },
            include: {
                notification: {
                    select: {
                        title: true,
                        body: true,
                        userId: true,
                        adminId: true,
                        type: true,
                    },
                },
            },
        };
        if (cursor) {
            query.cursor = { id: cursor };
            query.skip = 1;
        }
        const deliveries = await this.prisma.notificationDelivery.findMany(query);
        let nextCursor = undefined;
        if (deliveries.length > limit) {
            const nextItem = deliveries.pop();
            nextCursor = nextItem?.id;
        }
        return {
            deliveries,
            nextCursor,
        };
    }
    async bulkRetryDeliveries(deliveryIds) {
        const MAX_BULK_RETRY = 1000;
        if (deliveryIds.length > MAX_BULK_RETRY) {
            throw new common_1.BadRequestException(`Cannot retry more than ${MAX_BULK_RETRY} deliveries at once.`);
        }
        let count = 0;
        for (const id of deliveryIds) {
            const delivery = await this.prisma.notificationDelivery.findUnique({
                where: { id },
                include: { notification: true },
            });
            if (delivery && (delivery.status === client_1.NotificationDeliveryStatus.FAILED || delivery.status === client_1.NotificationDeliveryStatus.PENDING)) {
                await this.prisma.notificationDelivery.update({
                    where: { id },
                    data: { status: client_1.NotificationDeliveryStatus.PENDING, error: null },
                });
                let targetQueue;
                if (delivery.channel === client_1.NotificationChannel.PUSH)
                    targetQueue = this.pushQueue;
                else if (delivery.channel === client_1.NotificationChannel.EMAIL)
                    targetQueue = this.emailQueue;
                else if (delivery.channel === client_1.NotificationChannel.SMS)
                    targetQueue = this.smsQueue;
                else
                    targetQueue = this.socketQueue;
                await targetQueue.add('deliver', {
                    deliveryId: delivery.id,
                    notificationId: delivery.notificationId,
                    channel: delivery.channel,
                    userId: delivery.notification.userId,
                    title: delivery.notification.title,
                    body: delivery.notification.body,
                    link: delivery.notification.link,
                    payload: delivery.notification.metadata,
                });
                count++;
            }
        }
        return { success: true, count };
    }
    async bulkRetryDlq() {
        const jobs = await this.dlqQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
        let count = 0;
        for (const job of jobs) {
            const { originalQueue, payload } = job.data;
            if (originalQueue && payload) {
                const targetQueue = this.getQueueByName(originalQueue);
                if (targetQueue) {
                    if (payload.deliveryId) {
                        await this.prisma.notificationDelivery.update({
                            where: { id: payload.deliveryId },
                            data: { status: client_1.NotificationDeliveryStatus.PENDING, error: null },
                        });
                    }
                    await targetQueue.add('deliver', payload, {
                        attempts: 5,
                        backoff: { type: 'exponential', delay: 5000 },
                    });
                    await job.remove();
                    count++;
                }
            }
        }
        return { success: true, count };
    }
    async bulkClearDlq() {
        const jobs = await this.dlqQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
        for (const job of jobs) {
            await job.remove();
        }
        return { success: true, count: jobs.length };
    }
    getQueueByName(name) {
        if (name === 'notifications-push')
            return this.pushQueue;
        if (name === 'notifications-email')
            return this.emailQueue;
        if (name === 'notifications-socket')
            return this.socketQueue;
        if (name === 'notifications-sms')
            return this.smsQueue;
        return null;
    }
    async getQueueHealth() {
        let redisConnected = false;
        const queues = {
            push: { waiting: 0, active: 0, failed: 0 },
            email: { waiting: 0, active: 0, failed: 0 },
            socket: { waiting: 0, active: 0, failed: 0 },
            sms: { waiting: 0, active: 0, failed: 0 },
            dlq: { waiting: 0, active: 0, failed: 0 },
        };
        try {
            const pushCounts = await this.pushQueue.getJobCounts();
            queues.push = { waiting: pushCounts.waiting, active: pushCounts.active, failed: pushCounts.failed };
            const emailCounts = await this.emailQueue.getJobCounts();
            queues.email = { waiting: emailCounts.waiting, active: emailCounts.active, failed: emailCounts.failed };
            const socketCounts = await this.socketQueue.getJobCounts();
            queues.socket = { waiting: socketCounts.waiting, active: socketCounts.active, failed: socketCounts.failed };
            const smsCounts = await this.smsQueue.getJobCounts();
            queues.sms = { waiting: smsCounts.waiting, active: smsCounts.active, failed: smsCounts.failed };
            const dlqCounts = await this.dlqQueue.getJobCounts();
            queues.dlq = { waiting: dlqCounts.waiting, active: dlqCounts.active, failed: dlqCounts.failed };
            redisConnected = true;
        }
        catch (err) {
            this.logger.error('Failed to connect to Redis for queue health check:', err);
        }
        const totalWaiting = queues.push.waiting + queues.email.waiting + queues.socket.waiting + queues.sms.waiting + queues.dlq.waiting;
        const totalActive = queues.push.active + queues.email.active + queues.socket.active + queues.sms.active + queues.dlq.active;
        const totalFailed = queues.push.failed + queues.email.failed + queues.socket.failed + queues.sms.failed + queues.dlq.failed;
        return {
            redis: redisConnected ? 'healthy' : 'unhealthy',
            redisConnected,
            push: queues.push,
            email: queues.email,
            socket: queues.socket,
            sms: queues.sms,
            dlq: queues.dlq,
            totals: {
                waiting: totalWaiting,
                active: totalActive,
                failed: totalFailed,
            },
            waiting: totalWaiting,
            active: totalActive,
            completed: 0,
            failed: totalFailed,
            delayed: 0,
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('notifications-push')),
    __param(2, (0, bull_1.InjectQueue)('notifications-email')),
    __param(3, (0, bull_1.InjectQueue)('notifications-socket')),
    __param(4, (0, bull_1.InjectQueue)('notifications-sms')),
    __param(5, (0, bull_1.InjectQueue)('notifications-dlq')),
    __param(6, (0, common_1.Inject)((0, common_1.forwardRef)(() => notifications_gateway_1.NotificationsGateway))),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object, Object, Object, Object, Object, notifications_gateway_1.NotificationsGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map