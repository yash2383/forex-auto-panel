import type { Request, Response } from 'express';
import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    updateProfile(req: Request, body: {
        name?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    getPayments(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getSubscription(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    changePassword(req: Request, body: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
