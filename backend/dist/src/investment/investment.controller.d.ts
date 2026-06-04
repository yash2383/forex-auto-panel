import type { Request, Response } from 'express';
import { InvestmentService } from './investment.service';
export declare class InvestmentController {
    private investmentService;
    constructor(investmentService: InvestmentService);
    getPlansAdmin(partnerId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getPlanInvestors(planId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    createPlan(body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePlan(planId: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePlan(planId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getActivePlansUser(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserInvestments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createInvestment(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
