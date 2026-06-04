import type { Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
export declare class TradesController {
    private prisma;
    constructor(prisma: PrismaService);
    getPublicTrades(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
