import type { Job, Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
export declare class PushProcessor {
    private readonly prisma;
    private readonly dlqQueue;
    private readonly logger;
    constructor(prisma: PrismaService, dlqQueue: Queue);
    handleDelivery(job: Job<any>): Promise<void>;
    private sendPushNotification;
}
export declare class EmailProcessor {
    private readonly prisma;
    private readonly dlqQueue;
    private readonly logger;
    constructor(prisma: PrismaService, dlqQueue: Queue);
    handleDelivery(job: Job<any>): Promise<void>;
    private sendEmailNotification;
}
export declare class SocketProcessor {
    private readonly prisma;
    private readonly gateway;
    private readonly dlqQueue;
    private readonly logger;
    constructor(prisma: PrismaService, gateway: NotificationsGateway, dlqQueue: Queue);
    handleDelivery(job: Job<any>): Promise<void>;
}
export declare class SmsProcessor {
    private readonly prisma;
    private readonly dlqQueue;
    private readonly logger;
    constructor(prisma: PrismaService, dlqQueue: Queue);
    handleDelivery(job: Job<any>): Promise<void>;
    private sendSmsNotification;
}
export declare class DlqProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    handleFailedJob(job: Job<any>): Promise<void>;
}
