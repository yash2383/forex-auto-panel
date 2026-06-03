import { PrismaService } from '../prisma/prisma.service';
import type { Queue } from 'bull';
import { NotificationEvent, NotificationChannel, NotificationAudience, Prisma } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
export declare class NotificationsService {
    private readonly prisma;
    private readonly pushQueue;
    private readonly emailQueue;
    private readonly socketQueue;
    private readonly smsQueue;
    private readonly dlqQueue;
    private readonly gateway;
    private readonly logger;
    constructor(prisma: PrismaService, pushQueue: Queue, emailQueue: Queue, socketQueue: Queue, smsQueue: Queue, dlqQueue: Queue, gateway: NotificationsGateway);
    private compileTemplate;
    send(event: NotificationEvent, payload: Record<string, any>, userId?: string, partnerId?: string, idempotencyKey?: string, adminId?: string, customTitle?: string, customBody?: string, customChannels?: NotificationChannel[]): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        priority: import("@prisma/client").$Enums.NotificationPriority;
        partnerId: string | null;
        link: string | null;
        userId: string | null;
        idempotencyKey: string | null;
        adminId: string | null;
        title: string;
        body: string;
        type: import("@prisma/client").$Enums.NotificationEvent;
        severity: import("@prisma/client").$Enums.NotificationSeverity;
        category: import("@prisma/client").$Enums.NotificationCategory;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    private fallbackSyncDispatch;
    sendToUser(userId: string, event: NotificationEvent, payload: Record<string, any>, idempotencyKey?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        priority: import("@prisma/client").$Enums.NotificationPriority;
        partnerId: string | null;
        link: string | null;
        userId: string | null;
        idempotencyKey: string | null;
        adminId: string | null;
        title: string;
        body: string;
        type: import("@prisma/client").$Enums.NotificationEvent;
        severity: import("@prisma/client").$Enums.NotificationSeverity;
        category: import("@prisma/client").$Enums.NotificationCategory;
        metadata: Prisma.JsonValue | null;
        deletedAt: Date | null;
    }>;
    sendToAdmin(adminId: string, event: NotificationEvent, payload: Record<string, any>, idempotencyKey?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.NotificationStatus;
        createdAt: Date;
        priority: import("@prisma/client").$Enums.NotificationPriority;
        partnerId: string | null;
        link: string | null;
        userId: string | null;
        idempotencyKey: string | null;
        adminId: string | null;
        title: string;
        body: string;
        type: import("@prisma/client").$Enums.NotificationEvent;
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
            createdAt: Date;
            date: Date;
            partnerId: string | null;
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
            status: import("@prisma/client").$Enums.NotificationScheduleStatus;
            createdAt: Date;
            updatedAt: Date;
            partnerId: string | null;
            title: string;
            body: string;
            metadata: Prisma.JsonValue | null;
            event: import("@prisma/client").$Enums.NotificationEvent | null;
            audience: import("@prisma/client").$Enums.NotificationAudience;
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
            status: import("@prisma/client").$Enums.BroadcastStatus;
            createdAt: Date;
            version: number;
            partnerId: string | null;
            title: string;
            body: string;
            audience: import("@prisma/client").$Enums.NotificationAudience;
            totalUsers: number;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            cancelledAt: Date | null;
            startedAt: Date | null;
            completedAt: Date | null;
            sentAt: Date | null;
            approvalRequestId: string | null;
            createdByAdminId: string;
            approvedByAdminId: string | null;
            cancelledByAdminId: string | null;
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
            notificationId: string;
            channel: import("@prisma/client").$Enums.NotificationChannel;
            status: import("@prisma/client").$Enums.NotificationDeliveryStatus;
            retryCount: number;
            lastRetryAt: Date | null;
            deliveredAt: Date | null;
            createdAt: Date;
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
