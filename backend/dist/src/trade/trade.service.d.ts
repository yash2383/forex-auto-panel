import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class TradeService {
    private prisma;
    private readonly notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    listTrades(userId: string): Promise<{
        activeTrades: {
            id: any;
            pair: any;
            type: any;
            entryPrice: number;
            currentPrice: number;
            quantity: number;
            pnl: number;
            status: string;
            createdAt: any;
        }[];
        pastTrades: {
            id: any;
            pair: any;
            type: any;
            entryPrice: number;
            currentPrice: number;
            exitPrice: number;
            quantity: number;
            pnl: number;
            status: string;
            createdAt: any;
            closedAt: any;
        }[];
    }>;
    createTrade(userId: string, body?: {
        pair?: string;
        type?: string;
    }): Promise<{
        error: string;
        status: number;
        success?: undefined;
        trade?: undefined;
    } | {
        success: boolean;
        trade: {
            id: any;
            pair: any;
            type: any;
            entryPrice: number;
            currentPrice: number;
            quantity: number;
            pnl: number;
            status: string;
        };
        error?: undefined;
        status?: undefined;
    }>;
    closeTrade(userId: string, tradeId: string): Promise<{
        error: string;
        status: number;
        success?: undefined;
    } | {
        success: boolean;
        error?: undefined;
        status?: undefined;
    }>;
}
