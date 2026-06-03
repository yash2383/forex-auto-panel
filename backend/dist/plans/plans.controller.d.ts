import type { Response } from 'express';
import { PlansService } from './plans.service';
export declare class PlansController {
    private plansService;
    constructor(plansService: PlansService);
    getPlans(res: Response): Promise<Response<any, Record<string, any>>>;
    getAllPlans(res: Response): Promise<Response<any, Record<string, any>>>;
    createPlan(body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    updatePlan(id: string, body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    deletePlan(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
