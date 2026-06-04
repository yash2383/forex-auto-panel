import { NotificationsService } from '../notifications/notifications.service';
import { NotificationEvent } from '@prisma/client';
export declare class DevController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    testNotification(body: {
        event: NotificationEvent;
        payload: Record<string, any>;
        userId: string;
        partnerId?: string;
        idempotencyKey?: string;
    }): Promise<{
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
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        deletedAt: Date | null;
    }>;
}
