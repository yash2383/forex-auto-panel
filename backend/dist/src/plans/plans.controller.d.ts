import type { Response } from 'express';
import { PlansService } from './plans.service';
export declare class PlansController {
    private plansService;
    constructor(plansService: PlansService);
    getPlans(res: Response): Promise<Response<any, Record<string, any>>>;
}
