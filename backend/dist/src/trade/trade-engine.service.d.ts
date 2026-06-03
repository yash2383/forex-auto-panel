import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TradeEngineService implements OnModuleInit {
    private prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    onModuleInit(): void;
    private tickAndSettle;
    private autoTradeSpawn;
}
