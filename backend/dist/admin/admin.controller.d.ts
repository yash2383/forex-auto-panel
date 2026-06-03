import type { Request, Response } from 'express';
import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    private getClientIp;
    getData(res: Response): Promise<Response<any, Record<string, any>>>;
    getPnlReports(res: Response): Promise<Response<any, Record<string, any>>>;
    createUser(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updateUser(id: string, req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteUser(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getUserDetail(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    createPartner(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    createPlan(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePlan(id: string, req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePlan(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSettings(res: Response): Promise<Response<any, Record<string, any>>>;
    updateSettings(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getReferralSettings(res: Response): Promise<Response<any, Record<string, any>>>;
    updateReferralSettings(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getReferrals(res: Response): Promise<Response<any, Record<string, any>>>;
    updateReferralStatus(id: string, status: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getTrades(res: Response): Promise<Response<any, Record<string, any>>>;
    createTradeRecord(body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updateTradeRecord(id: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteTradeRecord(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    publishTradeRecord(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    unpublishTradeRecord(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    approvePayment(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    rejectPayment(id: string, req: Request, body: {
        remark?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    verifyPayment(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    listWithdrawals(res: Response): Promise<Response<any, Record<string, any>>>;
    getWithdrawalDetail(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    approveWithdrawal(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    rejectWithdrawal(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    reverseTransaction(id: string, req: Request, body: {
        reason: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    bulkDistributeProfit(req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    createProfitDistribution(body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updateProfitDistribution(id: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deleteProfitDistribution(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getInquiries(res: Response): Promise<Response<any, Record<string, any>>>;
    updateInquiryStatus(id: string, body: {
        status: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    getInitiatedPayments(res: Response): Promise<Response<any, Record<string, any>>>;
    updateInitiatedPayment(id: string, req: Request, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
