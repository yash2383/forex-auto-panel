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
exports.NotificationsController = exports.BroadcastAction = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const client_1 = require("@prisma/client");
const throttler_1 = require("@nestjs/throttler");
const notifications_service_1 = require("./notifications.service");
var BroadcastAction;
(function (BroadcastAction) {
    BroadcastAction["APPROVE"] = "APPROVE";
    BroadcastAction["REJECT"] = "REJECT";
    BroadcastAction["CANCEL"] = "CANCEL";
})(BroadcastAction || (exports.BroadcastAction = BroadcastAction = {}));
let NotificationsController = class NotificationsController {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    getOwnershipClause(reqUser) {
        const isAdmin = ['SUPER_ADMIN', 'MANAGER', 'VIEWER'].includes(reqUser.role);
        if (isAdmin) {
            return { adminId: reqUser.id };
        }
        return { userId: reqUser.id };
    }
    async getNotifications(req, res, pageRaw = '1', limitRaw = '20', status) {
        try {
            const user = req.user;
            const page = Math.max(1, parseInt(pageRaw, 10));
            const limit = Math.max(1, Math.min(100, parseInt(limitRaw, 10)));
            const skip = (page - 1) * limit;
            const ownership = this.getOwnershipClause(user);
            const whereClause = {
                ...ownership,
                deletedAt: null,
            };
            if (status && Object.values(client_1.NotificationStatus).includes(status)) {
                whereClause.status = status;
            }
            const [notifications, total] = await Promise.all([
                this.prisma.notification.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                }),
                this.prisma.notification.count({
                    where: whereClause,
                }),
            ]);
            const unreadCount = await this.prisma.notification.count({
                where: {
                    ...ownership,
                    status: client_1.NotificationStatus.UNREAD,
                    deletedAt: null,
                },
            });
            return res.json({
                notifications,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
                unreadCount,
            });
        }
        catch (error) {
            console.error('Fetch notifications error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async readAllNotifications(req, res) {
        try {
            const user = req.user;
            const ownership = this.getOwnershipClause(user);
            await this.prisma.notification.updateMany({
                where: {
                    ...ownership,
                    status: client_1.NotificationStatus.UNREAD,
                    deletedAt: null,
                },
                data: {
                    status: client_1.NotificationStatus.READ,
                },
            });
            return res.json({ success: true, message: 'All notifications marked as read' });
        }
        catch (error) {
            console.error('Mark read all notifications error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async readNotification(id, req, res) {
        try {
            const user = req.user;
            const ownership = this.getOwnershipClause(user);
            const notification = await this.prisma.notification.findFirst({
                where: {
                    id,
                    ...ownership,
                    deletedAt: null,
                },
            });
            if (!notification) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'Notification not found' });
            }
            const updated = await this.prisma.notification.update({
                where: { id },
                data: { status: client_1.NotificationStatus.READ },
            });
            return res.json({ success: true, notification: updated });
        }
        catch (error) {
            console.error('Mark read notification error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async deleteNotification(id, req, res) {
        try {
            const user = req.user;
            const ownership = this.getOwnershipClause(user);
            const notification = await this.prisma.notification.findFirst({
                where: {
                    id,
                    ...ownership,
                    deletedAt: null,
                },
            });
            if (!notification) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'Notification not found' });
            }
            await this.prisma.notification.update({
                where: { id },
                data: { deletedAt: new Date(), status: client_1.NotificationStatus.ARCHIVED },
            });
            return res.json({ success: true, message: 'Notification soft-deleted successfully' });
        }
        catch (error) {
            console.error('Delete notification error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getPreferences(req, res) {
        try {
            const user = req.user;
            if (user.role !== 'USER') {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Preferences only available for user role' });
            }
            const dbPrefs = await this.prisma.userNotificationPreference.findMany({
                where: { userId: user.id },
            });
            const categories = Object.values(client_1.NotificationCategory);
            const preferences = categories.map(cat => {
                const dbPref = dbPrefs.find(p => p.category === cat);
                return {
                    category: cat,
                    pushEnabled: dbPref?.pushEnabled ?? true,
                    emailEnabled: dbPref?.emailEnabled ?? true,
                    bellEnabled: dbPref?.bellEnabled ?? true,
                };
            });
            return res.json({ preferences });
        }
        catch (error) {
            console.error('Fetch preferences error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updatePreferences(req, body, res) {
        try {
            const user = req.user;
            if (user.role !== 'USER') {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Preferences only available for user role' });
            }
            const { category, pushEnabled, emailEnabled, bellEnabled } = body;
            if (!category || !Object.values(client_1.NotificationCategory).includes(category)) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Invalid category' });
            }
            const existing = await this.prisma.userNotificationPreference.findFirst({
                where: { userId: user.id, category },
            });
            let updated;
            if (existing) {
                updated = await this.prisma.userNotificationPreference.update({
                    where: { id: existing.id },
                    data: {
                        pushEnabled: pushEnabled !== undefined ? pushEnabled : existing.pushEnabled,
                        emailEnabled: emailEnabled !== undefined ? emailEnabled : existing.emailEnabled,
                        bellEnabled: bellEnabled !== undefined ? bellEnabled : existing.bellEnabled,
                    },
                });
            }
            else {
                updated = await this.prisma.userNotificationPreference.create({
                    data: {
                        userId: user.id,
                        category,
                        pushEnabled: pushEnabled ?? true,
                        emailEnabled: emailEnabled ?? true,
                        bellEnabled: bellEnabled ?? true,
                    },
                });
            }
            return res.json({ success: true, preference: updated });
        }
        catch (error) {
            console.error('Update preferences error:', error);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getAnalytics(res) {
        try {
            const stats = await this.notificationsService.getAdminAnalytics();
            return res.json(stats);
        }
        catch (err) {
            console.error('Get admin analytics error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getArchiveStats(res) {
        try {
            const stats = await this.notificationsService.getArchiveStats();
            return res.json(stats);
        }
        catch (err) {
            console.error('Get archive stats error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getHealth(res) {
        try {
            const health = await this.notificationsService.getQueueHealth();
            return res.json(health);
        }
        catch (err) {
            console.error('Get queue health error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getBroadcasts(res) {
        try {
            const broadcasts = await this.prisma.notificationBroadcast.findMany({
                include: {
                    channels: true,
                    createdByAdmin: { select: { name: true, email: true } },
                    approvedByAdmin: { select: { name: true } },
                    execution: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            return res.json({ broadcasts });
        }
        catch (err) {
            console.error('Get broadcasts error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async previewBroadcast(body, res) {
        try {
            if (!Object.values(client_1.NotificationAudience).includes(body.audience)) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Invalid audience.' });
            }
            const preview = await this.notificationsService.previewBroadcast(body.audience);
            return res.json(preview);
        }
        catch (err) {
            console.error('Preview broadcast error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async createBroadcast(req, body, res) {
        try {
            const user = req.user;
            if (!body.title || !body.body || !body.audience || !body.channels) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Missing required fields.' });
            }
            const result = await this.notificationsService.createBroadcast(user.id, body);
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            await this.notificationsService.logAdminAudit(user.id, 'CREATE_BROADCAST', result.type === 'SCHEDULED' ? 'Schedule' : 'Broadcast', result.record.id, body, ipAddress, userAgent);
            return res.json(result);
        }
        catch (err) {
            console.error('Create broadcast error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async handleBroadcastAction(id, body, req, res) {
        try {
            const user = req.user;
            const { action, approvalRequestId } = body;
            if (!Object.values(BroadcastAction).includes(action)) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Invalid action.' });
            }
            const broadcast = await this.prisma.notificationBroadcast.findUnique({
                where: { id },
            });
            if (!broadcast) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'Broadcast not found.' });
            }
            if (broadcast.status === client_1.BroadcastStatus.SENT ||
                broadcast.status === client_1.BroadcastStatus.CANCELLED) {
                throw new common_1.ConflictException(`Cannot execute action on a broadcast that is already ${broadcast.status.toLowerCase()}.`);
            }
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            if (action === BroadcastAction.APPROVE) {
                if (user.role !== 'SUPER_ADMIN') {
                    return res.status(common_1.HttpStatus.FORBIDDEN).json({ message: 'Only SUPER_ADMIN can approve broadcasts.' });
                }
                if (broadcast.status === client_1.BroadcastStatus.SENDING) {
                    if (approvalRequestId && broadcast.approvalRequestId === approvalRequestId) {
                        return res.json({ success: true, message: 'Broadcast execution initiated (idempotent).' });
                    }
                    throw new common_1.ConflictException('Broadcast has already been approved and is currently sending.');
                }
                const result = await this.notificationsService.approveAndSendBroadcast(id, user.id, approvalRequestId);
                await this.notificationsService.logAdminAudit(user.id, 'APPROVE_BROADCAST', 'Broadcast', id, { approvalRequestId }, ipAddress, userAgent);
                return res.json(result);
            }
            if (broadcast.status === client_1.BroadcastStatus.SENDING) {
                throw new common_1.ConflictException('Cannot cancel or reject a broadcast that is already in progress.');
            }
            const statusMap = {
                [BroadcastAction.REJECT]: client_1.BroadcastStatus.REJECTED,
                [BroadcastAction.CANCEL]: client_1.BroadcastStatus.CANCELLED,
            };
            await this.prisma.notificationBroadcast.update({
                where: { id },
                data: {
                    status: statusMap[action],
                    rejectedAt: action === BroadcastAction.REJECT ? new Date() : undefined,
                    cancelledAt: action === BroadcastAction.CANCEL ? new Date() : undefined,
                    cancelledByAdminId: action === BroadcastAction.CANCEL ? user.id : undefined,
                },
            });
            await this.notificationsService.logAdminAudit(user.id, action === BroadcastAction.REJECT ? 'REJECT_BROADCAST' : 'CANCEL_BROADCAST', 'Broadcast', id, undefined, ipAddress, userAgent);
            return res.json({ success: true, message: `Broadcast status updated to ${statusMap[action]}.` });
        }
        catch (err) {
            console.error('Broadcast action error:', err);
            if (err instanceof common_1.ConflictException) {
                return res.status(common_1.HttpStatus.CONFLICT).json({ message: err.message });
            }
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message || 'Internal server error' });
        }
    }
    async getDevices(res, userId, platform, browser, isActiveRaw, failureCountRaw, lastUsedBefore, limitRaw = '50', cursor) {
        try {
            const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10)));
            const isActive = isActiveRaw !== undefined ? isActiveRaw === 'true' : undefined;
            const failureCount = failureCountRaw ? parseInt(failureCountRaw, 10) : undefined;
            const result = await this.notificationsService.getAdminDevices({ userId, platform, browser, isActive, failureCount, lastUsedBefore }, limit, cursor);
            return res.json(result);
        }
        catch (err) {
            console.error('Get devices error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getDeliveries(res, status, channel, limitRaw = '50', cursor) {
        try {
            const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10)));
            const result = await this.notificationsService.getAdminDeliveries({ status, channel }, limit, cursor);
            return res.json(result);
        }
        catch (err) {
            console.error('Get deliveries error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async retryDeliveries(body, req, res) {
        try {
            const user = req.user;
            if (!body.deliveryIds || !Array.isArray(body.deliveryIds)) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Invalid deliveryIds.' });
            }
            const result = await this.notificationsService.bulkRetryDeliveries(body.deliveryIds);
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            await this.notificationsService.logAdminAudit(user.id, 'RETRY_DELIVERIES', 'Delivery', undefined, { deliveryIds: body.deliveryIds, affectedCount: result.count }, ipAddress, userAgent);
            return res.json(result);
        }
        catch (err) {
            console.error('Retry deliveries error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: err.message || 'Internal server error' });
        }
    }
    async retryDlq(req, res) {
        try {
            const user = req.user;
            const result = await this.notificationsService.bulkRetryDlq();
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            await this.notificationsService.logAdminAudit(user.id, 'RETRY_DLQ', 'Queue', undefined, { affectedCount: result.count }, ipAddress, userAgent);
            return res.json(result);
        }
        catch (err) {
            console.error('Retry DLQ error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async clearDlq(req, res) {
        try {
            const user = req.user;
            const result = await this.notificationsService.bulkClearDlq();
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            await this.notificationsService.logAdminAudit(user.id, 'CLEAR_DLQ', 'Queue', undefined, { affectedCount: result.count }, ipAddress, userAgent);
            return res.json(result);
        }
        catch (err) {
            console.error('Clear DLQ error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getSettings(res) {
        try {
            let global = await this.prisma.notificationGlobalSetting.findFirst();
            if (!global) {
                global = await this.prisma.notificationGlobalSetting.create({
                    data: {
                        pushEnabled: true,
                        emailEnabled: true,
                        socketEnabled: true,
                        bellEnabled: true,
                        toastEnabled: true,
                        smsEnabled: false,
                    },
                });
            }
            const events = await this.prisma.notificationEventSetting.findMany();
            return res.json({ global, events });
        }
        catch (err) {
            console.error('Fetch settings error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateSettings(body, req, res) {
        try {
            const user = req.user;
            const { global, events } = body;
            if (global) {
                const existing = await this.prisma.notificationGlobalSetting.findFirst();
                if (existing) {
                    await this.prisma.notificationGlobalSetting.update({
                        where: { id: existing.id },
                        data: {
                            pushEnabled: global.pushEnabled,
                            emailEnabled: global.emailEnabled,
                            socketEnabled: global.socketEnabled,
                            bellEnabled: global.bellEnabled,
                            toastEnabled: global.toastEnabled,
                            smsEnabled: global.smsEnabled,
                        },
                    });
                }
            }
            if (events && Array.isArray(events)) {
                for (const ev of events) {
                    const existingEvent = await this.prisma.notificationEventSetting.findUnique({
                        where: { event: ev.event },
                    });
                    if (existingEvent) {
                        await this.prisma.notificationEventSetting.update({
                            where: { id: existingEvent.id },
                            data: {
                                enabled: ev.enabled,
                                bellEnabled: ev.bellEnabled,
                                pushEnabled: ev.pushEnabled,
                                emailEnabled: ev.emailEnabled,
                                toastEnabled: ev.toastEnabled,
                                socketEnabled: ev.socketEnabled,
                                smsEnabled: ev.smsEnabled,
                            },
                        });
                    }
                    else {
                        await this.prisma.notificationEventSetting.create({
                            data: {
                                event: ev.event,
                                enabled: ev.enabled,
                                bellEnabled: ev.bellEnabled,
                                pushEnabled: ev.pushEnabled,
                                emailEnabled: ev.emailEnabled,
                                toastEnabled: ev.toastEnabled,
                                socketEnabled: ev.socketEnabled,
                                smsEnabled: ev.smsEnabled,
                            },
                        });
                    }
                }
            }
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            await this.notificationsService.logAdminAudit(user.id, 'UPDATE_SETTINGS', 'Setting', undefined, body, ipAddress, userAgent);
            return res.json({ success: true, message: 'Settings updated successfully' });
        }
        catch (err) {
            console.error('Update settings error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getTemplates(res) {
        try {
            const templates = await this.prisma.notificationTemplate.findMany();
            return res.json({ templates });
        }
        catch (err) {
            console.error('Fetch templates error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async updateTemplates(body, req, res) {
        try {
            const user = req.user;
            const { templates } = body;
            if (templates && Array.isArray(templates)) {
                for (const temp of templates) {
                    const existing = await this.prisma.notificationTemplate.findFirst({
                        where: {
                            event: temp.event,
                            channel: temp.channel,
                            version: temp.version || 1,
                        },
                    });
                    if (existing) {
                        await this.prisma.notificationTemplate.update({
                            where: { id: existing.id },
                            data: {
                                title: temp.title,
                                body: temp.body,
                            },
                        });
                    }
                    else {
                        await this.prisma.notificationTemplate.create({
                            data: {
                                event: temp.event,
                                channel: temp.channel,
                                version: temp.version || 1,
                                title: temp.title,
                                body: temp.body,
                            },
                        });
                    }
                }
            }
            const ipAddress = req.headers['x-forwarded-for'] || req.ip;
            const userAgent = req.headers['user-agent'];
            await this.notificationsService.logAdminAudit(user.id, 'UPDATE_TEMPLATES', 'Template', undefined, body, ipAddress, userAgent);
            return res.json({ success: true, message: 'Templates saved successfully' });
        }
        catch (err) {
            console.error('Update templates error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getAudits(req, res, pageRaw = '1', limitRaw = '20', action, adminId) {
        try {
            const page = Math.max(1, parseInt(pageRaw, 10));
            const limit = Math.max(1, Math.min(100, parseInt(limitRaw, 10)));
            const skip = (page - 1) * limit;
            const whereClause = {};
            if (action)
                whereClause.action = action;
            if (adminId)
                whereClause.adminId = adminId;
            const [audits, total] = await Promise.all([
                this.prisma.notificationAdminAudit.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        admin: {
                            select: { name: true, email: true },
                        },
                    },
                }),
                this.prisma.notificationAdminAudit.count({
                    where: whereClause,
                }),
            ]);
            return res.json({
                audits,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            });
        }
        catch (err) {
            console.error('Fetch audits error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
    async getAuditDetails(id, res) {
        try {
            const audit = await this.prisma.notificationAdminAudit.findUnique({
                where: { id },
                include: {
                    admin: {
                        select: { name: true, email: true },
                    },
                },
            });
            if (!audit) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'Audit log not found' });
            }
            return res.json({ audit });
        }
        catch (err) {
            console.error('Fetch audit details error:', err);
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error' });
        }
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('read-all'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "readAllNotifications", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "readNotification", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Get)('preferences'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)('preferences'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)('admin/analytics'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('admin/archive/stats'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getArchiveStats", null);
__decorate([
    (0, common_1.Get)('admin/health'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('admin/broadcasts'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getBroadcasts", null);
__decorate([
    (0, common_1.Post)('admin/broadcasts/preview'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "previewBroadcast", null);
__decorate([
    (0, common_1.Post)('admin/broadcasts'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "createBroadcast", null);
__decorate([
    (0, common_1.Post)('admin/broadcasts/:id/action'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "handleBroadcastAction", null);
__decorate([
    (0, common_1.Get)('admin/devices'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('platform')),
    __param(3, (0, common_1.Query)('browser')),
    __param(4, (0, common_1.Query)('isActive')),
    __param(5, (0, common_1.Query)('failureCount')),
    __param(6, (0, common_1.Query)('lastUsedBefore')),
    __param(7, (0, common_1.Query)('limit')),
    __param(8, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getDevices", null);
__decorate([
    (0, common_1.Get)('admin/deliveries'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('channel')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('cursor')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getDeliveries", null);
__decorate([
    (0, common_1.Post)('admin/deliveries/retry'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "retryDeliveries", null);
__decorate([
    (0, common_1.Post)('admin/dlq/retry'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "retryDlq", null);
__decorate([
    (0, common_1.Post)('admin/dlq/clear'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "clearDlq", null);
__decorate([
    (0, common_1.Get)('admin/settings'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('admin/settings'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('admin/templates'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Post)('admin/templates'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updateTemplates", null);
__decorate([
    (0, common_1.Get)('admin/audits'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('action')),
    __param(5, (0, common_1.Query)('adminId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getAudits", null);
__decorate([
    (0, common_1.Get)('admin/audits/:id'),
    (0, roles_guard_1.Roles)('SUPER_ADMIN', 'MANAGER', 'VIEWER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getAuditDetails", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map