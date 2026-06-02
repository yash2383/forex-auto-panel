import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        email: string;
        password: string;
    }, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    signup(body: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        partnerSlug?: string;
        referralCode?: string;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    me(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(res: Response): Promise<Response<any, Record<string, any>>>;
}
