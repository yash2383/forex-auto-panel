import { NotificationEvent, NotificationCategory, NotificationPriority, NotificationSeverity, NotificationChannel } from '@prisma/client';
export interface EventDefinition {
    category: NotificationCategory;
    priority: NotificationPriority;
    severity: NotificationSeverity;
    channels: NotificationChannel[];
    title: string;
    body: string;
}
export declare const EVENT_REGISTRY: Record<NotificationEvent, EventDefinition>;
