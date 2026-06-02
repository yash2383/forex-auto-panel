import type { Request, Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTradingReport(res: Response): Promise<Response<any, Record<string, any>>>;
    getProfitReport(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getPnlDistribution(res: Response): Promise<Response<any, Record<string, any>>>;
    getMonthlyPnl(res: Response): Promise<Response<any, Record<string, any>>>;
    getWalletStatement(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTaxSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getHistory(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    exportReport(req: Request, res: Response, type: string, format: string): Promise<Response<any, Record<string, any>>>;
}
