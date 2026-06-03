import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
export declare class NotificationsCron {
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    handleDailyMaintenance(): Promise<void>;
    private cleanupExpiredTokens;
    private archiveOldNotifications;
    private aggregateDailyAnalytics;
    private cleanupExpiredAudits;
    handleStuckBroadcasts(): Promise<void>;
    reconcilePendingDeliveries(): Promise<void>;
}
