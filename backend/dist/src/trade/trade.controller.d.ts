import type { Request, Response } from 'express';
import { TradeService } from './trade.service';
export declare class TradeController {
    private tradeService;
    constructor(tradeService: TradeService);
    listTrades(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createTrade(req: Request, body: {
        pair?: string;
        type?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    closeTrade(req: Request, body: {
        tradeId: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
