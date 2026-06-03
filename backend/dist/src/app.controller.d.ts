import { AppService } from './app.service';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    submitInquiry(body: {
        name: string;
        email: string;
        subject: string;
        message: string;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        name: string;
        email: string;
        subject: string;
        message: string;
        updatedAt: Date;
    }>;
}
