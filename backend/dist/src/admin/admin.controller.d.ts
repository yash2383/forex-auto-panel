import type { Request, Response } from 'express';
import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    private getClientIp;
    getData(res: Response): Promise<Response<any, Record<string, any>>>;
    createUser(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updateUser(id: string, req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteUser(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createPartner(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    createPlan(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePlan(id: string, req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePlan(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSettings(res: Response): Promise<Response<any, Record<string, any>>>;
    updateSettings(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    createTrade(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    closeTrade(id: string, req: Request, body: {
        exitPrice?: number;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    approvePayment(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    rejectPayment(id: string, req: Request, body: {
        remark?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    verifyPayment(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    approveWithdrawal(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    rejectWithdrawal(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    reverseTransaction(id: string, req: Request, body: {
        reason: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
