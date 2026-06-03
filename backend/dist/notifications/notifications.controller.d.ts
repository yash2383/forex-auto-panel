import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationCategory, NotificationAudience, NotificationChannel } from '@prisma/client';
import { NotificationsService } from './notifications.service';
export declare enum BroadcastAction {
    APPROVE = "APPROVE",
    REJECT = "REJECT",
    CANCEL = "CANCEL"
}
export declare class NotificationsController {
    private readonly prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private getOwnershipClause;
    getNotifications(req: Request, res: Response, pageRaw?: string, limitRaw?: string, status?: string): Promise<Response<any, Record<string, any>>>;
    readAllNotifications(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    readNotification(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteNotification(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getPreferences(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePreferences(req: Request, body: {
        category: NotificationCategory;
        pushEnabled?: boolean;
        emailEnabled?: boolean;
        bellEnabled?: boolean;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    registerDevice(req: Request, body: {
        token: string;
        platform?: string;
        browser?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    getAnalytics(res: Response): Promise<Response<any, Record<string, any>>>;
    getArchiveStats(res: Response): Promise<Response<any, Record<string, any>>>;
    getHealth(res: Response): Promise<Response<any, Record<string, any>>>;
    getBroadcasts(res: Response): Promise<Response<any, Record<string, any>>>;
    previewBroadcast(body: {
        audience: NotificationAudience;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    createBroadcast(req: Request, body: {
        title: string;
        body: string;
        audience: NotificationAudience;
        channels: NotificationChannel[];
        scheduledAt?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    handleBroadcastAction(id: string, body: {
        action: BroadcastAction;
        approvalRequestId?: string;
    }, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getDevices(res: Response, userId?: string, platform?: string, browser?: string, isActiveRaw?: string, failureCountRaw?: string, lastUsedBefore?: string, limitRaw?: string, cursor?: string): Promise<Response<any, Record<string, any>>>;
    getDeliveries(res: Response, status?: string, channel?: string, limitRaw?: string, cursor?: string): Promise<Response<any, Record<string, any>>>;
    retryDeliveries(body: {
        deliveryIds: string[];
    }, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    retryDlq(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    clearDlq(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSettings(res: Response): Promise<Response<any, Record<string, any>>>;
    updateSettings(body: any, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTemplates(res: Response): Promise<Response<any, Record<string, any>>>;
    updateTemplates(body: {
        templates: any[];
    }, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getAudits(req: Request, res: Response, pageRaw?: string, limitRaw?: string, action?: string, adminId?: string): Promise<Response<any, Record<string, any>>>;
    getAuditDetails(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
