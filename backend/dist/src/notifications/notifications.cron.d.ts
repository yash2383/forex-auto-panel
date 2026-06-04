import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { ObservabilityService } from '../observability/observability.service';
export declare class NotificationsCron {
    private readonly prisma;
    private readonly notificationsService;
    private readonly observabilityService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, observabilityService: ObservabilityService);
    handleDailyMaintenance(): Promise<void>;
    private cleanupExpiredTokens;
    private archiveOldNotifications;
    private aggregateDailyAnalytics;
    private cleanupExpiredAudits;
    handleStuckBroadcasts(): Promise<void>;
    reconcilePendingDeliveries(): Promise<void>;
    handleStuckPaymentInitiations(): Promise<void>;
}
