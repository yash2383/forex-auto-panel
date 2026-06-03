import type { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private dashboardService;
    constructor(dashboardService: DashboardService);
    getData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    initiatePayment(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deposit(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    withdraw(req: Request, body: {
        amount: number;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    settings(req: Request, body: {
        autoTrading?: boolean;
        riskSetting?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    getMyPaymentStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
