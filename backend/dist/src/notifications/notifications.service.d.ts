import { PrismaService } from '../prisma/prisma.service';
import type { Queue } from 'bull';
import { NotificationEvent, NotificationChannel, NotificationAudience, Prisma } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
import { ObservabilityService } from '../observability/observability.service';
export declare class NotificationsService {
    private readonly prisma;
    private readonly pushQueue;
    private readonly emailQueue;
    private readonly socketQueue;
    private readonly smsQueue;
    private readonly dlqQueue;
    private readonly gateway;
    private readonly observabilityService;
    private readonly logger;
    private readonly MAX_RETRY_ENQUEUE_FAILURES;
    constructor(prisma: PrismaService, pushQueue: Queue, emailQueue: Queue, socketQueue: Queue, smsQueue: Queue, dlqQueue: Queue, gateway: NotificationsGateway, observabilityService: ObservabilityService);
    private compileTemplate;
    private enqueueWithTimeout;
    send(event: NotificationEvent, payload: Record<string, any>, userId?: string, partnerId?: string, idempotencyKey?: string, adminId?: string, customTitle?: string, customBody?: string, customChannels?: NotificationChannel[]): Promise<{
        id: string;
        partnerId: string | null;
        title: string;
        body: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        priority: import("@prisma/client").$Enums.NotificationPriority;
        link: string | null;
        userId: string | null;
        type: import("@prisma/client").$Enums.NotificationEvent;
        idempotencyKey: string | null;
        adminId: string | null;
        severity: import("@prisma/client").$Enums.NotificationSeverity;
        category: import("@prisma/client").$Enums.NotificationCategory;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    private fallbackSyncDispatch;
    sendToUser(userId: string, event: NotificationEvent, payload: Record<string, any>, idempotencyKey?: string): Promise<{
        id: string;
        partnerId: string | null;
        title: string;
        body: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        priority: import("@prisma/client").$Enums.NotificationPriority;
        link: string | null;
        userId: string | null;
        type: import("@prisma/client").$Enums.NotificationEvent;
        idempotencyKey: string | null;
        adminId: string | null;
        severity: import("@prisma/client").$Enums.NotificationSeverity;
        category: import("@prisma/client").$Enums.NotificationCategory;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    sendToAdmin(adminId: string, event: NotificationEvent, payload: Record<string, any>, idempotencyKey?: string): Promise<{
        id: string;
        partnerId: string | null;
        title: string;
        body: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        priority: import("@prisma/client").$Enums.NotificationPriority;
        link: string | null;
        userId: string | null;
        type: import("@prisma/client").$Enums.NotificationEvent;
        idempotencyKey: string | null;
        adminId: string | null;
        severity: import("@prisma/client").$Enums.NotificationSeverity;
        category: import("@prisma/client").$Enums.NotificationCategory;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    logAdminAudit(adminId: string, action: string, entityType?: string, entityId?: string, metadata?: any, ipAddress?: string, userAgent?: string): Promise<void>;
    getAdminAnalytics(): Promise<{
        hasData: boolean;
        metrics: never[];
        message: string;
        summary?: undefined;
    } | {
        hasData: boolean;
        metrics: {
            id: string;
            partnerId: string | null;
            createdAt: Date;
            date: Date;
            pushSent: number;
            emailSent: number;
            bellSent: number;
            socketSent: number;
            smsSent: number;
            opened: number;
            clicked: number;
            read: number;
            dismissed: number;
            failed: number;
        }[];
        summary: {
            totalSent: number;
            totalFailed: number;
            totalRead: number;
            openRate: number;
            channelSent: {
                push: number;
                email: number;
                bell: number;
                socket: number;
                sms: number;
            };
        };
        message?: undefined;
    }>;
    getArchiveStats(): Promise<{
        activeNotifications: number;
        archivedNotifications: number;
        archiveRatio: number;
    }>;
    resolveAudienceUsers(audience: NotificationAudience): Promise<{
        id: string;
        partnerId?: string;
    }[]>;
    previewBroadcast(audience: NotificationAudience): Promise<{
        resolvedAudience: number;
    }>;
    getAudiencePreviewDetails(audience: NotificationAudience): Promise<{
        total: number;
        online: number;
        active: number;
        expired: number;
        users: {
            id: string;
            name: string;
            email: string;
            plan: string;
            status: string;
            isOnline: boolean;
            isVerified: boolean;
            hasActiveInvestment: boolean;
        }[];
    }>;
    createBroadcast(adminId: string, payload: {
        title: string;
        body: string;
        audience: NotificationAudience;
        channels: NotificationChannel[];
        scheduledAt?: string;
    }): Promise<{
        type: string;
        record: {
            channels: {
                id: string;
                channel: import("@prisma/client").$Enums.NotificationChannel;
                scheduleId: string;
            }[];
        } & {
            id: string;
            partnerId: string | null;
            title: string;
            body: string;
            audience: import("@prisma/client").$Enums.NotificationAudience;
            status: import("@prisma/client").$Enums.NotificationScheduleStatus;
            createdAt: Date;
            updatedAt: Date;
            metadata: Prisma.JsonValue | null;
            event: import("@prisma/client").$Enums.NotificationEvent | null;
            scheduledAt: Date;
        };
    } | {
        type: string;
        record: {
            channels: {
                id: string;
                channel: import("@prisma/client").$Enums.NotificationChannel;
                broadcastId: string;
            }[];
        } & {
            id: string;
            partnerId: string | null;
            title: string;
            body: string;
            audience: import("@prisma/client").$Enums.NotificationAudience;
            status: import("@prisma/client").$Enums.BroadcastStatus;
            createdByAdminId: string;
            approvedByAdminId: string | null;
            cancelledByAdminId: string | null;
            totalUsers: number;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            cancelledAt: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            sentAt: Date | null;
            createdAt: Date;
            version: number;
            approvalRequestId: string | null;
        };
    }>;
    approveAndSendBroadcast(broadcastId: string, adminId: string, approvalRequestId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private executeBroadcastChunked;
    getAdminDevices(filters: {
        userId?: string;
        platform?: string;
        browser?: string;
        isActive?: boolean;
        failureCount?: number;
        lastUsedBefore?: string;
    }, limit?: number, cursor?: string): Promise<{
        devices: {
            id: string;
            createdAt: Date;
            token: string;
            userId: string;
            browser: string | null;
            platform: string | null;
            isActive: boolean;
            failureCount: number;
            lastUsedAt: Date | null;
        }[];
        nextCursor: string | undefined;
    }>;
    getAdminDeliveries(filters: {
        status?: string;
        channel?: string;
    }, limit?: number, cursor?: string): Promise<{
        deliveries: {
            error: string | null;
            id: string;
            status: import("@prisma/client").$Enums.NotificationDeliveryStatus;
            createdAt: Date;
            notificationId: string;
            channel: import("@prisma/client").$Enums.NotificationChannel;
            retryCount: number;
            lastRetryAt: Date | null;
            deliveredAt: Date | null;
        }[];
        nextCursor: string | undefined;
    }>;
    bulkRetryDeliveries(deliveryIds: string[]): Promise<{
        success: boolean;
        count: number;
    }>;
    bulkRetryDlq(): Promise<{
        success: boolean;
        count: number;
    }>;
    bulkClearDlq(): Promise<{
        success: boolean;
        count: number;
    }>;
    private getQueueByName;
    getQueueHealth(): Promise<{
        redis: string;
        redisConnected: boolean;
        push: {
            waiting: number;
            active: number;
            failed: number;
        };
        email: {
            waiting: number;
            active: number;
            failed: number;
        };
        socket: {
            waiting: number;
            active: number;
            failed: number;
        };
        sms: {
            waiting: number;
            active: number;
            failed: number;
        };
        dlq: {
            waiting: number;
            active: number;
            failed: number;
        };
        totals: {
            waiting: number;
            active: number;
            failed: number;
        };
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
}
